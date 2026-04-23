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
import { v4 as uuidv4 } from 'uuid';
import {
  notifyDonationSubmitted,
  notifyAdminNewDonation,
} from './notificationService';

const getSuperAdminUid = async () => {
  try {
    const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'super_admin')));
    return snap.docs[0]?.data()?.uid || null;
  } catch {
    return null;
  }
};

/**
 * Submit a donation.
 * - No UTR required (user pays via UPI link, manual confirmation)
 * - Screenshot is optional but recommended
 * - Status always starts as "pending" — NGO must verify manually
 */
export const submitDonation = async ({ ngoId, donorName, amount, screenshotUrl = null }) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  if (!ngoId || !amount) throw new Error('NGO and amount are required.');
  if (Number(amount) <= 0) throw new Error('Amount must be positive.');

  const ngoSnap = await getDoc(doc(db, 'ngos', ngoId));
  if (!ngoSnap.exists() || !ngoSnap.data().isActive) throw new Error('NGO not available.');

  const donationId = uuidv4();
  const ngoData = ngoSnap.data();

  await setDoc(doc(db, 'donations', donationId), {
    donationId,
    donorUid: user.uid,
    donorName: donorName || user.displayName || user.email,
    ngoId,
    ngoName: ngoData.name,
    amount: Number(amount),
    screenshotUrl,        // optional screenshot for NGO reference
    utr: null,            // not required in UPI link flow
    status: 'pending',    // NGO must verify manually
    rejectionReason: null,
    certificateId: null,
    certificateUrl: null,
    createdAt: serverTimestamp(),
    verifiedAt: null,
  });

  // Update habit streak
  try {
    const { updateHabitStreak } = await import('./habitService');
    await updateHabitStreak(user.uid);
  } catch (e) {
    console.warn('Streak update failed:', e);
  }

  // Notify NGO admin
  try {
    const ngoAdminSnap = await getDocs(
      query(collection(db, 'users'), where('ngoId', '==', ngoId), where('role', '==', 'ngo_admin'))
    );
    const ngoAdminUid = ngoAdminSnap.docs[0]?.data()?.uid;
    if (ngoAdminUid) {
      await notifyDonationSubmitted({
        ngoAdminUid,
        donorName: donorName || user.displayName || 'A donor',
        amount: Number(amount),
        ngoName: ngoData.name,
      });
    }
    const adminUid = await getSuperAdminUid();
    if (adminUid) {
      await notifyAdminNewDonation({
        adminUid,
        donorName: donorName || user.displayName || 'A donor',
        amount: Number(amount),
        ngoName: ngoData.name,
      });
    }
  } catch (e) {
    console.warn('Notification failed:', e);
  }

  return { donationId, status: 'pending' };
};

export const fetchMyDonations = async () => {
  const user = auth.currentUser;
  if (!user) return [];
  try {
    const snap = await getDocs(
      query(collection(db, 'donations'), where('donorUid', '==', user.uid))
    );
    return snap.docs
      .map((d) => d.data())
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  } catch (error) {
    console.error('fetchMyDonations error:', error);
    return [];
  }
};

export const fetchDonationCertificate = async (id) => {
  const snap = await getDoc(doc(db, 'donations', id));
  if (!snap.exists()) throw new Error('Donation not found.');
  const donation = snap.data();
  if (!donation.certificateUrl) throw new Error('Certificate not available yet.');
  return {
    certificateUrl: donation.certificateUrl,
    certificateId: donation.certificateId,
    donation,
  };
};