import { useEffect, useRef, useState } from 'react';
import { Search, Mic, MicOff, MapPin, Phone, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchActiveNGOs } from '../../services/ngoService';
import { getCurrentPosition, calculateDistanceKm } from '../../utils/location';

export default function MapPage() {
  const navigate = useNavigate();
  const [ngos, setNgos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [listening, setListening] = useState(false);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [ngoList, location] = await Promise.all([
        fetchActiveNGOs(),
        getCurrentPosition().catch(() => null),
      ]);
      setUserLocation(location);
      const sorted = location
        ? [...ngoList].sort((a, b) =>
            calculateDistanceKm(location, { lat: a.lat, lng: a.lng }) -
            calculateDistanceKm(location, { lat: b.lat, lng: b.lng })
          )
        : ngoList;
      setNgos(sorted);
      setFiltered(sorted);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    let result = [...ngos];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.name?.toLowerCase().includes(q) ||
          n.address?.toLowerCase().includes(q) ||
          n.description?.toLowerCase().includes(q)
      );
    }
    if (filter === 'nearby' && userLocation) {
      result = result.filter(
        (n) => calculateDistanceKm(userLocation, { lat: n.lat, lng: n.lng }) <= 50
      );
    }
    setFiltered(result);
  }, [search, filter, ngos, userLocation]);

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice search is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const handleDirections = (ngo) => {
    if (userLocation) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${ngo.lat},${ngo.lng}&travelmode=driving`,
        '_blank'
      );
    } else {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${ngo.lat},${ngo.lng}&travelmode=driving`,
        '_blank'
      );
    }
  };

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-md space-y-4 px-4 py-5">
        <section className="rounded-[28px] bg-white p-5 shadow-card">
          <h1 className="text-2xl font-bold text-navy">Find an old age home</h1>
          <p className="mt-1 text-sm text-muted">Search by name, city, or area. Use voice to search hands-free.</p>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-cream px-4 py-2">
            <Search className="h-4 w-4 text-muted shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, city or area..."
              className="flex-1 bg-transparent text-sm outline-none text-navy placeholder:text-muted"
            />
            <button
              type="button"
              onClick={listening ? stopVoice : startVoice}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                listening ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-accent/10 text-accent'
              }`}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          </div>

          {listening ? (
            <p className="mt-2 text-center text-xs text-accent animate-pulse">🎙 Listening... speak now</p>
          ) : null}

          <div className="mt-3 flex gap-2">
            {['all', 'nearby'].map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                  filter === item ? 'bg-accent text-white' : 'bg-cream text-navy'
                }`}
              >
                {item === 'nearby' ? '📍 Nearby' : 'All NGOs'}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <>
            <div className="skeleton h-28 rounded-2xl" />
            <div className="skeleton h-28 rounded-2xl" />
            <div className="skeleton h-28 rounded-2xl" />
          </>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center">
            <p className="text-sm font-semibold text-navy">No NGOs found</p>
            <p className="mt-1 text-xs text-muted">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted px-1">{filtered.length} NGO{filtered.length !== 1 ? 's' : ''} found</p>
            {filtered.map((ngo) => {
              const distance = userLocation && ngo.lat && ngo.lng && !isNaN(ngo.lat)
                ? calculateDistanceKm(userLocation, { lat: ngo.lat, lng: ngo.lng })
                : null;
              return (
                <div key={ngo.ngoId} className="rounded-2xl bg-white p-4 shadow-card">
                  <div className="flex items-start gap-3">
                    <img
                      src={ngo.logoUrl || 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=300&q=80'}
                      alt={ngo.name}
                      className="h-14 w-14 rounded-2xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-navy">{ngo.name}</h3>
                        {distance !== null ? (
                          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent shrink-0">
                            {distance.toFixed(1)} km
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-muted line-clamp-2">{ngo.description}</p>
                      <div className="mt-2 space-y-1">
                        <p className="flex items-center gap-1.5 text-xs text-muted">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{ngo.address}</span>
                        </p>
                        <p className="flex items-center gap-1.5 text-xs text-muted">
                          <Phone className="h-3 w-3 shrink-0" />
                          {ngo.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/ngo/${ngo.ngoId}`)}
                      className="min-h-10 rounded-xl bg-cream text-xs font-semibold text-navy"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirections(ngo)}
                      className="min-h-10 flex items-center justify-center gap-1 rounded-xl border border-navy text-xs font-semibold text-navy"
                    >
                      <Navigation className="h-3 w-3" />
                      Directions
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/ngo/${ngo.ngoId}/donate`)}
                      className="min-h-10 rounded-xl bg-accent text-xs font-semibold text-white"
                    >
                      Donate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}