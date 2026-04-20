import { createContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { ensureUserDocument } from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async (firebaseUser = auth.currentUser) => {
    if (!firebaseUser) {
      setProfile(null);
      setRole(null);
      return null;
    }

    const userRef = doc(db, 'users', firebaseUser.uid);
    let snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      await ensureUserDocument(firebaseUser);
      snapshot = await getDoc(userRef);
    }

    const nextProfile = snapshot.exists() ? snapshot.data() : null;
    setProfile(nextProfile);
    setRole(nextProfile?.role || null);
    return nextProfile;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true);
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setRole(null);
        setLoading(false);
        return;
      }

      await refreshProfile(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      role,
      loading,
      refreshProfile,
      setProfile,
      setRole,
    }),
    [user, profile, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

