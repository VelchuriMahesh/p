import { doc, getDoc, updateDoc, collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { v4 as uuidv4 } from 'uuid';

const getTodayMMDD = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${month}-${day}`;
};

const getYearKey = () => String(new Date().getFullYear());

export const checkAndSendBirthdayNotification = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const user = userSnap.data();
    const todayMMDD = getTodayMMDD();
    const yearKey = getYearKey();

    if (user.dateOfBirth) {
      const dob = new Date(user.dateOfBirth);
      const dobMMDD = `${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`;

      if (dobMMDD === todayMMDD && user.birthdayNotified !== yearKey) {
        const notifId = uuidv4();
        await Promise.all([
          doc(db, 'notifications', notifId),
          import('firebase/firestore').then(({ setDoc, Timestamp }) =>
            setDoc(doc(db, 'notifications', notifId), {
              notifId,
              recipientUid: uid,
              title: `🎂 Happy Birthday, ${user.name?.split(' ')[0] || 'dear'}! 🎉`,
              body: `Today is your special day! Celebrate it with purpose — donate a meal to an elder and make this birthday truly meaningful. Every rupee creates smiles! 🎁❤️`,
              type: 'birthday',
              read: false,
              createdAt: Timestamp.now(),
            })
          ),
          updateDoc(userRef, { birthdayNotified: yearKey }),
        ]);
        return { type: 'birthday', sent: true };
      }
    }

    if (user.anniversaryDate) {
      const ann = new Date(user.anniversaryDate);
      const annMMDD = `${String(ann.getMonth() + 1).padStart(2, '0')}-${String(ann.getDate()).padStart(2, '0')}`;

      if (annMMDD === todayMMDD && user.anniversaryNotified !== yearKey) {
        const notifId = uuidv4();
        await Promise.all([
          import('firebase/firestore').then(({ setDoc, Timestamp }) =>
            setDoc(doc(db, 'notifications', notifId), {
              notifId,
              recipientUid: uid,
              title: `💍 Happy Anniversary! 🌹`,
              body: `Wishing you a wonderful anniversary! What better way to celebrate your love than by sharing a meal with elders who need it. Donate today and multiply the joy! 💕`,
              type: 'anniversary',
              read: false,
              createdAt: Timestamp.now(),
            })
          ),
          updateDoc(userRef, { anniversaryNotified: yearKey }),
        ]);
        return { type: 'anniversary', sent: true };
      }
    }

    return { sent: false };
  } catch (error) {
    console.error('Birthday notification error:', error);
    return { sent: false };
  }
};