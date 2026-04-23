import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { uploadImageToImgBB } from '../utils/uploadImage';
import {
  notifyNeedAdded,
  notifyDonationVerified,
  notifyDonationRejected,
  notifyDeliveryVerified,
  notifyDeliveryRejected,
  notifyCertificateIssued,
  notifyNGOProfileUpdated,
} from './notificationService';

const getMyNgoId = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const snap = await getDoc(doc(db, 'users', user.uid));
  if (!snap.exists()) throw new Error('User not found');
  const ngoId = snap.data().ngoId;
  if (!ngoId) throw new Error('No NGO linked to this account');
  return ngoId;
};

const getAllDonorUids = async () => {
  try {
    const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'donor')));
    return snap.docs.map((d) => d.data().uid).filter(Boolean);
  } catch {
    return [];
  }
};

export const fetchMyNgoProfile = async () => {
  const ngoId = await getMyNgoId();
  const snap = await getDoc(doc(db, 'ngos', ngoId));
  return snap.exists() ? snap.data() : null;
};

export const updateNgoProfile = async (formData) => {
  const ngoId = await getMyNgoId();
  const updates = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string' && value !== '') {
      updates[key] = value;
    }
  }
  if (updates.lat !== undefined) updates.lat = Number(updates.lat);
  if (updates.lng !== undefined) updates.lng = Number(updates.lng);
  await updateDoc(doc(db, 'ngos', ngoId), updates);

  try {
    const user = auth.currentUser;
    const ngoSnap = await getDoc(doc(db, 'ngos', ngoId));
    if (user && ngoSnap.exists()) {
      await notifyNGOProfileUpdated({
        adminUid: user.uid,
        ngoName: ngoSnap.data().name,
      });
    }
  } catch (e) {
    console.warn('Notification failed:', e);
  }
};

export const createNeed = async (payload) => {
  const ngoId = await getMyNgoId();
  const ngoSnap = await getDoc(doc(db, 'ngos', ngoId));
  const needRef = doc(collection(db, 'needs'));
  await setDoc(needRef, {
    needId: needRef.id,
    ngoId,
    ngoName: ngoSnap.data()?.name || '',
    title: payload.title,
    description: payload.description,
    type: payload.type || 'delivery',
    urgency: payload.urgency || 'medium',
    suggestedAmount: payload.suggestedAmount ? Number(payload.suggestedAmount) : null,
    isActive: true,
    createdAt: serverTimestamp(),
    expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
  });

  try {
    const donorUids = await getAllDonorUids();
    if (donorUids.length > 0) {
      await notifyNeedAdded({
        donorUids,
        ngoName: ngoSnap.data()?.name || 'An NGO',
        needTitle: payload.title,
        urgency: payload.urgency || 'medium',
        ngoId,
      });
    }
  } catch (e) {
    console.warn('Notification failed:', e);
  }

  return { needId: needRef.id };
};

export const updateNeed = async (id, payload) => {
  const updates = { ...payload };
  if (payload.suggestedAmount !== undefined) {
    updates.suggestedAmount = payload.suggestedAmount ? Number(payload.suggestedAmount) : null;
  }
  if (payload.expiresAt !== undefined) {
    updates.expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
  }
  await updateDoc(doc(db, 'needs', id), updates);
};

export const deleteNeed = async (id) => {
  await deleteDoc(doc(db, 'needs', id));
};

export const createPost = async (formData) => {
  const ngoId = await getMyNgoId();
  const ngoSnap = await getDoc(doc(db, 'ngos', ngoId));
  const caption = formData.get('caption') || '';
  const file = formData.get('file');

  let mediaUrl = '';
  if (file && file instanceof File && file.size > 0) {
    mediaUrl = await uploadImageToImgBB(file);
  }

  const postRef = doc(collection(db, 'posts'));
  await setDoc(postRef, {
    postId: postRef.id,
    ngoId,
    ngoName: ngoSnap.data()?.name || '',
    ngoLogoUrl: ngoSnap.data()?.logoUrl || '',
    mediaUrl,
    caption,
    likes: 0,
    likedBy: [],
    comments: [],
    createdAt: serverTimestamp(),
  });

  try {
    const donorUids = await getAllDonorUids();
    await Promise.all(
      donorUids.slice(0, 50).map((uid) =>
        import('./notificationService').then(({ createNotification }) =>
          createNotification({
            recipientUid: uid,
            title: `📸 New post from ${ngoSnap.data()?.name}`,
            body: caption.length > 60 ? caption.slice(0, 60) + '...' : caption,
            type: 'new_post',
            link: `/ngo/${ngoId}`,
          })
        )
      )
    );
  } catch (e) {
    console.warn('Post notification failed:', e);
  }

  return { postId: postRef.id };
};

export const deletePost = async (id) => {
  await deleteDoc(doc(db, 'posts', id));
};

export const fetchNgoDonations = async () => {
  const ngoId = await getMyNgoId();
  try {
    const snap = await getDocs(
      query(collection(db, 'donations'), where('ngoId', '==', ngoId))
    );
    return snap.docs
      .map((d) => d.data())
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  } catch (error) {
    console.error('fetchNgoDonations error:', error);
    return [];
  }
};

export const fetchNgoDeliveries = async () => {
  const ngoId = await getMyNgoId();
  try {
    const snap = await getDocs(
      query(collection(db, 'deliveries'), where('ngoId', '==', ngoId))
    );
    return snap.docs
      .map((d) => d.data())
      .sort((a, b) => (b.deliveredAt?.seconds || 0) - (a.deliveredAt?.seconds || 0));
  } catch (error) {
    console.error('fetchNgoDeliveries error:', error);
    return [];
  }
};

export const verifyNgoDonation = async (id) => {
  const snap = await getDoc(doc(db, 'donations', id));
  if (!snap.exists()) throw new Error('Donation not found.');
  const donation = snap.data();

  await updateDoc(doc(db, 'donations', id), {
    status: 'verified',
    verifiedAt: serverTimestamp(),
  });

  try {
    await notifyDonationVerified({
      donorUid: donation.donorUid,
      ngoName: donation.ngoName,
      amount: donation.amount,
    });
  } catch (e) {
    console.warn('Notification failed:', e);
  }
};

export const rejectNgoDonation = async (id, reason) => {
  const snap = await getDoc(doc(db, 'donations', id));
  if (!snap.exists()) throw new Error('Donation not found.');
  const donation = snap.data();

  await updateDoc(doc(db, 'donations', id), {
    status: 'rejected',
    rejectionReason: reason,
    verifiedAt: serverTimestamp(),
  });

  try {
    await notifyDonationRejected({
      donorUid: donation.donorUid,
      ngoName: donation.ngoName,
      reason,
    });
  } catch (e) {
    console.warn('Notification failed:', e);
  }
};

export const verifyNgoDelivery = async (id) => {
  const snap = await getDoc(doc(db, 'deliveries', id));
  if (!snap.exists()) throw new Error('Delivery not found.');
  const delivery = snap.data();

  await updateDoc(doc(db, 'deliveries', id), {
    status: 'verified',
    verifiedAt: serverTimestamp(),
  });

  try {
    await notifyDeliveryVerified({
      donorUid: delivery.donorUid,
      ngoName: delivery.ngoName,
      items: delivery.itemsDelivered,
    });
  } catch (e) {
    console.warn('Notification failed:', e);
  }
};

export const rejectNgoDelivery = async (id, reason) => {
  const snap = await getDoc(doc(db, 'deliveries', id));
  if (!snap.exists()) throw new Error('Delivery not found.');
  const delivery = snap.data();

  await updateDoc(doc(db, 'deliveries', id), {
    status: 'rejected',
    rejectionReason: reason,
    verifiedAt: serverTimestamp(),
  });

  try {
    await notifyDeliveryRejected({
      donorUid: delivery.donorUid,
      ngoName: delivery.ngoName,
      reason,
    });
  } catch (e) {
    console.warn('Notification failed:', e);
  }
};