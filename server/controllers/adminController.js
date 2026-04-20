const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { auth, db, Timestamp } = require('../config/firebase');
const HttpError = require('../utils/httpError');
const { incrementPlatformStats } = require('../utils/platformStats');

const validateNgoPayload = (payload) => {
  const requiredFields = ['name', 'adminEmail', 'adminPassword', 'address', 'lat', 'lng', 'phone', 'description'];

  requiredFields.forEach((field) => {
    if (!payload[field] && payload[field] !== 0) {
      throw new HttpError(400, `${field} is required.`);
    }
  });
};

const createNgo = async (req, res) => {
  validateNgoPayload(req.body);

  const {
    name,
    adminEmail,
    adminPassword,
    address,
    lat,
    lng,
    phone,
    description,
    email = adminEmail,
  } = req.body;

  const ngoId = uuidv4();
  const userRecord = await auth.createUser({
    email: adminEmail,
    password: adminPassword,
    displayName: `${name} Admin`,
  });

  await auth.setCustomUserClaims(userRecord.uid, {
    role: 'ngo_admin',
    ngoId,
  });

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const batch = db.batch();

  batch.set(db.collection('ngos').doc(ngoId), {
    ngoId,
    name,
    description,
    adminUid: userRecord.uid,
    address,
    lat: Number(lat),
    lng: Number(lng),
    phone,
    email,
    upiId: '',
    qrCodeUrl: '',
    qrCodePath: '',
    logoUrl: '',
    logoPath: '',
    section80G: '',
    isActive: true,
    totalReceived: 0,
    mealsServed: 0,
    createdAt: Timestamp.now(),
  });

  batch.set(db.collection('users').doc(userRecord.uid), {
    uid: userRecord.uid,
    email: adminEmail,
    name: `${name} Admin`,
    role: 'ngo_admin',
    photoURL: null,
    ngoId,
    createdAt: Timestamp.now(),
    totalDonated: 0,
    totalDeliveries: 0,
    streakDays: 0,
    lastHabitDate: null,
  });

  batch.set(db.collection('provisioning').doc(userRecord.uid), {
    uid: userRecord.uid,
    passwordHash,
    createdBy: req.user.uid,
    createdAt: Timestamp.now(),
    type: 'ngo_admin',
  });

  await batch.commit();
  await incrementPlatformStats({ totalNgos: 1 });

  res.status(201).json({
    message: 'NGO admin account created successfully.',
    ngo: {
      ngoId,
      adminUid: userRecord.uid,
      adminEmail,
      temporaryPassword: adminPassword,
    },
  });
};

const listNgos = async (req, res) => {
  const snapshot = await db.collection('ngos').orderBy('createdAt', 'desc').get();
  res.json({ ngos: snapshot.docs.map((doc) => doc.data()) });
};

const updateNgo = async (req, res) => {
  const ngoRef = db.collection('ngos').doc(req.params.id);
  const ngoSnap = await ngoRef.get();

  if (!ngoSnap.exists) {
    throw new HttpError(404, 'NGO not found.');
  }

  const allowedFields = ['name', 'description', 'address', 'lat', 'lng', 'phone', 'email', 'upiId', 'section80G', 'isActive'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = ['lat', 'lng'].includes(field) ? Number(req.body[field]) : req.body[field];
    }
  });

  updates.updatedAt = Timestamp.now();

  await ngoRef.set(updates, { merge: true });
  res.json({ message: 'NGO updated successfully.' });
};

const getStats = async (req, res) => {
  const [ngosSnap, usersSnap, statsSnap, donationsSnap, deliveriesSnap] = await Promise.all([
    db.collection('ngos').get(),
    db.collection('users').where('role', '==', 'donor').get(),
    db.collection('stats').doc('platform').get(),
    db.collection('donations').orderBy('createdAt', 'desc').limit(5).get(),
    db.collection('deliveries').orderBy('deliveredAt', 'desc').limit(5).get(),
  ]);

  const stats = statsSnap.exists
    ? statsSnap.data()
    : {
        totalDonationsAmount: 0,
        totalDeliveries: 0,
        totalMeals: 0,
      };

  const recentActivity = [
    ...donationsSnap.docs.map((doc) => ({
      id: doc.id,
      kind: 'donation',
      timestamp: doc.data().createdAt,
      ...doc.data(),
    })),
    ...deliveriesSnap.docs.map((doc) => ({
      id: doc.id,
      kind: 'delivery',
      timestamp: doc.data().deliveredAt,
      ...doc.data(),
    })),
  ]
    .sort((left, right) => (right.timestamp?.toMillis?.() || 0) - (left.timestamp?.toMillis?.() || 0))
    .slice(0, 10);

  res.json({
    stats: {
      totalNgos: ngosSnap.size,
      totalDonors: usersSnap.size,
      totalDonationsAmount: stats.totalDonationsAmount || 0,
      totalDeliveries: stats.totalDeliveries || 0,
      totalMeals: stats.totalMeals || 0,
    },
    recentActivity,
  });
};

module.exports = {
  createNgo,
  listNgos,
  updateNgo,
  getStats,
};

