import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { listenToNotifications } from '../services/notificationService';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return undefined;
    }

    return listenToNotifications(user.uid, setNotifications);
  }, [user]);

  return {
    notifications,
    unreadCount: notifications.filter((notification) => !notification.read).length,
  };
};
