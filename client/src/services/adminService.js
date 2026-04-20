import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  orderBy,
  query,
  where,
  limit,
  serverTimestamp,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from './firebase';

export const fetchAdminStats = async () => {
  try {
    const [ngosSnap, donorCountSnap, donationsSnap, deliveriesSnap] = await Promise.all([
      getDocs(collection(db, 'ngos')),
      getCountFromServer(query(collection(db, 'users'), where('role', '==', 'donor'))),
      getDocs(collection(db, 'donations')),
      getDocs(collection(db, 'deliveries')),
    ]);

    const allDonations = donationsSnap.docs.map((d) => d.data());
    const verifiedDonations = allDonations.filter((d) => d.status === 'verified');
    const totalDonationsAmount = verifiedDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const verifiedDeliveries = deliveriesSnap.docs.filter((d) => d.data().status === 'verified').length;

    const recentActivity = allDonations
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 10)
      .map((d) => ({ ...d, id: d.donationId, kind: 'donation', timestamp: d.createdAt }));

    return {
      stats: {
        totalNgos: ngosSnap.size,
        totalDonors: donorCountSnap.data().count,
        totalDonationsAmount,
        totalDeliveries: verifiedDeliveries,
        totalDonations: allDonations.length,
        pendingDonations: allDonations.filter((d) => d.status === 'pending').length,
      },
      recentActivity,
    };
  } catch (error) {
    console.error('fetchAdminStats error:', error);
    return {
      stats: { totalNgos: 0, totalDonors: 0, totalDonationsAmount: 0, totalDeliveries: 0, totalDonations: 0, pendingDonations: 0 },
      recentActivity: [],
    };
  }
};

export const fetchAllNgos = async () => {
  try {
    const snap = await getDocs(collection(db, 'ngos'));
    return snap.docs
      .map((d) => d.data())
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const updateNgoByAdmin = async (id, payload) => {
  const updates = { ...payload };
  if (payload.lat !== undefined && payload.lat !== '') updates.lat = Number(payload.lat);
  if (payload.lng !== undefined && payload.lng !== '') updates.lng = Number(payload.lng);
  updates.updatedAt = serverTimestamp();
  await updateDoc(doc(db, 'ngos', id), updates);
};

export const fetchHeroSlides = async () => {
  try {
    const snap = await getDoc(doc(db, 'settings', 'heroSlides'));
    return snap.exists() ? snap.data().slides || [] : [];
  } catch (error) {
    return [];
  }
};

export const saveHeroSlides = async (slides) => {
  const { setDoc } = await import('firebase/firestore');
  await setDoc(doc(db, 'settings', 'heroSlides'), { slides, updatedAt: serverTimestamp() });
};