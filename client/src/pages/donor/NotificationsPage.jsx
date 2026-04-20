import { useEffect } from 'react';
import { Bell, CheckCircle2, XCircle, Award, Heart } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { markNotificationAsRead } from '../../services/notificationService';
import { formatDateTime } from '../../utils/date';

const iconMap = {
  donation_verified: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
  donation_rejected: <XCircle className="h-5 w-5 text-rose-600" />,
  delivery_verified: <Award className="h-5 w-5 text-accent" />,
  delivery_rejected: <XCircle className="h-5 w-5 text-rose-600" />,
};

const bgMap = {
  donation_verified: 'bg-emerald-50 border-emerald-100',
  donation_rejected: 'bg-rose-50 border-rose-100',
  delivery_verified: 'bg-accent/5 border-accent/20',
  delivery_rejected: 'bg-rose-50 border-rose-100',
};

export default function NotificationsPage() {
  const { notifications, unreadCount } = useNotifications();

  const handleRead = async (notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.notifId);
    }
  };

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-md px-4 py-5 space-y-4">
        <section className="rounded-[28px] bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-navy">Notifications</h1>
              <p className="text-sm text-muted mt-0.5">Updates on your donations and deliveries</p>
            </div>
            {unreadCount > 0 ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                {unreadCount}
              </span>
            ) : null}
          </div>
        </section>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 rounded-full bg-cream flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-muted" />
            </div>
            <p className="text-base font-semibold text-navy">No notifications yet</p>
            <p className="text-sm text-muted mt-1">You'll get notified when NGOs verify your donations.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <button
                type="button"
                key={notification.notifId}
                onClick={() => handleRead(notification)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  notification.read
                    ? 'bg-white border-slate-100'
                    : bgMap[notification.type] || 'bg-accent/5 border-accent/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm shrink-0">
                    {iconMap[notification.type] || <Heart className="h-5 w-5 text-accent" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy">{notification.title}</p>
                    <p className="mt-0.5 text-xs text-muted leading-5">{notification.body}</p>
                    <p className="mt-1.5 text-[11px] text-slate-400">{formatDateTime(notification.createdAt)}</p>
                  </div>
                  {!notification.read ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-accent mt-1 shrink-0" />
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}