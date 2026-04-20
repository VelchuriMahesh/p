import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';

export const listenToNotifications = (uid, callback) => {
  const notificationsQuery = query(
    collection(db, 'notifications'),
    where('recipientUid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(10)
  );

  return onSnapshot(notificationsQuery, (snapshot) => {
    callback(snapshot.docs.map((item) => item.data()));
  });
};

export const markNotificationAsRead = async (notifId) => {
  await updateDoc(doc(db, 'notifications', notifId), {
    read: true,
  });
};

