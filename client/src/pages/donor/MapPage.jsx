import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, Mic, MicOff, MapPin, Phone, Navigation, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchActiveNGOs } from '../../services/ngoService';

const toRad = (val) => (val * Math.PI) / 180;

const calculateDistanceKm = (from, to) => {
  if (from?.lat == null || from?.lng == null || to?.lat == null || to?.lng == null) return null;
  const R = 6371;
  const dLat = toRad(Number(to.lat) - Number(from.lat));
  const dLon = toRad(Number(to.lng) - Number(from.lng));
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(Number(from.lat))) *
      Math.cos(toRad(Number(to.lat))) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const hasValidCoords = (ngo) => {
  const lat = Number(ngo?.lat);
  const lng = Number(ngo?.lng);
  return ngo?.lat != null && ngo?.lng != null && !isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0);
};

/**
 * KEY FIX: Always use the NGO's address string as the destination in Google Maps.
 * Admins type the address correctly but may leave lat/lng wrong/default.
 * Address string → Google Maps geocodes it correctly on their end.
 *
 * Only fall back to coordinates if there is no address at all.
 */
const buildDirectionsUrl = (ngo, userLocation = null) => {
  // PRIORITY 1: Use address string — most accurate, admin-entered
  // PRIORITY 2: Fall back to raw coordinates only if no address
  const destination = ngo?.address
    ? encodeURIComponent(ngo.address)
    : hasValidCoords(ngo)
    ? `${Number(ngo.lat)},${Number(ngo.lng)}`
    : null;

  if (!destination) return null;

  const base = 'https://www.google.com/maps/dir/?api=1';

  if (userLocation?.lat != null && userLocation?.lng != null) {
    return `${base}&origin=${userLocation.lat},${userLocation.lng}&destination=${destination}&travelmode=driving`;
  }
  return `${base}&destination=${destination}&travelmode=driving`;
};

/**
 * Embed map preview — uses coordinates for precision if valid, else address.
 */
const getEmbedUrl = (ngo) => {
  if (hasValidCoords(ngo)) {
    return `https://maps.google.com/maps?q=${Number(ngo.lat)},${Number(ngo.lng)}&z=15&output=embed`;
  }
  if (ngo?.address) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(ngo.address)}&z=15&output=embed`;
  }
  return null;
};

export default function MapPage() {
  const navigate = useNavigate();
  const [allNgos, setAllNgos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [listening, setListening] = useState(false);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expandedNgo, setExpandedNgo] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    fetchActiveNGOs().then((list) => {
      setAllNgos(list);
      setFiltered(list);
      setLoading(false);
    });
  }, []);

  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setLocationLoading(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setLocationLoading(false);
        setFilter('nearby');
      },
      (err) => {
        setLocationLoading(false);
        if (err.code === 1) setLocationError('Location permission denied. Please allow location access in your browser settings.');
        else if (err.code === 2) setLocationError('Location unavailable. Please try again.');
        else setLocationError('Could not get your location. Please try again.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    let result = [...allNgos];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.name?.toLowerCase().includes(q) ||
          n.address?.toLowerCase().includes(q) ||
          n.description?.toLowerCase().includes(q) ||
          n.city?.toLowerCase().includes(q) ||
          n.state?.toLowerCase().includes(q)
      );
    }
    if (filter === 'nearby' && userLocation) {
      result = result.filter((n) => {
        const dist = calculateDistanceKm(userLocation, { lat: n.lat, lng: n.lng });
        return dist !== null && dist <= 100;
      });
    }
    if (userLocation) {
      result.sort((a, b) => {
        const da = calculateDistanceKm(userLocation, { lat: a.lat, lng: a.lng }) ?? 9999;
        const db = calculateDistanceKm(userLocation, { lat: b.lat, lng: b.lng }) ?? 9999;
        return da - db;
      });
    }
    setFiltered(result);
  }, [search, filter, allNgos, userLocation]);

  const handleFilterChange = (newFilter) => {
    if (newFilter === 'nearby' && !userLocation) getUserLocation();
    else setFilter(newFilter);
  };

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Voice search not supported in this browser.'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.onresult = (event) => { setSearch(event.results[0][0].transcript); setListening(false); };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopVoice = () => { recognitionRef.current?.stop(); setListening(false); };

  const handleDirections = (e, ngo) => {
    e.stopPropagation();
    const url = buildDirectionsUrl(ngo, userLocation);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-md space-y-4 px-4 py-5">

        <section className="rounded-[28px] bg-white p-5 shadow-card">
          <h1 className="text-2xl font-bold text-navy">Find an old age home</h1>
          <p className="mt-1 text-sm text-muted">Search by name, city or area. Use voice to search hands-free.</p>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-cream px-4 py-2.5">
            <Search className="h-4 w-4 text-muted shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, city or area..."
              className="flex-1 bg-transparent text-sm outline-none text-navy placeholder:text-muted"
            />
            {search ? (
              <button type="button" onClick={() => setSearch('')} className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                <X className="h-3 w-3" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={listening ? stopVoice : startVoice}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${listening ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-accent/10 text-accent'}`}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          </div>

          {listening ? <p className="mt-2 text-center text-xs text-accent animate-pulse">🎙 Listening... speak now</p> : null}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => handleFilterChange('all')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${filter === 'all' ? 'bg-accent text-white shadow-sm' : 'bg-cream text-navy'}`}
            >
              All NGOs
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('nearby')}
              disabled={locationLoading}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all ${filter === 'nearby' ? 'bg-accent text-white shadow-sm' : 'bg-cream text-navy'} disabled:opacity-60`}
            >
              {locationLoading ? <div className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
              {locationLoading ? 'Getting location...' : '📍 Nearby'}
            </button>
          </div>

          {locationError ? (
            <div className="mt-3 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3">
              <p className="text-xs font-semibold text-rose-700">📍 {locationError}</p>
              <button type="button" onClick={getUserLocation} className="mt-2 text-xs font-bold text-accent underline">Try again</button>
            </div>
          ) : null}

          {userLocation && filter === 'nearby' ? (
            <div className="mt-3 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-semibold text-emerald-700">Showing NGOs within 100 km of your location</p>
            </div>
          ) : null}
        </section>

        {!loading ? (
          <p className="text-xs text-muted px-1">
            {filtered.length} NGO{filtered.length !== 1 ? 's' : ''} found{filter === 'nearby' && userLocation ? ' nearby' : ''}
          </p>
        ) : null}

        {loading ? (
          <><div className="skeleton h-40 rounded-2xl" /><div className="skeleton h-40 rounded-2xl" /><div className="skeleton h-40 rounded-2xl" /></>
        ) : null}

        {!loading && filtered.length === 0 ? (
          <div className="rounded-[28px] bg-white p-8 shadow-card text-center">
            <div className="h-16 w-16 rounded-full bg-cream flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-7 w-7 text-muted" />
            </div>
            <p className="text-base font-semibold text-navy">No NGOs found</p>
            {filter === 'nearby' ? (
              <>
                <p className="text-sm text-muted mt-1">No NGOs found within 100 km. Try expanding your search or switch to All NGOs.</p>
                <button type="button" onClick={() => setFilter('all')} className="mt-4 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white">Show all NGOs</button>
              </>
            ) : (
              <p className="text-sm text-muted mt-1">Try a different search term.</p>
            )}
          </div>
        ) : null}

        {!loading ? (
          <div className="space-y-4">
            {filtered.map((ngo) => {
              const distance = userLocation ? calculateDistanceKm(userLocation, { lat: ngo.lat, lng: ngo.lng }) : null;
              const isExpanded = expandedNgo === ngo.ngoId;
              const embedUrl = getEmbedUrl(ngo);
              const canNavigate = Boolean(ngo?.address) || hasValidCoords(ngo);

              return (
                <div key={ngo.ngoId} className="rounded-[24px] bg-white shadow-card overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <img
                        src={ngo.logoUrl || 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=300&q=80'}
                        alt={ngo.name}
                        className="h-14 w-14 rounded-2xl object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-navy leading-tight">{ngo.name}</h3>
                          {distance !== null ? (
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold shrink-0 ${distance < 10 ? 'bg-emerald-100 text-emerald-700' : distance < 50 ? 'bg-amber-100 text-amber-700' : 'bg-accent/10 text-accent'}`}>
                              {distance.toFixed(1)} km
                            </span>
                          ) : null}
                        </div>
                        {ngo.description ? <p className="mt-0.5 text-xs text-muted line-clamp-2 leading-4">{ngo.description}</p> : null}
                        <div className="mt-2 space-y-1">
                          {ngo.address ? (
                            <p className="flex items-start gap-1.5 text-xs text-muted">
                              <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-accent" />
                              <span className="truncate">{ngo.address}</span>
                            </p>
                          ) : null}
                          {ngo.phone ? (
                            <p className="flex items-center gap-1.5 text-xs text-muted">
                              <Phone className="h-3 w-3 shrink-0 text-accent" />
                              {ngo.phone}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {distance !== null && distance < 100 ? (
                      <div className="mt-3 rounded-2xl bg-cream px-3 py-2 flex items-center gap-3">
                        <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${distance < 10 ? 'bg-emerald-500' : distance < 50 ? 'bg-amber-500' : 'bg-accent'}`}
                            style={{ width: `${Math.max(5, 100 - (distance / 100) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-navy shrink-0">
                          {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km away`}
                        </span>
                      </div>
                    ) : null}

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button type="button" onClick={() => navigate(`/ngo/${ngo.ngoId}`)} className="min-h-10 rounded-xl bg-cream text-xs font-semibold text-navy">View</button>
                      <button
                        type="button"
                        onClick={(e) => handleDirections(e, ngo)}
                        disabled={!canNavigate}
                        className="min-h-10 flex items-center justify-center gap-1 rounded-xl border border-navy text-xs font-semibold text-navy disabled:opacity-40"
                      >
                        <Navigation className="h-3 w-3" />
                        Directions
                      </button>
                      <button type="button" onClick={() => navigate(`/ngo/${ngo.ngoId}/donate`)} className="min-h-10 rounded-xl bg-accent text-xs font-semibold text-white">Donate</button>
                    </div>

                    {embedUrl ? (
                      <button
                        type="button"
                        onClick={() => setExpandedNgo(isExpanded ? null : ngo.ngoId)}
                        className="mt-3 w-full rounded-xl bg-slate-50 border border-slate-100 py-2 text-xs font-semibold text-muted flex items-center justify-center gap-1.5"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        {isExpanded ? 'Hide map' : 'Show on map'}
                      </button>
                    ) : null}
                  </div>

                  {isExpanded && embedUrl ? (
                    <div className="border-t border-slate-100">
                      <div className="relative" style={{ height: '220px' }}>
                        <iframe
                          title={`Map for ${ngo.name}`}
                          src={embedUrl}
                          width="100%"
                          height="220"
                          style={{ border: 0 }}
                          allowFullScreen={false}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          className="w-full"
                        />
                        <button
                          type="button"
                          onClick={(e) => handleDirections(e, ngo)}
                          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 shadow-lg text-xs font-bold text-navy border border-slate-100"
                        >
                          <Navigation className="h-3.5 w-3.5 text-accent" />
                          Open in Google Maps
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

      </div>
    </div>
  );
}