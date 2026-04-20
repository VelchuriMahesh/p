const { v4: uuidv4 } = require('uuid');
const { db, Timestamp } = require('../config/firebase');
const HttpError = require('../utils/httpError');
const { uploadBuffer } = require('../utils/firebaseStorage');
const { updateHabitForDonor } = require('../utils/habitStats');

const isValidUTR = (value) => /^[A-Za-z0-9]{12,}$/.test(String(value || '').trim());

const submitDonation = async (req, res) => {
  const { ngoId, amount, utr, donorName } = req.body;

  if (!ngoId || !amount || !utr) {
    throw new HttpError(400, 'NGO, amount, and UTR are required.');
  }

  if (!isValidUTR(utr)) {
    throw new HttpError(400, 'UTR must be alphanumeric and at least 12 characters long.');
  }

  if (Number(amount) <= 0) {
    throw new HttpError(400, 'Amount must be a positive number.');
  }

  if (!req.file) {
    throw new HttpError(400, 'Donation screenshot is required.');
  }

  const [ngoSnap, duplicateUtrSnap] = await Promise.all([
    db.collection('ngos').doc(ngoId).get(),
    db.collection('donations').where('utr', '==', utr.trim()).limit(1).get(),
  ]);

  if (!ngoSnap.exists || !ngoSnap.data().isActive) {
    throw new HttpError(404, 'The selected NGO is not available.');
  }

  if (!duplicateUtrSnap.empty) {
    throw new HttpError(400, 'Duplicate UTR number.');
  }

  const donationId = uuidv4();
  const upload = await uploadBuffer({
    buffer: req.file.buffer,
    destination: `screenshots/${req.user.uid}/${Date.now()}-${req.file.originalname}`,
    mimetype: req.file.mimetype,
    metadata: {
      donationId,
      donorUid: req.user.uid,
      ngoId,
    },
  });

  await db.collection('donations').doc(donationId).set({
    donationId,
    donorUid: req.user.uid,
    donorName: donorName || req.user.name || req.user.email,
    ngoId,
    ngoName: ngoSnap.data().name,
    amount: Number(amount),
    utr: utr.trim(),
    screenshotUrl: upload.url,
    screenshotPath: upload.path,
    status: 'pending',
    rejectionReason: null,
    certificateId: null,
    certificateUrl: null,
    createdAt: Timestamp.now(),
    verifiedAt: null,
  });

  const habit = await updateHabitForDonor(req.user.uid);

  res.status(201).json({
    message: 'Donation submitted successfully.',
    donationId,
    status: 'pending',
    habit,
  });
};

const getMyDonations = async (req, res) => {
  const snapshot = await db
    .collection('donations')
    .where('donorUid', '==', req.user.uid)
    .orderBy('createdAt', 'desc')
    .get();

  res.json({
    donations: snapshot.docs.map((doc) => doc.data()),
  });
};

const getDonationCertificate = async (req, res) => {
  const donationSnap = await db.collection('donations').doc(req.params.id).get();

  if (!donationSnap.exists) {
    throw new HttpError(404, 'Donation not found.');
  }

  const donation = donationSnap.data();
  const canAccess =
    donation.donorUid === req.user.uid ||
    req.user.role === 'super_admin' ||
    (req.user.role === 'ngo_admin' && req.user.ngoId === donation.ngoId);

  if (!canAccess) {
    throw new HttpError(403, 'You do not have permission to view this certificate.');
  }

  if (!donation.certificateUrl) {
    throw new HttpError(404, 'Certificate is not available yet.');
  }

  res.json({
    certificateUrl: donation.certificateUrl,
    certificateId: donation.certificateId,
    donation,
  });
};

module.exports = {
  submitDonation,
  getMyDonations,
  getDonationCertificate,
};
