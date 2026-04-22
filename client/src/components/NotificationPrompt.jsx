import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { requestNotificationPermission } from '../services/fcmService';
import { useAuth } from '../hooks/useAuth';

export default function NotificationPrompt() {
  const { user, role } = useAuth();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || role !== 'donor') return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted' || Notification.permission === 'denied') return;
    const dismissed = localStorage.getItem('notif_prompt_dismissed');
    if (dismissed) return;
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, [user, role]);

  const handleEnable = async () => {
    setLoading(true);
    await requestNotificationPermission();
    setLoading(false);
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('notif_prompt_dismissed', '1');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-40 mx-auto max-w-md">
      <div className="rounded-[24px] bg-navy p-4 shadow-2xl border border-white/10">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 shrink-0">
            <Bell className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Enable notifications 🎂</p>
            <p className="text-xs text-white/60 mt-0.5 leading-4">
              Get birthday reminders, donation updates and NGO alerts on your device.
            </p>
          </div>
          <button type="button" onClick={handleDismiss} className="text-white/40">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleEnable}
            disabled={loading}
            className="min-h-10 rounded-xl bg-accent text-xs font-bold text-white disabled:opacity-70"
          >
            {loading ? 'Enabling...' : '🔔 Enable'}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="min-h-10 rounded-xl border border-white/20 text-xs font-semibold text-white/70"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}