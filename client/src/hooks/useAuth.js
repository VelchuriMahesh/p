import { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { checkAndSendBirthdayNotification } from '../services/birthdayService';

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  useEffect(() => {
    if (context.user && context.role === 'donor') {
      checkAndSendBirthdayNotification(context.user.uid).catch(() => null);
    }
  }, [context.user?.uid, context.role]);

  return context;
};