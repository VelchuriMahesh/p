import { doc, onSnapshot, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const INDIA_TZ = 'Asia/Kolkata';

const getTodayKey = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

const getDayKey = (date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

const diffDays = (fromKey, toKey) => {
  const from = new Date(`${fromKey}T00:00:00Z`);
  const to = new Date(`${toKey}T00:00:00Z`);
  return Math.round((to - from) / (24 * 60 * 60 * 1000));
};

export const listenToHabit = (uid, callback) =>
  onSnapshot(doc(db, 'habits', uid), (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });

export const updateHabitStreak = async (uid) => {
  const habitRef = doc(db, 'habits', uid);
  const userRef = doc(db, 'users', uid);
  const [habitSnap, userSnap] = await Promise.all([habitRef.get?.() ?? getDoc(habitRef), getDoc(userRef)]);
  const now = new Date();
  const todayKey = getTodayKey();
  const existing = habitSnap.exists?.() ? habitSnap.data() : (habitSnap.exists ? habitSnap.data() : {});
  const lastDate = existing.lastHabitDate?.toDate?.() || null;
  const lastKey = lastDate ? getDayKey(lastDate) : null;
  let streakDays = existing.streakDays || 0;

  if (!lastKey) {
    streakDays = 1;
  } else {
    const diff = diffDays(lastKey, todayKey);
    if (diff === 0) {
      streakDays = Math.max(1, streakDays);
    } else if (diff === 1) {
      streakDays += 1;
    } else {
      streakDays = 1;
    }
  }

  const payload = {
    uid,
    streakDays,
    lastHabitDate: serverTimestamp(),
    totalHabitDonations: (existing.totalHabitDonations || 0) + 1,
  };

  await Promise.all([
    updateDoc(habitRef, payload).catch(() =>
      import('firebase/firestore').then(({ setDoc }) => setDoc(habitRef, payload, { merge: true }))
    ),
    updateDoc(userRef, { streakDays, lastHabitDate: serverTimestamp() }).catch(() => null),
  ]);

  return payload;
};