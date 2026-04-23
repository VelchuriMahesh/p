import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { v4 as uuidv4 } from 'uuid';

export const listenToNotifications = (uid, callback) => {
  const notificationsQuery = query(
    collection(db, 'notifications'),
    where('recipientUid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(30)
  );
  return onSnapshot(notificationsQuery, (snapshot) => {
    callback(snapshot.docs.map((item) => item.data()));
  });
};

export const markNotificationAsRead = async (notifId) => {
  await updateDoc(doc(db, 'notifications', notifId), { read: true });
};

export const markAllAsRead = async (uid) => {
  const snap = await import('firebase/firestore').then(({ getDocs }) =>
    getDocs(query(collection(db, 'notifications'), where('recipientUid', '==', uid), where('read', '==', false)))
  );
  const updates = snap.docs.map((d) => updateDoc(doc(db, 'notifications', d.id), { read: true }));
  await Promise.all(updates);
};

export const createNotification = async ({ recipientUid, title, body, type, link = null }) => {
  if (!recipientUid) return;
  const notifId = uuidv4();
  await setDoc(doc(db, 'notifications', notifId), {
    notifId,
    recipientUid,
    title,
    body,
    type,
    link,
    read: false,
    createdAt: serverTimestamp(),
  });
  return notifId;
};

export const notifyDonationSubmitted = async ({ ngoAdminUid, donorName, amount, ngoName }) => {
  await createNotification({
    recipientUid: ngoAdminUid,
    title: '💰 New donation received!',
    body: `${donorName} donated ₹${amount} to ${ngoName}. Review and verify the payment screenshot.`,
    type: 'donation_received',
    link: '/ngo-dashboard/donations',
  });
};

export const notifyDeliverySubmitted = async ({ ngoAdminUid, donorName, items, ngoName }) => {
  await createNotification({
    recipientUid: ngoAdminUid,
    title: '📦 New delivery submitted!',
    body: `${donorName} delivered "${items}" to ${ngoName}. Review the proof photo.`,
    type: 'delivery_received',
    link: '/ngo-dashboard/deliveries',
  });
};

export const notifyDonationVerified = async ({ donorUid, ngoName, amount }) => {
  await createNotification({
    recipientUid: donorUid,
    title: '✅ Donation verified!',
    body: `Your donation of ₹${amount} to ${ngoName} has been verified. Your certificate is ready! 🎉`,
    type: 'donation_verified',
    link: '/dashboard',
  });
};

export const notifyDonationRejected = async ({ donorUid, ngoName, reason }) => {
  await createNotification({
    recipientUid: donorUid,
    title: '❌ Donation needs attention',
    body: `Your donation to ${ngoName} was rejected. Reason: ${reason}. Please resubmit.`,
    type: 'donation_rejected',
    link: '/dashboard',
  });
};

export const notifyDeliveryVerified = async ({ donorUid, ngoName, items }) => {
  await createNotification({
    recipientUid: donorUid,
    title: '✅ Delivery verified!',
    body: `Your delivery of "${items}" to ${ngoName} has been approved. Certificate ready! 🏆`,
    type: 'delivery_verified',
    link: '/dashboard',
  });
};

export const notifyDeliveryRejected = async ({ donorUid, ngoName, reason }) => {
  await createNotification({
    recipientUid: donorUid,
    title: '❌ Delivery needs attention',
    body: `Your delivery to ${ngoName} was rejected. Reason: ${reason}.`,
    type: 'delivery_rejected',
    link: '/dashboard',
  });
};

export const notifyCertificateIssued = async ({ donorUid, ngoName, type }) => {
  await createNotification({
    recipientUid: donorUid,
    title: '🏅 Certificate issued!',
    body: `Your ${type} certificate from ${ngoName} is ready. Download and share your achievement!`,
    type: 'certificate_issued',
    link: '/dashboard',
  });
};

export const notifyNeedAdded = async ({ donorUids, ngoName, needTitle, urgency, ngoId }) => {
  const emoji = urgency === 'high' ? '🚨' : urgency === 'medium' ? '⚠️' : '📋';
  await Promise.all(
    donorUids.slice(0, 50).map((uid) =>
      createNotification({
        recipientUid: uid,
        title: `${emoji} New need from ${ngoName}`,
        body: `"${needTitle}" — ${urgency} priority. Help them today!`,
        type: 'need_added',
        link: `/ngo/${ngoId}`,
      })
    )
  );
};

export const notifyNGOProfileUpdated = async ({ adminUid, ngoName }) => {
  await createNotification({
    recipientUid: adminUid,
    title: '✅ Profile updated',
    body: `${ngoName} profile has been updated successfully.`,
    type: 'profile_updated',
    link: '/ngo-dashboard',
  });
};

export const notifyAdminNewDonation = async ({ adminUid, donorName, amount, ngoName }) => {
  await createNotification({
    recipientUid: adminUid,
    title: '📊 Platform donation',
    body: `${donorName} donated ₹${amount} to ${ngoName}.`,
    type: 'admin_donation',
    link: '/admin',
  });
};

export const notifyAdminNewNGO = async ({ adminUid, ngoName }) => {
  await createNotification({
    recipientUid: adminUid,
    title: '🏠 NGO account created',
    body: `${ngoName} has been created on the platform.`,
    type: 'admin_ngo_created',
    link: '/admin/ngos',
  });
};

export const notifyBirthday = async ({ uid, name }) => {
  await createNotification({
    recipientUid: uid,
    title: `🎂 Happy Birthday, ${name?.split(' ')[0]}! 🎉`,
    body: `Today is your special day! Celebrate it with purpose — donate a meal and make this birthday truly meaningful! 🎁❤️`,
    type: 'birthday',
    link: '/map',
  });
};

export const notifyAnniversary = async ({ uid, name }) => {
  await createNotification({
    recipientUid: uid,
    title: `💍 Happy Anniversary! 🌹`,
    body: `Wishing you a wonderful anniversary! Celebrate your love by sharing a meal with elders who need it. 💕`,
    type: 'anniversary',
    link: '/map',
  });
};