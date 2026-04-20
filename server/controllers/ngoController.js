const { v4: uuidv4 } = require('uuid');
const { db, FieldValue, Timestamp } = require('../config/firebase');
const HttpError = require('../utils/httpError');
const { uploadBuffer } = require('../utils/firebaseStorage');
const { createNotification } = require('./notificationController');
const {
  incrementPlatformStats,
  estimateMealsFromDonation,
  estimateMealsFromDelivery,
  updateLeaderboard,
} = require('../utils/platformStats');
const { generateCertificate } = require('../utils/generateCertificate');

const getMyNgoDoc = async (req) => {
  const ngoId = req.user.ngoId;

  if (!ngoId) {
    throw new HttpError(400, 'No NGO is linked to this account.');
  }

  const ref = db.collection('ngos').doc(ngoId);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new HttpError(404, 'NGO profile not found.');
  }

  return {
    ref,
    data: snapshot.data(),
  };
};

const getMyNgoProfile = async (req, res) => {
  const ngo = await getMyNgoDoc(req);
  res.json({ ngo: ngo.data });
};

const updateProfile = async (req, res) => {
  const ngo = await getMyNgoDoc(req);
  const updates = {};

  ['name', 'description', 'address', 'phone', 'email', 'upiId', 'section80G', 'lat', 'lng'].forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = ['lat', 'lng'].includes(field) ? Number(req.body[field]) : req.body[field];
    }
  });

  if (req.files?.qrCode?.[0]) {
    const qrFile = req.files.qrCode[0];
    const upload = await uploadBuffer({
      buffer: qrFile.buffer,
      destination: `qr/${ngo.data.ngoId}/${Date.now()}-${qrFile.originalname}`,
      mimetype: qrFile.mimetype,
      metadata: {
        ngoId: ngo.data.ngoId,
        uploadedBy: req.user.uid,
      },
    });

    updates.qrCodeUrl = upload.url;
    updates.qrCodePath = upload.path;
  }

  if (req.files?.logo?.[0]) {
    const logoFile = req.files.logo[0];
    const upload = await uploadBuffer({
      buffer: logoFile.buffer,
      destination: `ngo-media/${ngo.data.ngoId}/${Date.now()}-${logoFile.originalname}`,
      mimetype: logoFile.mimetype,
      metadata: {
        ngoId: ngo.data.ngoId,
        uploadedBy: req.user.uid,
        usage: 'logo',
      },
    });

    updates.logoUrl = upload.url;
    updates.logoPath = upload.path;
  }

  updates.updatedAt = Timestamp.now();
  await ngo.ref.set(updates, { merge: true });

  const updatedNgo = await ngo.ref.get();
  res.json({
    message: 'NGO profile updated successfully.',
    ngo: updatedNgo.data(),
  });
};

const uploadQrCode = async (req, res) => {
  if (!req.file) {
    throw new HttpError(400, 'QR image is required.');
  }

  const ngo = await getMyNgoDoc(req);
  const upload = await uploadBuffer({
    buffer: req.file.buffer,
    destination: `qr/${ngo.data.ngoId}/${Date.now()}-${req.file.originalname}`,
    mimetype: req.file.mimetype,
    metadata: {
      ngoId: ngo.data.ngoId,
      uploadedBy: req.user.uid,
    },
  });

  await ngo.ref.set(
    {
      qrCodeUrl: upload.url,
      qrCodePath: upload.path,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );

  res.json({
    message: 'QR code uploaded successfully.',
    qrCodeUrl: upload.url,
  });
};

const createNeed = async (req, res) => {
  const ngo = await getMyNgoDoc(req);
  const needId = uuidv4();
  const { title, description, type, urgency, suggestedAmount, expiresAt } = req.body;

  if (!title || !description || !type || !urgency) {
    throw new HttpError(400, 'Title, description, type, and urgency are required.');
  }

  await db.collection('needs').doc(needId).set({
    needId,
    ngoId: ngo.data.ngoId,
    title,
    description,
    type,
    urgency,
    suggestedAmount: suggestedAmount ? Number(suggestedAmount) : null,
    isActive: true,
    createdAt: Timestamp.now(),
    expiresAt: expiresAt ? Timestamp.fromDate(new Date(expiresAt)) : null,
  });

  res.status(201).json({ message: 'Need created successfully.', needId });
};

const updateNeed = async (req, res) => {
  const ngo = await getMyNgoDoc(req);
  const needRef = db.collection('needs').doc(req.params.id);
  const needSnap = await needRef.get();

  if (!needSnap.exists || needSnap.data().ngoId !== ngo.data.ngoId) {
    throw new HttpError(404, 'Need not found.');
  }

  const updates = {};
  ['title', 'description', 'type', 'urgency', 'isActive'].forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (req.body.suggestedAmount !== undefined) {
    updates.suggestedAmount = req.body.suggestedAmount ? Number(req.body.suggestedAmount) : null;
  }

  if (req.body.expiresAt !== undefined) {
    updates.expiresAt = req.body.expiresAt ? Timestamp.fromDate(new Date(req.body.expiresAt)) : null;
  }

  await needRef.set(updates, { merge: true });
  res.json({ message: 'Need updated successfully.' });
};

const deleteNeed = async (req, res) => {
  const ngo = await getMyNgoDoc(req);
  const needRef = db.collection('needs').doc(req.params.id);
  const needSnap = await needRef.get();

  if (!needSnap.exists || needSnap.data().ngoId !== ngo.data.ngoId) {
    throw new HttpError(404, 'Need not found.');
  }

  await needRef.delete();
  res.json({ message: 'Need deleted successfully.' });
};

const createPost = async (req, res) => {
  if (!req.file) {
    throw new HttpError(400, 'A media file is required.');
  }

  const ngo = await getMyNgoDoc(req);
  const postId = uuidv4();
  const upload = await uploadBuffer({
    buffer: req.file.buffer,
    destination: `ngo-media/${ngo.data.ngoId}/${Date.now()}-${req.file.originalname}`,
    mimetype: req.file.mimetype,
    metadata: {
      postId,
      ngoId: ngo.data.ngoId,
      uploadedBy: req.user.uid,
    },
  });

  await db.collection('posts').doc(postId).set({
    postId,
    ngoId: ngo.data.ngoId,
    ngoName: ngo.data.name,
    ngoLogoUrl: ngo.data.logoUrl || '',
    mediaUrl: upload.url,
    mediaType: 'image',
    caption: req.body.caption || '',
    likes: 0,
    likedBy: [],
    comments: [],
    createdAt: Timestamp.now(),
  });

  res.status(201).json({ message: 'Post published successfully.', postId, mediaUrl: upload.url });
};

const deletePost = async (req, res) => {
  const ngo = await getMyNgoDoc(req);
  const postRef = db.collection('posts').doc(req.params.id);
  const postSnap = await postRef.get();

  if (!postSnap.exists || postSnap.data().ngoId !== ngo.data.ngoId) {
    throw new HttpError(404, 'Post not found.');
  }

  await postRef.delete();
  res.json({ message: 'Post deleted successfully.' });
};

const getNgoDonations = async (req, res) => {
  const ngo = await getMyNgoDoc(req);
  const snapshot = await db.collection('donations').where('ngoId', '==', ngo.data.ngoId).orderBy('createdAt', 'desc').get();

  res.json({
    donations: snapshot.docs.map((doc) => doc.data()),
  });
};

const getNgoDeliveries = async (req, res) => {
  const ngo = await getMyNgoDoc(req);
  const snapshot = await db.collection('deliveries').where('ngoId', '==', ngo.data.ngoId).orderBy('deliveredAt', 'desc').get();

  res.json({
    deliveries: snapshot.docs.map((doc) => doc.data()),
  });
};

const verifyDonation = async (req, res) => {
  const ngo = await getMyNgoDoc(req);
  const donationRef = db.collection('donations').doc(req.params.id);
  const donationSnap = await donationRef.get();

  if (!donationSnap.exists || donationSnap.data().ngoId !== ngo.data.ngoId) {
    throw new HttpError(404, 'Donation not found.');
  }

  const donation = donationSnap.data();

  if (donation.status === 'verified') {
    throw new HttpError(400, 'Donation has already been verified.');
  }

  const certificate = await generateCertificate({
    type: 'donation',
    donorUid: donation.donorUid,
    donorName: donation.donorName,
    ngo: ngo.data,
    amount: donation.amount,
    referenceValue: donation.utr,
    issuedAt: new Date(),
    verificationBaseUrl: process.env.CERTIFICATE_VERIFY_BASE_URL || 'http://localhost:5173',
  });

  const estimatedMeals = estimateMealsFromDonation(donation.amount);

  await Promise.all([
    donationRef.set(
      {
        status: 'verified',
        rejectionReason: null,
        verifiedAt: Timestamp.now(),
        certificateId: certificate.certificateId,
        certificateUrl: certificate.certificateUrl,
        certificatePath: certificate.certificatePath,
      },
      { merge: true }
    ),
    db.collection('users').doc(donation.donorUid).set(
      {
        totalDonated: FieldValue.increment(Number(donation.amount)),
      },
      { merge: true }
    ),
    ngo.ref.set(
      {
        totalReceived: FieldValue.increment(Number(donation.amount)),
        mealsServed: FieldValue.increment(estimatedMeals),
      },
      { merge: true }
    ),
    incrementPlatformStats({
      totalDonationsAmount: Number(donation.amount),
      totalMeals: estimatedMeals,
    }),
    updateLeaderboard({
      donorUid: donation.donorUid,
      donorName: donation.donorName,
      donorPhotoURL: null,
      donationAmount: Number(donation.amount),
      deliveryCount: 0,
    }),
    createNotification({
      recipientUid: donation.donorUid,
      title: 'Donation verified',
      body: `Your donation to ${donation.ngoName} has been verified. Your certificate is ready.`,
      type: 'donation_verified',
    }),
  ]);

  res.json({
    message: 'Donation verified successfully.',
    certificateUrl: certificate.certificateUrl,
  });
};

const rejectDonation = async (req, res) => {
  const ngo = await getMyNgoDoc(req);
  const donationRef = db.collection('donations').doc(req.params.id);
  const donationSnap = await donationRef.get();

  if (!donationSnap.exists || donationSnap.data().ngoId !== ngo.data.ngoId) {
    throw new HttpError(404, 'Donation not found.');
  }

  const reason = req.body.reason?.trim();

  if (!reason) {
    throw new HttpError(400, 'A rejection reason is required.');
  }

  await Promise.all([
    donationRef.set(
      {
        status: 'rejected',
        rejectionReason: reason,
        verifiedAt: Timestamp.now(),
      },
      { merge: true }
    ),
    createNotification({
      recipientUid: donationSnap.data().donorUid,
      title: 'Donation needs attention',
      body: reason,
      type: 'donation_rejected',
    }),
  ]);

  res.json({ message: 'Donation rejected successfully.' });
};

const verifyDelivery = async (req, res) => {
  const ngo = await getMyNgoDoc(req);
  const deliveryRef = db.collection('deliveries').doc(req.params.id);
  const deliverySnap = await deliveryRef.get();

  if (!deliverySnap.exists || deliverySnap.data().ngoId !== ngo.data.ngoId) {
    throw new HttpError(404, 'Delivery not found.');
  }

  const delivery = deliverySnap.data();

  if (delivery.status === 'verified') {
    throw new HttpError(400, 'Delivery has already been verified.');
  }

  const certificate = await generateCertificate({
    type: 'delivery',
    donorUid: delivery.donorUid,
    donorName: delivery.donorName,
    ngo: ngo.data,
    itemsDelivered: delivery.itemsDelivered,
    referenceValue: delivery.deliveryId,
    issuedAt: new Date(),
    verificationBaseUrl: process.env.CERTIFICATE_VERIFY_BASE_URL || 'http://localhost:5173',
  });

  const estimatedMeals = estimateMealsFromDelivery(delivery.itemsDelivered);

  await Promise.all([
    deliveryRef.set(
      {
        status: 'verified',
        verifiedAt: Timestamp.now(),
        certificateId: certificate.certificateId,
        certificateUrl: certificate.certificateUrl,
        certificatePath: certificate.certificatePath,
      },
      { merge: true }
    ),
    db.collection('users').doc(delivery.donorUid).set(
      {
        totalDeliveries: FieldValue.increment(1),
      },
      { merge: true }
    ),
    ngo.ref.set(
      {
        mealsServed: FieldValue.increment(estimatedMeals),
      },
      { merge: true }
    ),
    incrementPlatformStats({
      totalDeliveries: 1,
      totalMeals: estimatedMeals,
    }),
    updateLeaderboard({
      donorUid: delivery.donorUid,
      donorName: delivery.donorName,
      donorPhotoURL: null,
      donationAmount: 0,
      deliveryCount: 1,
    }),
    createNotification({
      recipientUid: delivery.donorUid,
      title: 'Delivery verified',
      body: `Your delivery for ${delivery.ngoName} has been verified. Your certificate is ready.`,
      type: 'delivery_verified',
    }),
  ]);

  res.json({
    message: 'Delivery verified successfully.',
    certificateUrl: certificate.certificateUrl,
  });
};

const rejectDelivery = async (req, res) => {
  const ngo = await getMyNgoDoc(req);
  const deliveryRef = db.collection('deliveries').doc(req.params.id);
  const deliverySnap = await deliveryRef.get();

  if (!deliverySnap.exists || deliverySnap.data().ngoId !== ngo.data.ngoId) {
    throw new HttpError(404, 'Delivery not found.');
  }

  const reason = req.body.reason?.trim();

  if (!reason) {
    throw new HttpError(400, 'A rejection reason is required.');
  }

  await Promise.all([
    deliveryRef.set(
      {
        status: 'rejected',
        rejectionReason: reason,
        verifiedAt: Timestamp.now(),
      },
      { merge: true }
    ),
    createNotification({
      recipientUid: deliverySnap.data().donorUid,
      title: 'Delivery needs attention',
      body: reason,
      type: 'delivery_rejected',
    }),
  ]);

  res.json({ message: 'Delivery rejected successfully.' });
};

module.exports = {
  getMyNgoProfile,
  updateProfile,
  uploadQrCode,
  createNeed,
  updateNeed,
  deleteNeed,
  createPost,
  deletePost,
  getNgoDonations,
  verifyDonation,
  rejectDonation,
  getNgoDeliveries,
  verifyDelivery,
  rejectDelivery,
};
