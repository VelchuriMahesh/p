import { Bell } from 'lucide-react';
import { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { markNotificationAsRead } from '../services/notificationService';
import { formatDateTime } from '../utils/date';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount } = useNotifications();

  const handleItemClick = async (notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.notifId);
    }

    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-3 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-navy">Notifications</p>
            <span className="text-xs text-muted">{unreadCount} unread</span>
          </div>
          <div className="space-y-2">
            {notifications.length ? (
              notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.notifId}
                  onClick={() => handleItemClick(notification)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    notification.read ? 'border-slate-200 bg-slate-50' : 'border-accent/30 bg-accent/5'
                  }`}
                >
                  <p className="text-sm font-semibold text-navy">{notification.title}</p>
                  <p className="mt-1 text-xs text-muted">{notification.body}</p>
                  <p className="mt-2 text-[11px] text-slate-400">{formatDateTime(notification.createdAt)}</p>
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-muted">
                No notifications yet.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

