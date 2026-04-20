const { v4: uuidv4 } = require('uuid');
const { db, Timestamp } = require('../config/firebase');
const HttpError = require('../utils/httpError');
const { uploadBuffer } = require('../utils/firebaseStorage');
const { updateHabitForDonor } = require('../utils/habitStats');

const submitDelivery = async (req, res) => {
  const { ngoId, needId, itemsDelivered, donorName, lat, lng } = req.body;

  if (!ngoId || !needId || !itemsDelivered) {
    throw new HttpError(400, 'NGO, need, and items delivered are required.');
  }

  if (!req.file) {
    throw new HttpError(400, 'Delivery proof image is required.');
  }

  const [ngoSnap, needSnap] = await Promise.all([
    db.collection('ngos').doc(ngoId).get(),
    db.collection('needs').doc(needId).get(),
  ]);

  if (!ngoSnap.exists || !ngoSnap.data().isActive) {
    throw new HttpError(404, 'The selected NGO is not available.');
  }

  if (!needSnap.exists || needSnap.data().ngoId !== ngoId) {
    throw new HttpError(404, 'Selected need was not found for this NGO.');
  }

  const deliveryId = uuidv4();
  const upload = await uploadBuffer({
    buffer: req.file.buffer,
    destination: `proofs/${req.user.uid}/${Date.now()}-${req.file.originalname}`,
    mimetype: req.file.mimetype,
    metadata: {
      donorUid: req.user.uid,
      deliveryId,
      ngoId,
      needId,
    },
  });

  await db.collection('deliveries').doc(deliveryId).set({
    deliveryId,
    donorUid: req.user.uid,
    donorName: donorName || req.user.name || req.user.email,
    ngoId,
    ngoName: ngoSnap.data().name,
    needId,
    itemsDelivered,
    proofImageUrl: upload.url,
    proofImagePath: upload.path,
    lat: lat ? Number(lat) : null,
    lng: lng ? Number(lng) : null,
    deliveredAt: Timestamp.now(),
    status: 'pending',
    rejectionReason: null,
    certificateId: null,
    certificateUrl: null,
    verifiedAt: null,
  });

  const habit = await updateHabitForDonor(req.user.uid);

  res.status(201).json({
    message: 'Delivery proof submitted successfully.',
    deliveryId,
    status: 'pending',
    habit,
  });
};

const getMyDeliveries = async (req, res) => {
  const snapshot = await db
    .collection('deliveries')
    .where('donorUid', '==', req.user.uid)
    .orderBy('deliveredAt', 'desc')
    .get();

  res.json({
    deliveries: snapshot.docs.map((doc) => doc.data()),
  });
};

const getDeliveryCertificate = async (req, res) => {
  const deliverySnap = await db.collection('deliveries').doc(req.params.id).get();

  if (!deliverySnap.exists) {
    throw new HttpError(404, 'Delivery not found.');
  }

  const delivery = deliverySnap.data();
  const canAccess =
    delivery.donorUid === req.user.uid ||
    req.user.role === 'super_admin' ||
    (req.user.role === 'ngo_admin' && req.user.ngoId === delivery.ngoId);

  if (!canAccess) {
    throw new HttpError(403, 'You do not have permission to view this certificate.');
  }

  if (!delivery.certificateUrl) {
    throw new HttpError(404, 'Certificate is not available yet.');
  }

  res.json({
    certificateUrl: delivery.certificateUrl,
    certificateId: delivery.certificateId,
    delivery,
  });
};

module.exports = {
  submitDelivery,
  getMyDeliveries,
  getDeliveryCertificate,
};

