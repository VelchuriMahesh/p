import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';

export const ensureUserDocument = async (user, fallbackName = null) => {
  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    return snapshot.data();
  }

  const userData = {
    uid: user.uid,
    email: user.email,
    name: fallbackName || user.displayName || 'Donor',
    role: 'donor',
    photoURL: user.photoURL || null,
    ngoId: null,
    createdAt: serverTimestamp(),
    totalDonated: 0,
    totalDeliveries: 0,
    streakDays: 0,
    lastHabitDate: null,
  };

  await Promise.all([
    setDoc(userRef, userData),
    setDoc(
      doc(db, 'habits', user.uid),
      {
        uid: user.uid,
        streakDays: 0,
        lastHabitDate: null,
        totalHabitDonations: 0,
      },
      { merge: true }
    ),
  ]);

  return userData;
};

export const resolveRole = async (uid) => {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? snapshot.data().role : null;
};

export const loginWithEmail = async ({ email, password }) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const role = await resolveRole(credential.user.uid);
  return { user: credential.user, role };
};

export const registerDonor = async ({ name, email, password }) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  const profile = await ensureUserDocument(credential.user, name);
  return { user: credential.user, role: profile.role };
};

export const googleSignIn = async () => {
  const credential = await signInWithPopup(auth, googleProvider);
  const existingRole = await resolveRole(credential.user.uid);

  if (existingRole && existingRole !== 'donor') {
    return { user: credential.user, role: existingRole };
  }

  const profile = await ensureUserDocument(
    credential.user,
    credential.user.displayName || credential.user.email?.split('@')[0]
  );

  return { user: credential.user, role: profile.role };
};

export const logout = () => signOut(auth);
export { GoogleAuthProvider };

