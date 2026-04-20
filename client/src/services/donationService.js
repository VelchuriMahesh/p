import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { v4 as uuidv4 } from 'uuid';

const isValidUTR = (value) => /^[A-Za-z0-9]{12,}$/.test(String(value || '').trim());

export const submitDonation = async ({ ngoId, donorName, amount, utr, screenshotUrl }) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  if (!ngoId || !amount || !utr) throw new Error('NGO, amount, and UTR are required.');
  if (!isValidUTR(utr)) throw new Error('UTR must be alphanumeric and at least 12 characters.');
  if (Number(amount) <= 0) throw new Error('Amount must be positive.');
  if (!screenshotUrl) throw new Error('Screenshot is required.');

  const ngoSnap = await getDoc(doc(db, 'ngos', ngoId));
  if (!ngoSnap.exists() || !ngoSnap.data().isActive) throw new Error('NGO not available.');

  const duplicateSnap = await getDocs(
    query(collection(db, 'donations'), where('utr', '==', utr.trim()))
  );
  if (!duplicateSnap.empty) throw new Error('Duplicate UTR number.');

  const donationId = uuidv4();
  await setDoc(doc(db, 'donations', donationId), {
    donationId,
    donorUid: user.uid,
    donorName: donorName || user.displayName || user.email,
    ngoId,
    ngoName: ngoSnap.data().name,
    amount: Number(amount),
    utr: utr.trim(),
    screenshotUrl,
    status: 'pending',
    rejectionReason: null,
    certificateId: null,
    certificateUrl: null,
    createdAt: serverTimestamp(),
    verifiedAt: null,
  });

  try {
    const { updateHabitStreak } = await import('./habitService');
    await updateHabitStreak(user.uid);
  } catch (e) {
    console.warn('Streak update failed:', e);
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