import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { uploadImageToImgBB } from '../utils/uploadImage';
import { v4 as uuidv4 } from 'uuid';
import { notifyDeliverySubmitted } from './notificationService';

export const submitDelivery = async (formData) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const ngoId = formData.get('ngoId');
  const needId = formData.get('needId');
  const itemsDelivered = formData.get('itemsDelivered');
  const donorName = formData.get('donorName');
  const lat = formData.get('lat');
  const lng = formData.get('lng');
  const proofImageFile = formData.get('proofImage');

  if (!ngoId || !needId || !itemsDelivered) throw new Error('NGO, need, and items are required.');
  if (!proofImageFile) throw new Error('Proof image is required.');

  const ngoSnap = await getDoc(doc(db, 'ngos', ngoId));
  if (!ngoSnap.exists() || !ngoSnap.data().isActive) throw new Error('NGO not available.');

  const proofImageUrl = await uploadImageToImgBB(proofImageFile);
  const deliveryId = uuidv4();
  const ngoData = ngoSnap.data();

  await setDoc(doc(db, 'deliveries', deliveryId), {
    deliveryId,
    donorUid: user.uid,
    donorName: donorName || user.displayName || user.email,
    ngoId,
    ngoName: ngoData.name,
    needId,
    itemsDelivered,
    proofImageUrl,
    lat: lat ? Number(lat) : null,
    lng: lng ? Number(lng) : null,
    deliveredAt: serverTimestamp(),
    status: 'pending',
    rejectionReason: null,
    certificateId: null,
    certificateUrl: null,
    verifiedAt: null,
  });

  try {
    const { updateHabitStreak } = await import('./habitService');
    await updateHabitStreak(user.uid);
  } catch (e) {
    console.warn('Streak update failed:', e);
  }

  try {
    const ngoAdminSnap = await getDocs(
      query(collection(db, 'users'), where('ngoId', '==', ngoId), where('role', '==', 'ngo_admin'))
    );
    const ngoAdminUid = ngoAdminSnap.docs[0]?.data()?.uid;
    if (ngoAdminUid) {
      await notifyDeliverySubmitted({
        ngoAdminUid,
        donorName: donorName || user.displayName || 'A donor',
        items: itemsDelivered,
        ngoName: ngoData.name,
      });
    }
  } catch (e) {
    console.warn('Notification failed:', e);
  }

  return { deliveryId, status: 'pending' };
};

export const fetchMyDeliveries = async () => {
  const user = auth.currentUser;
  if (!user) return [];
  try {
    const snap = await getDocs(
      query(collection(db, 'deliveries'), where('donorUid', '==', user.uid))
    );
    return snap.docs
      .map((d) => d.data())
      .sort((a, b) => (b.deliveredAt?.seconds || 0) - (a.deliveredAt?.seconds || 0));
  } catch (error) {
    console.error('fetchMyDeliveries error:', error);
    return [];
  }
};

export const fetchDeliveryCertificate = async (id) => {
  const snap = await getDoc(doc(db, 'deliveries', id));
  if (!snap.exists()) throw new Error('Delivery not found.');
  const delivery = snap.data();
  if (!delivery.certificateUrl) throw new Error('Certificate not available yet.');
  return {
    certificateUrl: delivery.certificateUrl,
    certificateId: delivery.certificateId,
    delivery,
  };
};