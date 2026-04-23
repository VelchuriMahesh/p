import { useEffect } from 'react';
import { Bell, CheckCircle2, XCircle, Award, Heart, Package, Star, Gift, Cake, Users, Check } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { markNotificationAsRead, markAllAsRead } from '../../services/notificationService';
import { formatDateTime } from '../../utils/date';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const iconMap = {
  donation_verified: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  donation_rejected: { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  donation_received: { icon: Heart, color: 'text-accent', bg: 'bg-accent/10' },
  delivery_verified: { icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  delivery_rejected: { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  delivery_received: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
  certificate_issued: { icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
  need_added: { icon: Bell, color: 'text-accent', bg: 'bg-accent/10' },
  new_post: { icon: Star, color: 'text-purple-600', bg: 'bg-purple-50' },
  birthday: { icon: Cake, color: 'text-pink-600', bg: 'bg-pink-50' },
  anniversary: { icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
  admin_donation: { icon: Heart, color: 'text-accent', bg: 'bg-accent/10' },
  admin_ngo_created: { icon: Users, color: 'text-navy', bg: 'bg-navy/10' },
  profile_updated: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

const groupByDate = (notifications) => {
  const groups = {};
  notifications.forEach((n) => {
    const date = n.createdAt?.toDate ? n.createdAt.toDate() : new Date();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label;
    if (date.toDateString() === today.toDateString()) label = 'Today';
    else if (date.toDateString() === yesterday.toDateString()) label = 'Yesterday';
    else label = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });
  return groups;
};

export default function NotificationsPage() {
  const { notifications, unreadCount } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();
  const grouped = groupByDate(notifications);

  const handleClick = async (notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.notifId);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    if (user) await markAllAsRead(user.uid);
  };

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-md px-4 py-5 space-y-4">
        <section className="rounded-[28px] bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-navy">Notifications</h1>
              <p className="text-sm text-muted mt-0.5">Stay updated on all activity</p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 ? (
                <>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-navy"
                  >
                    <Check className="h-3.5 w-3.5" />
                    All read
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </section>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 rounded-full bg-cream flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-muted" />
            </div>
            <p className="text-base font-semibold text-navy">No notifications yet</p>
            <p className="text-sm text-muted mt-1 max-w-xs">
              You'll be notified when NGOs verify donations, issue certificates, add needs, and more.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([dateLabel, items]) => (
              <div key={dateLabel}>
                <p className="text-xs font-bold uppercase tracking-wide text-muted px-1 mb-2">{dateLabel}</p>
                <div className="space-y-2">
                  {items.map((notification) => {
                    const config = iconMap[notification.type] || { icon: Bell, color: 'text-muted', bg: 'bg-slate-50' };
                    const IconComponent = config.icon;
                    return (
                      <button
                        type="button"
                        key={notification.notifId}
                        onClick={() => handleClick(notification)}
                        className={`w-full rounded-2xl border p-4 text-left transition-all ${
                          notification.read
                            ? 'bg-white border-slate-100'
                            : 'bg-white border-accent/20 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bg} shrink-0`}>
                            <IconComponent className={`h-5 w-5 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-tight ${notification.read ? 'font-medium text-navy' : 'font-bold text-navy'}`}>
                              {notification.title}
                            </p>
                            <p className="mt-0.5 text-xs text-muted leading-4">{notification.body}</p>
                            <p className="mt-1.5 text-[11px] text-slate-400">{formatDateTime(notification.createdAt)}</p>
                          </div>
                          {!notification.read ? (
                            <span className="h-2.5 w-2.5 rounded-full bg-accent mt-1 shrink-0" />
                          ) : null}
                        </div>
                        {notification.link ? (
                          <div className="mt-2 text-xs font-semibold text-accent">
                            Tap to view →
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}