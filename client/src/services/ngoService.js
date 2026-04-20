import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { calculateDistanceKm } from '../utils/location';

export const fetchActiveNGOs = async () => {
  const snapshot = await getDocs(query(collection(db, 'ngos'), where('isActive', '==', true), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((item) => item.data());
};

export const fetchNgoById = async (ngoId) => {
  const snapshot = await getDoc(doc(db, 'ngos', ngoId));
  return snapshot.exists() ? snapshot.data() : null;
};

export const fetchNgoNeeds = async (ngoId, { includeInactive = false } = {}) => {
  const snapshot = await getDocs(
    query(collection(db, 'needs'), where('ngoId', '==', ngoId), orderBy('createdAt', 'desc'))
  );
  const needs = snapshot.docs.map((item) => item.data());
  return includeInactive ? needs : needs.filter((need) => need.isActive);
};

export const fetchNgoPosts = async (ngoId) => {
  const snapshot = await getDocs(
    query(collection(db, 'posts'), where('ngoId', '==', ngoId), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((item) => item.data());
};

export const fetchUrgentNeeds = async () => {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'needs'),
        where('isActive', '==', true)
      )
    );
    const needs = snapshot.docs.map((item) => item.data());
    return needs.filter((need) => ['high', 'medium'].includes(need.urgency));
  } catch (error) {
    console.error('fetchUrgentNeeds error:', error);
    return [];
  }
};

export const fetchRecentPosts = async () => {
  try {
    const snapshot = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map((item) => item.data());
  } catch (error) {
    console.error('fetchRecentPosts error:', error);
    return [];
  }
};

export const fetchPlatformStats = async () => {
  try {
    const [statsSnap, donorCountSnap] = await Promise.all([
      getDoc(doc(db, 'stats', 'platform')),
      getCountFromServer(query(collection(db, 'users'), where('role', '==', 'donor'))),
    ]);

    return {
      totalMeals: statsSnap.exists() ? statsSnap.data().totalMeals || 0 : 0,
      totalDonationsAmount: statsSnap.exists() ? statsSnap.data().totalDonationsAmount || 0 : 0,
      totalDeliveries: statsSnap.exists() ? statsSnap.data().totalDeliveries || 0 : 0,
      totalDonors: donorCountSnap.data().count,
    };
  } catch (error) {
    console.error('fetchPlatformStats error:', error);
    return { totalMeals: 0, totalDonationsAmount: 0, totalDeliveries: 0, totalDonors: 0 };
  }
};

export const fetchSuggestedNGOs = async (userCoordinates = null) => {
  const ngos = await fetchActiveNGOs();

  if (!userCoordinates) {
    return ngos;
  }

  return [...ngos].sort((left, right) => {
    const leftDistance = calculateDistanceKm(userCoordinates, { lat: left.lat, lng: left.lng });
    const rightDistance = calculateDistanceKm(userCoordinates, { lat: right.lat, lng: right.lng });
    return leftDistance - rightDistance;
  });
};

export const togglePostLike = async ({ postId, userId, alreadyLiked }) => {
  const postRef = doc(db, 'posts', postId);

  await updateDoc(postRef, {
    likedBy: alreadyLiked ? arrayRemove(userId) : arrayUnion(userId),
    likes: increment(alreadyLiked ? -1 : 1),
  });
};

export const fetchLeaderboard = async () => {
  try {
    const snapshot = await getDocs(
      query(collection(db, 'leaderboard'), orderBy('totalDonated', 'desc'))
    );
    return snapshot.docs.map((item) => item.data());
  } catch (error) {
    console.error('fetchLeaderboard error:', error);
    return [];
  }
};