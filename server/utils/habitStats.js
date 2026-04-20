const { db, Timestamp } = require('../config/firebase');

const INDIA_TIME_ZONE = 'Asia/Kolkata';

const getDayKey = (dateValue) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateValue);

const diffInDays = (fromKey, toKey) => {
  const from = new Date(`${fromKey}T00:00:00Z`);
  const to = new Date(`${toKey}T00:00:00Z`);
  return Math.round((to - from) / (24 * 60 * 60 * 1000));
};

const updateHabitForDonor = async (uid) => {
  const habitRef = db.collection('habits').doc(uid);
  const userRef = db.collection('users').doc(uid);
  const [habitSnap, userSnap] = await Promise.all([habitRef.get(), userRef.get()]);

  const now = new Date();
  const todayKey = getDayKey(now);
  const existingHabit = habitSnap.exists ? habitSnap.data() : {};
  const userData = userSnap.exists ? userSnap.data() : {};
  const lastHabitDate = existingHabit.lastHabitDate?.toDate?.() || userData.lastHabitDate?.toDate?.() || null;
  const lastKey = lastHabitDate ? getDayKey(lastHabitDate) : null;

  let streakDays = existingHabit.streakDays || userData.streakDays || 0;

  if (!lastKey) {
    streakDays = 1;
  } else {
    const daysSinceLastHabit = diffInDays(lastKey, todayKey);

    if (daysSinceLastHabit === 0) {
      streakDays = Math.max(1, streakDays || 1);
    } else if (daysSinceLastHabit === 1) {
      streakDays += 1;
    } else {
      streakDays = 1;
    }
  }

  const payload = {
    uid,
    streakDays,
    lastHabitDate: Timestamp.now(),
    totalHabitDonations: (existingHabit.totalHabitDonations || 0) + 1,
  };

  await Promise.all([
    habitRef.set(payload, { merge: true }),
    userRef.set(
      {
        streakDays,
        lastHabitDate: Timestamp.now(),
      },
      { merge: true }
    ),
  ]);

  return payload;
};

module.exports = {
  updateHabitForDonor,
};

