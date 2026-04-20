const { db, FieldValue, Timestamp } = require('../config/firebase');

const platformRef = db.collection('stats').doc('platform');

const ensurePlatformStats = async () => {
  const snapshot = await platformRef.get();

  if (!snapshot.exists) {
    await platformRef.set({
      totalNgos: 0,
      totalDonors: 0,
      totalDonationsAmount: 0,
      totalDeliveries: 0,
      totalMeals: 0,
      updatedAt: Timestamp.now(),
    });
  }
};

const incrementPlatformStats = async (updates = {}) => {
  await ensurePlatformStats();

  const payload = Object.entries(updates).reduce(
    (accumulator, [key, value]) => ({
      ...accumulator,
      [key]: FieldValue.increment(value),
    }),
    {
      updatedAt: Timestamp.now(),
    }
  );

  await platformRef.set(payload, { merge: true });
};

const estimateMealsFromDonation = (amount) => {
  const numericAmount = Number(amount) || 0;
  return Math.max(1, Math.round(numericAmount / 50));
};

const estimateMealsFromDelivery = (itemsDelivered) => {
  if (!itemsDelivered) {
    return 1;
  }

  const items = Array.isArray(itemsDelivered)
    ? itemsDelivered
    : String(itemsDelivered)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

  return Math.max(1, items.length);
};

const updateLeaderboard = async ({
  donorUid,
  donorName,
  donorPhotoURL = null,
  donationAmount = 0,
  deliveryCount = 0,
}) => {
  await db.collection('leaderboard').doc(donorUid).set(
    {
      uid: donorUid,
      donorName,
      donorPhotoURL,
      totalDonated: FieldValue.increment(donationAmount),
      totalDeliveries: FieldValue.increment(deliveryCount),
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
};

module.exports = {
  ensurePlatformStats,
  incrementPlatformStats,
  estimateMealsFromDonation,
  estimateMealsFromDelivery,
  updateLeaderboard,
};
