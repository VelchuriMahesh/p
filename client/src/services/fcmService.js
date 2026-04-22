import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import app from './firebase';

let messaging = null;

const getMessagingInstance = () => {
  if (!messaging) {
    try {
      messaging = getMessaging(app);
    } catch (error) {
      console.warn('FCM not supported:', error);
      return null;
    }
  }
  return messaging;
};

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    const msg = getMessagingInstance();
    if (!msg) return null;

    const token = await getToken(msg, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    if (token && auth.currentUser) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        fcmToken: token,
      });
    }

    return token;
  } catch (error) {
    console.error('FCM token error:', error);
    return null;
  }
};

export const onForegroundMessage = (callback) => {
  const msg = getMessagingInstance();
  if (!msg) return () => {};
  return onMessage(msg, callback);
};