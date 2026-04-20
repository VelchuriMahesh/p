import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCcw, ChevronRight, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HabitWidget from '../../components/HabitWidget';
import NGOCard from '../../components/NGOCard';
import UrgentNeedBanner from '../../components/UrgentNeedBanner';
import { useAuth } from '../../hooks/useAuth';
import { listenToHabit } from '../../services/habitService';
import {
  fetchPlatformStats,
  fetchSuggestedNGOs,
  fetchUrgentNeeds,
} from '../../services/ngoService';
import { fetchHeroSlides } from '../../services/adminService';
import { calculateDistanceKm, getCurrentPosition } from '../../utils/location';

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

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ngos, setNgos] = useState([]);
  const [urgentNeeds, setUrgentNeeds] = useState([]);
  const [stats, setStats] = useState({ totalMeals: 0, totalDonors: 0 });
  const [habit, setHabit] = useState(null);
  const [location, setLocation] = useState(null);
  const [heroSlides, setHeroSlides] = useState(defaultSlides);
  const [heroIndex, setHeroIndex] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartRef = useRef(0);

  useEffect(() => {
    fetchHeroSlides().then((slides) => {
      if (slides.length > 0) setHeroSlides(slides);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(
      () => setHeroIndex((i) => (i + 1) % heroSlides.length),
      4500
    );
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentLocation = await getCurrentPosition().catch(() => null);
      setLocation(currentLocation);
      const [suggestedNgos, nextUrgentNeeds, platformStats] = await Promise.all([
        fetchSuggestedNGOs(currentLocation),
        fetchUrgentNeeds(),
        fetchPlatformStats(),
      ]);
      setNgos(suggestedNgos);
      setUrgentNeeds(nextUrgentNeeds);
      setStats(platformStats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!user) return undefined;
    return listenToHabit(user.uid, setHabit);
  }, [user]);

  const handleHabitDonate = () => {
    const targetNgo = ngos[0];
    if (!targetNgo) return;
    navigate(`/ngo/${targetNgo.ngoId}/donate?amount=10`);
  };

  const handleTouchStart = (event) => {
    if (window.scrollY === 0) touchStartRef.current = event.touches[0].clientY;
  };
  const handleTouchMove = (event) => {
    if (!touchStartRef.current || window.scrollY !== 0) return;
    setPullDistance(Math.min(90, Math.max(0, event.touches[0].clientY - touchStartRef.current) / 2));
  };
  const handleTouchEnd = async () => {
    if (pullDistance > 55) await loadData();
    touchStartRef.current = 0;
    setPullDistance(0);
  };

  const currentSlide = heroSlides[heroIndex] || defaultSlides[0];

  return (
    <div
      className="page-shell"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex items-center justify-center gap-2 text-xs text-muted py-1"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        <RefreshCcw className={`h-3 w-3 ${pullDistance > 55 ? 'animate-spin text-accent' : ''}`} />
        {pullDistance > 55 ? 'Release to refresh' : 'Pull to refresh'}
      </div>

      {/* CINEMATIC HERO */}
      <div className="relative overflow-hidden" style={{ height: '88vw', maxHeight: '420px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={heroIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${currentSlide.bg})` }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6">
          <motion.div
            key={`text-${heroIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <span className="inline-block rounded-full bg-accent/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white mb-3">
              {currentSlide.tag}
            </span>
            <h1 className="text-[22px] font-extrabold text-white leading-tight mb-2">
              {currentSlide.headline}
            </h1>
            <p className="text-sm text-white/70 mb-4 leading-5">{currentSlide.sub}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => navigate(currentSlide.ctaLink || '/map')}
                className="flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-white shadow-lg shadow-accent/40"
              >
                {currentSlide.ctaText || 'Donate now'}
                <ArrowRight className="h-4 w-4" />
              </button>
              {currentSlide.secondaryText ? (
                <button
                  type="button"
                  onClick={() => navigate(currentSlide.secondaryLink || '/feed')}
                  className="flex items-center gap-2 rounded-2xl bg-white/20 backdrop-blur px-5 py-3 text-sm font-bold text-white"
                >
                  {currentSlide.secondaryText}
                </button>
              ) : null}
            </div>
          </motion.div>
        </div>

        {/* Slide indicators */}
        <div className="absolute top-4 right-4 flex gap-1.5">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setHeroIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === heroIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-6 px-4 py-5">

        {/* IMPACT STATS */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Meals funded', value: stats.totalMeals, emoji: '🍱', color: 'bg-orange-50' },
            { label: 'Active donors', value: stats.totalDonors, emoji: '❤️', color: 'bg-rose-50' },
            { label: 'NGOs', value: ngos.length, emoji: '🏠', color: 'bg-blue-50' },
          ].map((item) => (
            <div key={item.label} className={`${item.color} rounded-2xl p-3 text-center`}>
              <span className="text-xl">{item.emoji}</span>
              <p className="text-lg font-extrabold text-navy mt-1">{item.value}</p>
              <p className="text-[10px] text-muted">{item.label}</p>
            </div>
          ))}
        </div>

        {/* URGENT NEEDS */}
        {(loading || urgentNeeds.length > 0) ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500">
                  <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                </span>
                <h2 className="text-base font-bold text-navy">Urgent — act now</h2>
              </div>
              <span className="text-xs font-semibold text-rose-500">Time sensitive</span>
            </div>
            {loading ? (
              <div className="skeleton h-28 rounded-2xl" />
            ) : (
              urgentNeeds.slice(0, 3).map((need) => {
                const ngo = ngos.find((item) => item.ngoId === need.ngoId);
                return (
                  <UrgentNeedBanner
                    key={need.needId}
                    need={need}
                    ngoName={ngo?.name || 'Partner NGO'}
                    ngoId={need.ngoId}
                  />
                );
              })
            )}
          </section>
        ) : null}

        {/* HABIT WIDGET */}
        <HabitWidget streakDays={habit?.streakDays || 0} onDonate={handleHabitDonate} />

        {/* NGO CARDS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-navy">Homes near you</h2>
            <button
              type="button"
              onClick={() => navigate('/map')}
              className="flex items-center gap-1 text-sm font-semibold text-accent"
            >
              See all <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {loading ? (
            <div className="skeleton h-36 rounded-2xl" />
          ) : (
            ngos.slice(0, 4).map((ngo) => (
              <NGOCard
                key={ngo.ngoId}
                ngo={ngo}
                distanceLabel={
                  location
                    ? `${calculateDistanceKm(location, { lat: ngo.lat, lng: ngo.lng }).toFixed(1)} km`
                    : null
                }
              />
            ))
          )}
        </section>

        {/* FEED PROMO */}
        <section
          className="relative overflow-hidden rounded-[28px] bg-navy p-6 text-white shadow-card cursor-pointer"
          onClick={() => navigate('/feed')}
        >
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-accent/20" />
          <div className="absolute -right-2 -bottom-4 h-20 w-20 rounded-full bg-accent/10" />
          <div className="relative z-10">
            <span className="inline-block rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white mb-3">
              📸 Stories feed
            </span>
            <h2 className="text-xl font-bold text-white">See what's happening in the homes</h2>
            <p className="mt-2 text-sm text-white/60 leading-5">
              Real photos and updates from NGOs. Like, share and support.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm font-bold text-accent">
              Open feed <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}