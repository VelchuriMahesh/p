import { useEffect, useMemo, useState } from 'react';
import { Camera, CheckCircle2, MapPinned } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { fetchNgoById, fetchNgoNeeds } from '../../services/ngoService';
import { compressImageFile } from '../../utils/compressImage';
import { submitDelivery } from '../../services/deliveryService';
import { buildMapsDirectionsUrl, getCurrentPosition } from '../../utils/location';
import { useAuth } from '../../hooks/useAuth';

const parseItems = (need) => {
  if (!need) {
    return [];
  }

  return `${need.title},${need.description}`
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
};

export default function DeliverPage() {
  const { ngoId } = useParams();
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [ngo, setNgo] = useState(null);
  const [needs, setNeeds] = useState([]);
  const [selectedNeedId, setSelectedNeedId] = useState(routerLocation.state?.need?.needId || '');
  const [selectedItems, setSelectedItems] = useState([]);
  const [customItems, setCustomItems] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadPage = async () => {
      const [nextNgo, nextNeeds] = await Promise.all([fetchNgoById(ngoId), fetchNgoNeeds(ngoId)]);
      setNgo(nextNgo);
      setNeeds(nextNeeds.filter((need) => need.type === 'delivery'));
    };

    loadPage();
  }, [ngoId]);

  const selectedNeed = needs.find((need) => need.needId === selectedNeedId) || routerLocation.state?.need || null;
  const itemOptions = useMemo(() => parseItems(selectedNeed), [selectedNeed]);

  const handleDirections = async () => {
    if (!ngo) {
      return;
    }

    const origin = await getCurrentPosition().catch(() => null);
    const url = buildMapsDirectionsUrl({
      origin,
      destination: { lat: ngo.lat, lng: ngo.lng },
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const toggleItem = (item) => {
    setSelectedItems((current) => (current.includes(item) ? current.filter((value) => value !== item) : [...current, item]));
  };

  const handleProofChange = (event) => {
    const file = event.target.files?.[0] || null;
    setProofImage(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedNeed) {
      alert('Please select a need first.');
      return;
    }

    setLoading(true);

    try {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      const coords = await getCurrentPosition().catch(() => null);
      const compressedFile = await compressImageFile(proofImage);
      const payload = new FormData();
      payload.append('ngoId', ngoId);
      payload.append('needId', selectedNeed.needId);
      payload.append('donorName', profile?.name || 'Donor');
      payload.append('itemsDelivered', [...selectedItems, customItems].filter(Boolean).join(', '));
      payload.append('proofImage', compressedFile);

      if (coords) {
        payload.append('lat', coords.lat);
        payload.append('lng', coords.lng);
      }

      await submitDelivery(payload);
      setSuccess(true);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-[28px] bg-white p-6 text-center shadow-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-navy">Delivery recorded</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Your proof has been submitted and is awaiting verification from the NGO team.</p>
          <button type="button" onClick={() => navigate('/dashboard')} className="mt-6 min-h-12 w-full rounded-xl bg-accent text-sm font-semibold text-white">
            View Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-md space-y-5 px-4 py-5">
        <section className="rounded-[28px] bg-white p-5 shadow-card">
          <p className="text-sm font-semibold text-muted">{ngo?.name || 'Partner NGO'}</p>
          <h1 className="mt-1 text-2xl font-bold text-navy">Deliver items</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Choose what you are taking, navigate to the home, and submit proof after delivery.</p>

          <div className="mt-5 space-y-3">
            <label className="text-sm font-semibold text-navy">Select a need</label>
            <select
              value={selectedNeedId}
              onChange={(event) => setSelectedNeedId(event.target.value)}
              className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm"
            >
              <option value="">Choose a delivery need</option>
              {needs.map((need) => (
                <option key={need.needId} value={need.needId}>
                  {need.title}
                </option>
              ))}
            </select>
          </div>

          {selectedNeed ? (
            <div className="mt-5 rounded-2xl bg-cream p-4">
              <p className="text-sm font-semibold text-navy">{selectedNeed.title}</p>
              <p className="mt-1 text-sm text-muted">{selectedNeed.description}</p>
            </div>
          ) : null}

          <button type="button" onClick={handleDirections} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-navy text-sm font-semibold text-navy">
            <MapPinned className="h-4 w-4" />
            Navigate to NGO
          </button>
        </section>

        <form onSubmit={handleSubmit} className="rounded-[28px] bg-white p-5 shadow-card">
          <h2 className="text-lg font-semibold text-navy">I have delivered</h2>
          <div className="mt-4 space-y-4">
            {itemOptions.length ? (
              <div className="grid grid-cols-1 gap-2">
                {itemOptions.map((item) => (
                  <label key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-navy">
                    <input type="checkbox" checked={selectedItems.includes(item)} onChange={() => toggleItem(item)} className="h-4 w-4" />
                    {item}
                  </label>
                ))}
              </div>
            ) : null}

            <textarea
              value={customItems}
              onChange={(event) => setCustomItems(event.target.value)}
              placeholder="Add anything else you delivered"
              className="min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />

            <label className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 text-sm font-semibold text-navy">
              <Camera className="h-4 w-4" />
              Upload proof photo
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleProofChange} required className="hidden" />
            </label>

            {preview ? <img src={preview} alt="Proof preview" className="h-56 w-full rounded-2xl object-cover" /> : null}
          </div>

          <button type="submit" disabled={loading} className="mt-5 min-h-12 w-full rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-70">
            {loading ? 'Submitting proof...' : 'Submit Delivery Proof'}
          </button>
        </form>
      </div>
    </div>
  );
}

