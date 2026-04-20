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

const getMyNgoId = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const snap = await getDoc(doc(db, 'users', user.uid));
  if (!snap.exists()) throw new Error('User not found');
  const ngoId = snap.data().ngoId;
  if (!ngoId) throw new Error('No NGO linked to this account');
  return ngoId;
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
    return snap.docs.map((d) => d.data());
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
    return snap.docs.map((d) => d.data());
  } catch (error) {
    console.error('fetchNgoDeliveries error:', error);
    return [];
  }
};

export const verifyNgoDonation = async (id) => {
  await updateDoc(doc(db, 'donations', id), {
    status: 'verified',
    verifiedAt: serverTimestamp(),
  });
};

export const rejectNgoDonation = async (id, reason) => {
  await updateDoc(doc(db, 'donations', id), {
    status: 'rejected',
    rejectionReason: reason,
    verifiedAt: serverTimestamp(),
  });
};

export const verifyNgoDelivery = async (id) => {
  await updateDoc(doc(db, 'deliveries', id), {
    status: 'verified',
    verifiedAt: serverTimestamp(),
  });
};

export const rejectNgoDelivery = async (id, reason) => {
  await updateDoc(doc(db, 'deliveries', id), {
    status: 'rejected',
    rejectionReason: reason,
    verifiedAt: serverTimestamp(),
  });
};