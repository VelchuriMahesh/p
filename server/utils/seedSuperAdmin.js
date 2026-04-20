const { auth, db, Timestamp } = require('../config/firebase');
const { ensurePlatformStats } = require('./platformStats');

const ensureSuperAdmin = async () => {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME || 'Platform Admin';

  await ensurePlatformStats();

  if (!email || !password) {
    return;
  }

  let userRecord;

  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      throw error;
    }

    userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });
  }

  await auth.setCustomUserClaims(userRecord.uid, { role: 'super_admin' });

  await db.collection('users').doc(userRecord.uid).set(
    {
      uid: userRecord.uid,
      email,
      name,
      role: 'super_admin',
      photoURL: userRecord.photoURL || null,
      ngoId: null,
      createdAt: Timestamp.now(),
      totalDonated: 0,
      totalDeliveries: 0,
      streakDays: 0,
      lastHabitDate: null,
    },
    { merge: true }
  );
};

module.exports = {
  ensureSuperAdmin,
};
