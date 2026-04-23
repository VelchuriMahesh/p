import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNgoDonations, fetchNgoDeliveries, fetchMyNgoProfile } from '../../services/ngoAdminService';
import { formatCurrency, formatDate } from '../../utils/date';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Bell, CheckCircle2, Clock, TrendingUp, Award, Package, Heart, ChevronRight, X } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { markNotificationAsRead, markAllAsRead } from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';
import { formatDateTime } from '../../utils/date';

export default function NGODashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ngo, setNgo] = useState(null);
  const [donations, setDonations] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount } = useNotifications();

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [nextNgo, nextDonations, nextDeliveries] = await Promise.all([
          fetchMyNgoProfile(),
          fetchNgoDonations(),
          fetchNgoDeliveries(),
        ]);
        setNgo(nextNgo);
        setDonations(nextDonations);
        setDeliveries(nextDeliveries);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const pendingDonations = useMemo(() => donations.filter((d) => d.status === 'pending'), [donations]);
  const verifiedDonations = useMemo(() => donations.filter((d) => d.status === 'verified'), [donations]);
  const pendingDeliveries = useMemo(() => deliveries.filter((d) => d.status === 'pending'), [deliveries]);
  const totalReceived = useMemo(() => verifiedDonations.reduce((sum, d) => sum + (d.amount || 0), 0), [verifiedDonations]);
  const totalPending = useMemo(() => pendingDonations.reduce((sum, d) => sum + (d.amount || 0), 0), [pendingDonations]);

  const chartData = useMemo(() => {
    const map = {};
    verifiedDonations.forEach((d) => {
      const date = d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt || 0);
      const key = `${date.getDate()}/${date.getMonth() + 1}`;
      map[key] = (map[key] || 0) + (d.amount || 0);
    });
    return Object.entries(map).map(([date, amount]) => ({ date, amount })).slice(-7);
  }, [verifiedDonations]);

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-5">

      {/* Notification panel */}
      {showNotifications ? (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowNotifications(false)}>
          <div
            className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-navy">Notifications</p>
                {unreadCount > 0 ? <p className="text-xs text-muted">{unreadCount} unread</p> : null}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => user && markAllAsRead(user.uid)}
                    className="text-xs font-semibold text-accent"
                  >
                    Mark all read
                  </button>
                ) : null}
                <button type="button" onClick={() => setShowNotifications(false)} className="text-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted">No notifications yet.</div>
              ) : null}
              {notifications.map((notification) => (
                <button
                  key={notification.notifId}
                  type="button"
                  onClick={async () => {
                    if (!notification.read) await markNotificationAsRead(notification.notifId);
                    setShowNotifications(false);
                    if (notification.link) navigate(notification.link);
                  }}
                  className={`w-full rounded-2xl border p-3 text-left ${
                    notification.read ? 'bg-white border-slate-100' : 'bg-accent/5 border-accent/20'
                  }`}
                >
                  <p className={`text-sm ${notification.read ? 'font-medium' : 'font-bold'} text-navy leading-tight`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted mt-0.5 leading-4">{notification.body}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(notification.createdAt)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <section className="rounded-[28px] bg-navy p-5 text-white shadow-card">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">NGO Dashboard</p>
            <h1 className="mt-1 text-2xl font-bold text-white">{ngo?.name || 'Partner home'}</h1>
            <p className="mt-1 text-xs text-white/50">{ngo?.address}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowNotifications(true)}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/10"
          >
            <Bell className="h-5 w-5 text-white" />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <Heart className="h-4 w-4 text-accent mb-2" />
            <p className="text-2xl font-bold text-white">{formatCurrency(totalReceived)}</p>
            <p className="text-xs text-white/50">Total received</p>
            <p className="text-xs text-emerald-400 mt-1">{verifiedDonations.length} verified</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <Clock className="h-4 w-4 text-amber-400 mb-2" />
            <p className="text-2xl font-bold text-white">{formatCurrency(totalPending)}</p>
            <p className="text-xs text-white/50">Pending amount</p>
            <p className="text-xs text-amber-400 mt-1">{pendingDonations.length} to review</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <Package className="h-4 w-4 text-blue-400 mb-2" />
            <p className="text-2xl font-bold text-white">{pendingDeliveries.length}</p>
            <p className="text-xs text-white/50">Pending deliveries</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <Award className="h-4 w-4 text-accent mb-2" />
            <p className="text-2xl font-bold text-white">
              {new Set(donations.map((d) => d.donorUid)).size}
            </p>
            <p className="text-xs text-white/50">Unique donors</p>
          </div>
        </div>
      </section>

      {pendingDonations.length > 0 ? (
        <button type="button" onClick={() => navigate('/ngo-dashboard/donations')} className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left shadow-card flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <Bell className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">{pendingDonations.length} donation{pendingDonations.length > 1 ? 's' : ''} need verification</p>
            <p className="text-xs text-amber-600">Tap to review and issue certificates</p>
          </div>
          <ChevronRight className="h-4 w-4 text-amber-600" />
        </button>
      ) : null}

      {pendingDeliveries.length > 0 ? (
        <button type="button" onClick={() => navigate('/ngo-dashboard/deliveries')} className="w-full rounded-2xl border border-blue-200 bg-blue-50 p-4 text-left shadow-card flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-800">{pendingDeliveries.length} deliver{pendingDeliveries.length > 1 ? 'ies' : 'y'} need verification</p>
            <p className="text-xs text-blue-600">Tap to review delivery proofs</p>
          </div>
          <ChevronRight className="h-4 w-4 text-blue-600" />
        </button>
      ) : null}

      {chartData.length > 1 ? (
        <section className="rounded-[28px] bg-white p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-navy">Donation trend</p>
              <p className="text-xs text-muted">Last 7 days activity</p>
            </div>
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(val) => [`₹${val}`, 'Amount']} />
              <Bar dataKey="amount" fill="#FF6B35" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-3">
        {[
          { label: 'Add need', path: '/ngo-dashboard/needs', icon: '📋', desc: 'Post what you need', color: 'bg-accent/10' },
          { label: 'Upload post', path: '/ngo-dashboard/posts', icon: '📸', desc: 'Share a story', color: 'bg-navy/10' },
          { label: 'Donations', path: '/ngo-dashboard/donations', icon: '💰', desc: `${pendingDonations.length} pending`, color: pendingDonations.length > 0 ? 'bg-amber-50' : 'bg-emerald-50' },
          { label: 'Deliveries', path: '/ngo-dashboard/deliveries', icon: '📦', desc: `${pendingDeliveries.length} pending`, color: pendingDeliveries.length > 0 ? 'bg-blue-50' : 'bg-emerald-50' },
          { label: 'NGO Profile', path: '/ngo-dashboard/profile', icon: '⚙️', desc: 'Update details', color: 'bg-slate-50' },
        ].map((item) => (
          <button
            type="button"
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`rounded-2xl ${item.color} px-4 py-5 text-left shadow-card`}
          >
            <span className="text-2xl">{item.icon}</span>
            <p className="mt-2 text-sm font-semibold text-navy">{item.label}</p>
            <p className="mt-0.5 text-xs text-muted">{item.desc}</p>
          </button>
        ))}
      </section>

      {!loading ? (
        <section className="rounded-[28px] bg-white p-5 shadow-card">
          <p className="text-sm font-semibold text-navy mb-3">Recent donations</p>
          {donations.slice(0, 5).length === 0 ? (
            <p className="text-sm text-muted text-center py-4">No donations yet.</p>
          ) : (
            <div className="space-y-3">
              {donations.slice(0, 5).map((d) => (
                <div key={d.donationId} className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    d.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                    d.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {d.donorName?.[0]?.toUpperCase() || 'D'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-navy truncate">{d.donorName}</p>
                    <p className="text-xs text-muted">{formatDate(d.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-accent">{formatCurrency(d.amount)}</p>
                    <p className={`text-[10px] capitalize ${
                      d.status === 'verified' ? 'text-emerald-600' :
                      d.status === 'pending' ? 'text-amber-600' : 'text-rose-600'
                    }`}>{d.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}