import { useEffect, useMemo, useState } from 'react';
import { Award, Package, Heart, TrendingUp, Flame, Camera, Edit3, Lock, Save, X, Gift, Star, Calendar } from 'lucide-react';
import { fetchMyDeliveries } from '../../services/deliveryService';
import { fetchMyDonations } from '../../services/donationService';
import { useAuth } from '../../hooks/useAuth';
import DonationStatusBadge from '../../components/DonationStatusBadge';
import { formatCurrency, formatDate } from '../../utils/date';
import { openCertificate } from '../../services/certificateService';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { uploadImageToImgBB } from '../../utils/uploadImage';
import { useNavigate } from 'react-router-dom';

const tabs = ['overview', 'donations', 'deliveries', 'certificates', 'profile'];

const occasions = [
  { emoji: '🎂', label: 'Birthday', desc: 'Celebrate your special day by feeding elders', color: 'from-pink-400 to-rose-500' },
  { emoji: '💍', label: 'Anniversary', desc: 'Mark years of love with an act of kindness', color: 'from-purple-400 to-pink-500' },
  { emoji: '🕯️', label: 'Tribute', desc: 'Honor a memory with a donation in their name', color: 'from-slate-400 to-slate-600' },
  { emoji: '🎓', label: 'Graduation', desc: 'Celebrate success by giving back', color: 'from-blue-400 to-indigo-500' },
  { emoji: '🙏', label: 'Gratitude', desc: 'Simply give because you can', color: 'from-emerald-400 to-teal-500' },
  { emoji: '🎉', label: 'Any occasion', desc: 'Every day is a good day to help', color: 'from-accent to-orange-400' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { profile, user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [donations, setDonations] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', bio: '' });
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [nextDonations, nextDeliveries] = await Promise.all([
          fetchMyDonations(),
          fetchMyDeliveries(),
        ]);
        setDonations(nextDonations);
        setDeliveries(nextDeliveries);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
      });
      setProfilePhotoPreview(profile.photoURL || user?.photoURL || null);
    }
  }, [profile, user]);

  const certificates = useMemo(
    () =>
      [...donations, ...deliveries]
        .filter((item) => item.certificateUrl)
        .sort((a, b) => (b.verifiedAt?.seconds || 0) - (a.verifiedAt?.seconds || 0)),
    [donations, deliveries]
  );

  const totalDonated = useMemo(
    () => donations.filter((d) => d.status === 'verified').reduce((sum, d) => sum + (d.amount || 0), 0),
    [donations]
  );

  const totalDeliveries = useMemo(
    () => deliveries.filter((d) => d.status === 'verified').length,
    [deliveries]
  );

  const pendingCount = useMemo(
    () => [...donations, ...deliveries].filter((d) => d.status === 'pending').length,
    [donations, deliveries]
  );

  const chartData = useMemo(() => {
    const map = {};
    donations.filter((d) => d.status === 'verified').forEach((d) => {
      const date = d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt || 0);
      const key = `${date.getDate()}/${date.getMonth() + 1}`;
      map[key] = (map[key] || 0) + (d.amount || 0);
    });
    return Object.entries(map).map(([date, amount]) => ({ date, amount })).slice(-7);
  }, [donations]);

  const impactMeals = useMemo(
    () => Math.round(totalDonated / 50) + totalDeliveries * 2,
    [totalDonated, totalDeliveries]
  );

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      let photoURL = user?.photoURL || null;
      if (profilePhotoFile) {
        photoURL = await uploadImageToImgBB(profilePhotoFile);
      }
      await updateProfile(auth.currentUser, {
        displayName: profileForm.name,
        photoURL,
      });
      await updateDoc(doc(db, 'users', user.uid), {
        name: profileForm.name,
        phone: profileForm.phone || '',
        bio: profileForm.bio || '',
        photoURL,
      });
      await refreshProfile();
      setEditingProfile(false);
      setProfilePhotoFile(null);
    } catch (error) {
      alert(error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPass !== passwordForm.confirm) {
      setPasswordMsg('New passwords do not match.');
      return;
    }
    if (passwordForm.newPass.length < 6) {
      setPasswordMsg('Password must be at least 6 characters.');
      return;
    }
    setSavingPassword(true);
    setPasswordMsg('');
    try {
      const credential = EmailAuthProvider.credential(user.email, passwordForm.current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, passwordForm.newPass);
      setPasswordMsg('Password changed successfully!');
      setPasswordForm({ current: '', newPass: '', confirm: '' });
      setTimeout(() => { setShowPasswordForm(false); setPasswordMsg(''); }, 2000);
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        setPasswordMsg('Current password is incorrect.');
      } else if (error.code === 'auth/too-many-requests') {
        setPasswordMsg('Too many attempts. Please try again later.');
      } else {
        setPasswordMsg(error.message);
      }
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-md space-y-4 px-4 py-5">

        {/* Profile card */}
        <section className="rounded-[28px] bg-navy p-5 text-white shadow-card">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={profilePhotoPreview || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80'}
                alt={profile?.name}
                className="h-16 w-16 rounded-full object-cover border-2 border-white/20"
              />
              {editingProfile ? (
                <label className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-accent">
                  <Camera className="h-3 w-3 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setProfilePhotoFile(f);
                      setProfilePhotoPreview(f ? URL.createObjectURL(f) : profilePhotoPreview);
                    }}
                  />
                </label>
              ) : null}
            </div>
            <div className="flex-1">
              <p className="text-xs text-white/60">Welcome back</p>
              <h1 className="text-xl font-bold text-white">{profile?.name || 'Donor'}</h1>
              <div className="mt-1 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                <span className="text-xs text-white/70">{profile?.streakDays || 0} day streak</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
            >
              <Edit3 className="h-4 w-4 text-white" />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/10 p-3 text-center">
              <Heart className="h-4 w-4 text-accent mx-auto mb-1" />
              <p className="text-base font-bold text-white">{formatCurrency(totalDonated)}</p>
              <p className="text-[10px] text-white/50">Donated</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 text-center">
              <Package className="h-4 w-4 text-accent mx-auto mb-1" />
              <p className="text-base font-bold text-white">{totalDeliveries}</p>
              <p className="text-[10px] text-white/50">Deliveries</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 text-center">
              <Award className="h-4 w-4 text-accent mx-auto mb-1" />
              <p className="text-base font-bold text-white">{certificates.length}</p>
              <p className="text-[10px] text-white/50">Certificates</p>
            </div>
          </div>

          {pendingCount > 0 ? (
            <div className="mt-4 rounded-2xl bg-amber-500/20 border border-amber-400/30 px-4 py-3">
              <p className="text-sm font-semibold text-amber-300">{pendingCount} pending verification</p>
              <p className="text-xs text-amber-200/70 mt-0.5">NGO will verify and issue certificates soon.</p>
            </div>
          ) : null}
        </section>

        {/* Occasions section — main purpose of the app */}
        <section className="rounded-[28px] bg-white p-5 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="h-5 w-5 text-accent" />
            <h2 className="text-base font-bold text-navy">Celebrate with purpose</h2>
          </div>
          <p className="text-xs text-muted mb-4">Turn your special moments into meals and care for elders.</p>
          <div className="grid grid-cols-2 gap-3">
            {occasions.map((occasion) => (
              <button
                key={occasion.label}
                type="button"
                onClick={() => navigate('/map')}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${occasion.color} p-4 text-left`}
              >
                <span className="text-2xl block mb-2">{occasion.emoji}</span>
                <p className="text-sm font-bold text-white">{occasion.label}</p>
                <p className="text-[10px] text-white/70 mt-0.5 leading-4">{occasion.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Impact chart */}
        <section className="rounded-[28px] bg-white p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-navy">Your impact</p>
              <p className="text-xs text-muted">Estimated meals provided</p>
            </div>
            <div className="rounded-2xl bg-accent/10 px-4 py-2 text-center">
              <p className="text-xl font-bold text-accent">{impactMeals}</p>
              <p className="text-[10px] text-muted">meals</p>
            </div>
          </div>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(val) => [`₹${val}`, 'Donated']} />
                <Line type="monotone" dataKey="amount" stroke="#FF6B35" strokeWidth={2} dot={{ fill: '#FF6B35', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-16 rounded-2xl bg-cream text-xs text-muted gap-2">
              <TrendingUp className="h-4 w-4" />
              Make more donations to see your giving trend
            </div>
          )}
        </section>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar rounded-2xl bg-white p-1.5 shadow-card">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`min-h-10 rounded-xl px-3 text-xs font-semibold capitalize whitespace-nowrap relative shrink-0 ${
                activeTab === tab ? 'bg-accent text-white' : 'text-muted'
              }`}
            >
              {tab}
              {tab === 'certificates' && certificates.length > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
                  {certificates.length}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {loading ? <div className="skeleton h-64 rounded-[24px]" /> : null}

        {/* Overview tab */}
        {!loading && activeTab === 'overview' ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-navy px-1">Recent activity</p>
            {[...donations, ...deliveries]
              .sort((a, b) => {
                const aDate = (a.createdAt || a.deliveredAt)?.seconds || 0;
                const bDate = (b.createdAt || b.deliveredAt)?.seconds || 0;
                return bDate - aDate;
              })
              .slice(0, 5)
              .map((item) => (
                <div key={item.donationId || item.deliveryId} className="rounded-2xl bg-white p-4 shadow-card">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${item.donationId ? 'bg-accent/10' : 'bg-navy/10'}`}>
                      {item.donationId ? <Heart className="h-4 w-4 text-accent" /> : <Package className="h-4 w-4 text-navy" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy truncate">{item.ngoName}</p>
                      <p className="text-xs text-muted">{item.donationId ? formatCurrency(item.amount) : item.itemsDelivered}</p>
                    </div>
                    <div className="text-right">
                      <DonationStatusBadge status={item.status} />
                      <p className="text-[10px] text-muted mt-1">{formatDate(item.createdAt || item.deliveredAt)}</p>
                    </div>
                  </div>
                  {item.certificateUrl ? (
                    <button type="button" onClick={() => openCertificate(item.certificateUrl)} className="mt-3 flex min-h-9 w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 text-xs font-semibold text-emerald-700">
                      <Award className="h-3.5 w-3.5" />
                      View Certificate
                    </button>
                  ) : null}
                </div>
              ))}
            {donations.length === 0 && deliveries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-muted">
                No activity yet. Start donating or delivering!
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Donations tab */}
        {!loading && activeTab === 'donations' ? (
          <div className="space-y-3">
            {donations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center">
                <Heart className="h-8 w-8 text-muted mx-auto mb-2" />
                <p className="text-sm text-muted">No donations yet.</p>
                <button type="button" onClick={() => navigate('/map')} className="mt-3 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white">
                  Donate now
                </button>
              </div>
            ) : null}
            {donations.map((item) => (
              <div key={item.donationId} className="rounded-2xl bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy">{item.ngoName}</p>
                    <p className="mt-0.5 text-base font-bold text-accent">{formatCurrency(item.amount)}</p>
                    <p className="mt-0.5 text-xs text-muted">{formatDate(item.createdAt)}</p>
                    {item.utr ? <p className="mt-0.5 text-xs text-muted">UTR: {item.utr}</p> : null}
                    {item.rejectionReason ? <p className="mt-1 text-xs text-rose-600">❌ {item.rejectionReason}</p> : null}
                  </div>
                  <DonationStatusBadge status={item.status} />
                </div>
                {item.certificateUrl ? (
                  <button type="button" onClick={() => openCertificate(item.certificateUrl)} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 text-sm font-semibold text-emerald-700">
                    <Award className="h-4 w-4" />
                    View Certificate
                  </button>
                ) : item.status === 'verified' ? (
                  <div className="mt-3 flex min-h-10 w-full items-center justify-center rounded-xl bg-amber-50 text-sm text-amber-600">
                    ⏳ Certificate being prepared by NGO
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {/* Deliveries tab */}
        {!loading && activeTab === 'deliveries' ? (
          <div className="space-y-3">
            {deliveries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center">
                <Package className="h-8 w-8 text-muted mx-auto mb-2" />
                <p className="text-sm text-muted">No deliveries yet.</p>
              </div>
            ) : null}
            {deliveries.map((item) => (
              <div key={item.deliveryId} className="rounded-2xl bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy">{item.ngoName}</p>
                    <p className="mt-0.5 text-sm text-muted">{item.itemsDelivered}</p>
                    <p className="mt-0.5 text-xs text-muted">{formatDate(item.deliveredAt)}</p>
                    {item.rejectionReason ? <p className="mt-1 text-xs text-rose-600">❌ {item.rejectionReason}</p> : null}
                  </div>
                  <DonationStatusBadge status={item.status} />
                </div>
                {item.certificateUrl ? (
                  <button type="button" onClick={() => openCertificate(item.certificateUrl)} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 text-sm font-semibold text-emerald-700">
                    <Award className="h-4 w-4" />
                    View Certificate
                  </button>
                ) : item.status === 'verified' ? (
                  <div className="mt-3 flex min-h-10 w-full items-center justify-center rounded-xl bg-amber-50 text-sm text-amber-600">
                    ⏳ Certificate being prepared by NGO
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {/* Certificates tab */}
        {!loading && activeTab === 'certificates' ? (
          <div className="space-y-3">
            {certificates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center">
                <Award className="h-8 w-8 text-muted mx-auto mb-2" />
                <p className="text-sm text-muted">No certificates yet.</p>
                <p className="text-xs text-muted mt-1">Get verified by an NGO to receive one.</p>
              </div>
            ) : null}
            {certificates.map((item) => (
              <div key={item.certificateId || item.donationId || item.deliveryId} className="rounded-2xl bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-accent">
                      {item.donationId ? 'Donation Certificate' : 'Delivery Certificate'}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-navy">{item.ngoName}</p>
                    <p className="mt-0.5 text-xs text-muted">{formatDate(item.verifiedAt || item.createdAt || item.deliveredAt)}</p>
                    {item.amount ? <p className="mt-0.5 text-sm font-bold text-accent">{formatCurrency(item.amount)}</p> : null}
                    {item.itemsDelivered ? <p className="mt-0.5 text-xs text-muted">{item.itemsDelivered}</p> : null}
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Ready</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => openCertificate(item.certificateUrl)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white">
                    <Award className="h-4 w-4" />
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const text = `I helped elders through Celebrate With Purpose! 🎉`;
                      if (navigator.share) navigator.share({ text });
                      else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-navy text-sm font-semibold text-navy"
                  >
                    Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Profile tab */}
        {activeTab === 'profile' ? (
          <div className="space-y-4">
            <div className="rounded-[28px] bg-white p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-navy">Edit profile</h2>
                {!editingProfile ? (
                  <button type="button" onClick={() => setEditingProfile(true)} className="flex items-center gap-1.5 rounded-xl bg-accent/10 px-3 py-2 text-xs font-bold text-accent">
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                ) : null}
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={profilePhotoPreview || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80'}
                    alt="Profile"
                    className="h-20 w-20 rounded-full object-cover border-2 border-slate-200"
                  />
                  {editingProfile ? (
                    <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-accent shadow">
                      <Camera className="h-3.5 w-3.5 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setProfilePhotoFile(f);
                        setProfilePhotoPreview(f ? URL.createObjectURL(f) : profilePhotoPreview);
                      }} />
                    </label>
                  ) : null}
                </div>
                <div>
                  <p className="text-base font-bold text-navy">{profile?.name || 'Donor'}</p>
                  <p className="text-sm text-muted">{user?.email}</p>
                  {profile?.bio ? <p className="text-xs text-muted mt-1">{profile.bio}</p> : null}
                </div>
              </div>

              {editingProfile ? (
                <div className="space-y-3">
                  <input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((c) => ({ ...c, name: e.target.value }))}
                    placeholder="Your name"
                    className="min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent"
                  />
                  <input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((c) => ({ ...c, phone: e.target.value }))}
                    placeholder="Phone number (optional)"
                    className="min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent"
                  />
                  <textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm((c) => ({ ...c, bio: e.target.value }))}
                    placeholder="Short bio (optional)"
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-accent"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={handleSaveProfile} disabled={savingProfile} className="min-h-11 rounded-xl bg-accent text-sm font-bold text-white disabled:opacity-70 flex items-center justify-center gap-2">
                      <Save className="h-4 w-4" />
                      {savingProfile ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" onClick={() => { setEditingProfile(false); setProfilePhotoFile(null); setProfilePhotoPreview(profile?.photoURL || user?.photoURL || null); }} className="min-h-11 rounded-xl border border-slate-200 text-sm font-bold text-navy">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-muted">Email</span>
                    <span className="font-semibold text-navy">{user?.email}</span>
                  </div>
                  {profile?.phone ? (
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-muted">Phone</span>
                      <span className="font-semibold text-navy">{profile.phone}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-muted">Total donated</span>
                    <span className="font-semibold text-accent">{formatCurrency(totalDonated)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-muted">Deliveries</span>
                    <span className="font-semibold text-navy">{totalDeliveries}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted">Streak</span>
                    <span className="font-semibold text-navy">{profile?.streakDays || 0} days 🔥</span>
                  </div>
                </div>
              )}
            </div>

            {/* Password change */}
            <div className="rounded-[28px] bg-white p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-navy" />
                  <h2 className="text-base font-bold text-navy">Password</h2>
                </div>
                {!showPasswordForm ? (
                  <button type="button" onClick={() => setShowPasswordForm(true)} className="text-sm font-semibold text-accent">
                    Change
                  </button>
                ) : null}
              </div>

              {showPasswordForm ? (
                <div className="space-y-3">
                  <input
                    type="password"
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm((c) => ({ ...c, current: e.target.value }))}
                    placeholder="Current password"
                    className="min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent"
                  />
                  <input
                    type="password"
                    value={passwordForm.newPass}
                    onChange={(e) => setPasswordForm((c) => ({ ...c, newPass: e.target.value }))}
                    placeholder="New password (min 6 characters)"
                    className="min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent"
                  />
                  <input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm((c) => ({ ...c, confirm: e.target.value }))}
                    placeholder="Confirm new password"
                    className="min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent"
                  />
                  {passwordMsg ? (
                    <p className={`text-sm rounded-xl px-4 py-3 ${passwordMsg.includes('successfully') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {passwordMsg}
                    </p>
                  ) : null}
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={handleChangePassword} disabled={savingPassword} className="min-h-11 rounded-xl bg-navy text-sm font-bold text-white disabled:opacity-70">
                      {savingPassword ? 'Saving...' : 'Update password'}
                    </button>
                    <button type="button" onClick={() => { setShowPasswordForm(false); setPasswordForm({ current: '', newPass: '', confirm: '' }); setPasswordMsg(''); }} className="min-h-11 rounded-xl border border-slate-200 text-sm font-bold text-navy">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted">Keep your account secure with a strong password.</p>
              )}
            </div>

            {/* Account info */}
            <div className="rounded-[28px] bg-white p-5 shadow-card">
              <h2 className="text-base font-bold text-navy mb-3">My giving stats</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-cream p-3 text-center">
                  <p className="text-2xl font-extrabold text-accent">{formatCurrency(totalDonated)}</p>
                  <p className="text-xs text-muted mt-0.5">Total donated</p>
                </div>
                <div className="rounded-2xl bg-cream p-3 text-center">
                  <p className="text-2xl font-extrabold text-navy">{impactMeals}</p>
                  <p className="text-xs text-muted mt-0.5">Meals funded</p>
                </div>
                <div className="rounded-2xl bg-cream p-3 text-center">
                  <p className="text-2xl font-extrabold text-navy">{totalDeliveries}</p>
                  <p className="text-xs text-muted mt-0.5">Deliveries made</p>
                </div>
                <div className="rounded-2xl bg-cream p-3 text-center">
                  <p className="text-2xl font-extrabold text-navy">{profile?.streakDays || 0}🔥</p>
                  <p className="text-xs text-muted mt-0.5">Day streak</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}