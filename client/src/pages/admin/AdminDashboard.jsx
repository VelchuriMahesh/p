import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdminStats, fetchAllNgos, fetchHeroSlides, saveHeroSlides } from '../../services/adminService';
import { uploadImageToImgBB } from '../../utils/uploadImage';
import { formatCurrency } from '../../utils/date';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { Building2, Users, TrendingUp, Award, Bell, ChevronRight, Plus, Heart, Trash2, Image, Edit3, Save } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';

const COLORS = ['#2E7D32', '#FF6B35', '#E53935', '#D9A441'];

const defaultSlides = [
  {
    id: '1',
    bg: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1200&q=80',
    tag: 'Real people. Real need.',
    headline: 'Every meal you fund keeps an elder warm tonight.',
    sub: 'Thousands across India depend on your kindness.',
    ctaText: 'Feed one today',
    ctaLink: '/map',
    secondaryText: 'See stories',
    secondaryLink: '/feed',
  },
  {
    id: '2',
    bg: 'https://images.unsplash.com/photo-1531983412531-1f49a365ffed?auto=format&fit=crop&w=1200&q=80',
    tag: 'Celebrate with heart',
    headline: "Turn your birthday into someone's best day.",
    sub: 'Mark your moments by giving care to the forgotten.',
    ctaText: 'Donate now',
    ctaLink: '/map',
    secondaryText: 'Learn more',
    secondaryLink: '/home',
  },
  {
    id: '3',
    bg: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80',
    tag: 'Build a habit',
    headline: '₹10 a day. A lifetime of impact.',
    sub: 'Small daily kindness creates lasting meals and companionship.',
    ctaText: 'Start streak',
    ctaLink: '/map',
    secondaryText: 'See impact',
    secondaryLink: '/home',
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalNgos: 0, totalDonors: 0, totalDonationsAmount: 0, totalDeliveries: 0 });
  const [ngos, setNgos] = useState([]);
  const [recentDonations, setRecentDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroSlides, setHeroSlides] = useState(defaultSlides);
  const [editingSlide, setEditingSlide] = useState(null);
  const [slideForm, setSlideForm] = useState({});
  const [slideBgFile, setSlideBgFile] = useState(null);
  const [slideBgPreview, setSlideBgPreview] = useState(null);
  const [savingSlides, setSavingSlides] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsPayload, ngoList, savedSlides] = await Promise.all([
          fetchAdminStats(),
          fetchAllNgos(),
          fetchHeroSlides(),
        ]);
        setStats(statsPayload.stats);
        setNgos(ngoList);
        setRecentDonations(statsPayload.recentActivity || []);
        if (savedSlides.length > 0) setHeroSlides(savedSlides);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const ngoChartData = useMemo(
    () => ngos.slice(0, 5).map((n) => ({
      name: n.name?.split(' ')[0] || 'NGO',
      received: n.totalReceived || 0,
    })),
    [ngos]
  );

  const statusData = useMemo(() => {
    const pending = recentDonations.filter((d) => d.status === 'pending').length;
    const verified = recentDonations.filter((d) => d.status === 'verified').length;
    const rejected = recentDonations.filter((d) => d.status === 'rejected').length;
    return [
      { name: 'Verified', value: verified },
      { name: 'Pending', value: pending },
      { name: 'Rejected', value: rejected },
    ].filter((d) => d.value > 0);
  }, [recentDonations]);

  const inactiveNgos = useMemo(() => ngos.filter((n) => !n.isActive).length, [ngos]);

  const startEditSlide = (slide) => {
    setEditingSlide(slide.id);
    setSlideForm({ ...slide });
    setSlideBgFile(null);
    setSlideBgPreview(slide.bg);
  };

  const handleSaveSlide = async () => {
    setSavingSlides(true);
    try {
      let bg = slideForm.bg;
      if (slideBgFile) {
        bg = await uploadImageToImgBB(slideBgFile);
      }
      const updated = heroSlides.map((s) =>
        s.id === editingSlide ? { ...slideForm, bg } : s
      );
      setHeroSlides(updated);
      await saveHeroSlides(updated);
      setEditingSlide(null);
      setSlideBgFile(null);
      setSlideBgPreview(null);
      alert('Hero slides saved! Changes will appear on the home page.');
    } catch (error) {
      alert(error.message);
    } finally {
      setSavingSlides(false);
    }
  };

  const addNewSlide = () => {
    const newSlide = {
      id: Date.now().toString(),
      bg: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80',
      tag: 'New slide',
      headline: 'Enter your headline here',
      sub: 'Enter supporting text here',
      ctaText: 'Donate now',
      ctaLink: '/map',
      secondaryText: 'Learn more',
      secondaryLink: '/home',
    };
    setHeroSlides((prev) => [...prev, newSlide]);
    startEditSlide(newSlide);
  };

  const deleteSlide = async (id) => {
    if (heroSlides.length <= 1) { alert('Must have at least 1 slide.'); return; }
    const updated = heroSlides.filter((s) => s.id !== id);
    setHeroSlides(updated);
    await saveHeroSlides(updated);
  };

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-5">

      {/* Stats header */}
      <section className="rounded-[28px] bg-navy p-5 text-white shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Admin Console</p>
        <h1 className="mt-1 text-2xl font-bold text-white">Platform overview</h1>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <Building2 className="h-4 w-4 text-accent mb-2" />
            <p className="text-2xl font-bold text-white">{stats.totalNgos}</p>
            <p className="text-xs text-white/50">Total NGOs</p>
            <p className="text-xs text-emerald-400 mt-1">{ngos.filter((n) => n.isActive).length} active</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <Users className="h-4 w-4 text-accent mb-2" />
            <p className="text-2xl font-bold text-white">{stats.totalDonors}</p>
            <p className="text-xs text-white/50">Total donors</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <Heart className="h-4 w-4 text-accent mb-2" />
            <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalDonationsAmount)}</p>
            <p className="text-xs text-white/50">Total donations</p>
            <p className="text-xs text-emerald-400 mt-1">verified only</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <Award className="h-4 w-4 text-accent mb-2" />
            <p className="text-2xl font-bold text-white">{stats.totalDeliveries}</p>
            <p className="text-xs text-white/50">Deliveries</p>
          </div>
        </div>
      </section>

      {/* Alert */}
      {inactiveNgos > 0 ? (
        <button type="button" onClick={() => navigate('/admin/ngos')} className="w-full rounded-2xl border border-rose-200 bg-rose-50 p-4 text-left shadow-card flex items-center gap-3">
          <Bell className="h-5 w-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-800">{inactiveNgos} inactive NGO{inactiveNgos > 1 ? 's' : ''}</p>
            <p className="text-xs text-rose-600">Tap to review and activate</p>
          </div>
          <ChevronRight className="h-4 w-4 text-rose-600" />
        </button>
      ) : null}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => navigate('/admin/create-ngo')} className="rounded-2xl bg-accent p-4 text-left shadow-card flex items-center gap-3">
          <Plus className="h-5 w-5 text-white" />
          <div>
            <p className="text-sm font-bold text-white">Create NGO</p>
            <p className="text-xs text-white/70">Add new partner</p>
          </div>
        </button>
        <button type="button" onClick={() => navigate('/admin/ngos')} className="rounded-2xl bg-white p-4 text-left shadow-card">
          <Building2 className="h-5 w-5 text-navy mb-1" />
          <p className="text-sm font-bold text-navy">Manage NGOs</p>
          <p className="text-xs text-muted">{stats.totalNgos} registered</p>
        </button>
      </div>

      {/* TABS */}
      <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-white p-1.5 shadow-card">
        {['overview', 'hero slides', 'ngos'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`min-h-10 rounded-xl text-xs font-semibold capitalize ${activeTab === tab ? 'bg-accent text-white' : 'text-muted'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' ? (
        <>
          {ngoChartData.some((n) => n.received > 0) ? (
            <section className="rounded-[28px] bg-white p-5 shadow-card">
              <p className="text-sm font-semibold text-navy mb-1">NGO performance</p>
              <p className="text-xs text-muted mb-4">Amount received per NGO</p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={ngoChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val) => [`₹${val}`, 'Received']} />
                  <Bar dataKey="received" fill="#FF6B35" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>
          ) : null}

          {statusData.length > 0 ? (
            <section className="rounded-[28px] bg-white p-5 shadow-card">
              <p className="text-sm font-semibold text-navy mb-1">Donation status</p>
              <p className="text-xs text-muted mb-4">Recent donations breakdown</p>
              <div className="flex items-center gap-4">
                <PieChart width={120} height={120}>
                  <Pie data={statusData} cx={55} cy={55} innerRadius={30} outerRadius={55} dataKey="value">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="space-y-2">
                  {statusData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ background: COLORS[index] }} />
                      <p className="text-xs text-navy">{entry.name}: <span className="font-bold">{entry.value}</span></p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {!loading ? (
            <section className="rounded-[28px] bg-white p-5 shadow-card">
              <p className="text-sm font-semibold text-navy mb-3">Recent donations</p>
              {recentDonations.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">No donations yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentDonations.slice(0, 5).map((d) => (
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
                        <p className="text-xs text-muted truncate">{d.ngoName}</p>
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
        </>
      ) : null}

      {/* Hero Slides tab */}
      {activeTab === 'hero slides' ? (
        <div className="space-y-4">
          <div className="rounded-[28px] bg-white p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-navy">Hero slides</h2>
                <p className="text-xs text-muted mt-0.5">Control what donors see on the home page hero section.</p>
              </div>
              <button
                type="button"
                onClick={addNewSlide}
                disabled={heroSlides.length >= 5}
                className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Add slide
              </button>
            </div>
            <p className="text-xs text-muted">{heroSlides.length}/5 slides. Changes are saved to the app immediately.</p>
          </div>

          {heroSlides.map((slide, index) => (
            <div key={slide.id} className="rounded-2xl bg-white shadow-card overflow-hidden">
              {editingSlide === slide.id ? (
                <div className="p-4 space-y-3">
                  <p className="text-xs font-bold text-accent uppercase tracking-wide">Editing Slide {index + 1}</p>

                  {/* Background image */}
                  <div>
                    <p className="text-xs font-semibold text-navy mb-1">Background image</p>
                    {slideBgPreview ? (
                      <div className="relative mb-2">
                        <img src={slideBgPreview} alt="Slide bg" className="h-32 w-full rounded-xl object-cover" />
                        <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
                          <label className="cursor-pointer flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-xs font-bold text-white">
                            <Image className="h-3.5 w-3.5" />
                            Change image
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                              const f = e.target.files?.[0] || null;
                              setSlideBgFile(f);
                              setSlideBgPreview(f ? URL.createObjectURL(f) : slideBgPreview);
                            }} />
                          </label>
                        </div>
                      </div>
                    ) : null}
                    <input
                      value={slideForm.bg || ''}
                      onChange={(e) => setSlideForm((c) => ({ ...c, bg: e.target.value }))}
                      placeholder="Or paste image URL"
                      className="min-h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"
                    />
                  </div>

                  <input
                    value={slideForm.tag || ''}
                    onChange={(e) => setSlideForm((c) => ({ ...c, tag: e.target.value }))}
                    placeholder="Tag line (small text above headline)"
                    className="min-h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  />
                  <textarea
                    value={slideForm.headline || ''}
                    onChange={(e) => setSlideForm((c) => ({ ...c, headline: e.target.value }))}
                    placeholder="Main headline"
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    value={slideForm.sub || ''}
                    onChange={(e) => setSlideForm((c) => ({ ...c, sub: e.target.value }))}
                    placeholder="Supporting text"
                    className="min-h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-muted mb-1">Primary button text</p>
                      <input
                        value={slideForm.ctaText || ''}
                        onChange={(e) => setSlideForm((c) => ({ ...c, ctaText: e.target.value }))}
                        placeholder="e.g. Donate now"
                        className="min-h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted mb-1">Primary button link</p>
                      <input
                        value={slideForm.ctaLink || ''}
                        onChange={(e) => setSlideForm((c) => ({ ...c, ctaLink: e.target.value }))}
                        placeholder="e.g. /map"
                        className="min-h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted mb-1">Secondary button text</p>
                      <input
                        value={slideForm.secondaryText || ''}
                        onChange={(e) => setSlideForm((c) => ({ ...c, secondaryText: e.target.value }))}
                        placeholder="e.g. See stories"
                        className="min-h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted mb-1">Secondary button link</p>
                      <input
                        value={slideForm.secondaryLink || ''}
                        onChange={(e) => setSlideForm((c) => ({ ...c, secondaryLink: e.target.value }))}
                        placeholder="e.g. /feed"
                        className="min-h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleSaveSlide}
                      disabled={savingSlides}
                      className="min-h-10 rounded-xl bg-accent text-sm font-bold text-white disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {savingSlides ? 'Saving...' : 'Save slide'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingSlide(null); setSlideBgFile(null); setSlideBgPreview(null); }}
                      className="min-h-10 rounded-xl border border-slate-200 text-sm font-bold text-navy"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <img src={slide.bg} alt={slide.tag} className="h-28 w-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-end p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-accent uppercase">{slide.tag}</p>
                        <p className="text-xs font-bold text-white leading-tight truncate">{slide.headline}</p>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEditSlide(slide)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-navy" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSlide(slide.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-white" />
                      </button>
                    </div>
                    <div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90">
                      <span className="text-xs font-bold text-navy">{index + 1}</span>
                    </div>
                  </div>
                  <div className="p-3 flex gap-2">
                    <span className="rounded-lg bg-accent/10 px-3 py-1 text-xs font-bold text-accent">{slide.ctaText}</span>
                    <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-navy">{slide.secondaryText}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {/* NGOs tab */}
      {activeTab === 'ngos' ? (
        <section className="rounded-[28px] bg-white p-5 shadow-card">
          <p className="text-sm font-semibold text-navy mb-3">All NGOs ({ngos.length})</p>
          <div className="space-y-3">
            {ngos.map((ngo) => (
              <div key={ngo.ngoId} className="flex items-center gap-3">
                <img
                  src={ngo.logoUrl || 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=100&q=80'}
                  alt={ngo.name}
                  className="h-10 w-10 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-navy truncate">{ngo.name}</p>
                  <p className="text-xs text-muted truncate">{ngo.address}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-accent">{formatCurrency(ngo.totalReceived || 0)}</p>
                  <p className={`text-[10px] ${ngo.isActive ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {ngo.isActive ? '● Active' : '○ Inactive'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => navigate('/admin/ngos')} className="mt-4 w-full rounded-xl bg-cream py-2.5 text-sm font-semibold text-navy">
            Manage all NGOs →
          </button>
        </section>
      ) : null}

    </div>
  );
}