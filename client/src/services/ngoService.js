import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';

const toRad = (val) => (val * Math.PI) / 180;

const calculateDistanceKm = (from, to) => {
  if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) return 9999;
  const R = 6371;
  const dLat = toRad(Number(to.lat) - Number(from.lat));
  const dLon = toRad(Number(to.lng) - Number(from.lng));
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(Number(from.lat))) *
      Math.cos(toRad(Number(to.lat))) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const fetchActiveNGOs = async () => {
  try {
    const snap = await getDocs(query(collection(db, 'ngos'), where('isActive', '==', true)));
    return snap.docs.map((d) => d.data());
  } catch (error) {
    console.error('fetchActiveNGOs error:', error);
    return [];
  }
};

export const fetchNgoById = async (ngoId) => {
  try {
    const snap = await getDoc(doc(db, 'ngos', ngoId));
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.error('fetchNgoById error:', error);
    return null;
  }
};

export const fetchSuggestedNGOs = async (location) => {
  try {
    const snap = await getDocs(query(collection(db, 'ngos'), where('isActive', '==', true)));
    const list = snap.docs.map((d) => d.data());
    if (location) {
      return [...list].sort(
        (a, b) =>
          calculateDistanceKm(location, { lat: a.lat, lng: a.lng }) -
          calculateDistanceKm(location, { lat: b.lat, lng: b.lng })
      );
    }
    return list;
  } catch (error) {
    console.error('fetchSuggestedNGOs error:', error);
    return [];
  }
};

export const fetchNgoNeeds = async (ngoId) => {
  try {
    const snap = await getDocs(
      query(collection(db, 'needs'), where('ngoId', '==', ngoId), where('isActive', '==', true))
    );
    return snap.docs
      .map((d) => d.data())
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  } catch (error) {
    console.error('fetchNgoNeeds error:', error);
    return [];
  }
};

export const fetchNgoPosts = async (ngoId) => {
  try {
    const snap = await getDocs(query(collection(db, 'posts'), where('ngoId', '==', ngoId)));
    return snap.docs
      .map((d) => d.data())
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  } catch (error) {
    console.error('fetchNgoPosts error:', error);
    return [];
  }
};

export const fetchRecentPosts = async () => {
  try {
    const snap = await getDocs(collection(db, 'posts'));
    return snap.docs
      .map((d) => d.data())
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 30);
  } catch (error) {
    console.error('fetchRecentPosts error:', error);
    return [];
  }
};

export const fetchUrgentNeeds = async () => {
  try {
    const snap = await getDocs(
      query(collection(db, 'needs'), where('isActive', '==', true), where('urgency', '==', 'high'))
    );
    const highPriority = snap.docs.map((d) => d.data());
    if (highPriority.length > 0) return highPriority;
    const allSnap = await getDocs(query(collection(db, 'needs'), where('isActive', '==', true)));
    return allSnap.docs
      .map((d) => d.data())
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 5);
  } catch (error) {
    console.error('fetchUrgentNeeds error:', error);
    return [];
  }
};

export const fetchPlatformStats = async () => {
  try {
    const [donationsSnap, deliveriesSnap] = await Promise.all([
      getDocs(query(collection(db, 'donations'), where('status', '==', 'verified'))),
      getDocs(query(collection(db, 'deliveries'), where('status', '==', 'verified'))),
    ]);
    const totalDonated = donationsSnap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);
    const totalMeals = Math.round(totalDonated / 50) + deliveriesSnap.size * 2;
    const donorUids = new Set(donationsSnap.docs.map((d) => d.data().donorUid));
    return { totalMeals, totalDonors: donorUids.size };
  } catch (error) {
    return { totalMeals: 0, totalDonors: 0 };
  }
};

export const togglePostLike = async ({ postId, userId, alreadyLiked }) => {
  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, {
    likedBy: alreadyLiked ? arrayRemove(userId) : arrayUnion(userId),
    likes: increment(alreadyLiked ? -1 : 1),
  });
};

/** 
 * FIX: Added this missing function to resolve the SyntaxError
 */
export const fetchLeaderboard = async () => {
  try {
    const snap = await getDocs(
      query(
        collection(db, 'users'),
        where('role', '==', 'donor'),
        orderBy('impactPoints', 'desc'),
        limit(20)
      )
    );
    return snap.docs.map((d) => d.data());
  } catch (error) {
    console.error('fetchLeaderboard error:', error);
    // Fallback in case the composite index is not yet built in Firebase
    const allSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'donor')));
    return allSnap.docs
      .map(d => d.data())
      .sort((a, b) => (b.impactPoints || 0) - (a.impactPoints || 0))
      .slice(0, 20);
  }
};