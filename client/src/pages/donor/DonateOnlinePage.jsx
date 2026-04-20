import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, Sparkles, QrCode } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchNgoById } from '../../services/ngoService';
import { submitDonation } from '../../services/donationService';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/date';
import { uploadImageToImgBB } from '../../utils/uploadImage';

const suggestedAmounts = [10, 100, 300, 500];

export default function DonateOnlinePage() {
  const { ngoId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile, user } = useAuth();
  const [ngo, setNgo] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [form, setForm] = useState({
    donorName: '',
    amount: searchParams.get('amount') || '',
    utr: '',
    screenshot: null,
  });

  useEffect(() => {
    fetchNgoById(ngoId).then(setNgo);
  }, [ngoId]);

  useEffect(() => {
    if (profile?.name || user?.displayName) {
      setForm((current) => ({
        ...current,
        donorName: profile?.name || user?.displayName || '',
      }));
    }
  }, [profile, user]);

  const upiText = useMemo(() => ngo?.upiId || '', [ngo]);
  const qrUrl = useMemo(() => ngo?.qrCodeUrl || '', [ngo]);

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    if (name === 'screenshot') {
      const file = files?.[0] || null;
      setForm((current) => ({ ...current, screenshot: file }));
      setPreview(file ? URL.createObjectURL(file) : null);
      return;
    }
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(upiText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.screenshot) {
      alert('Please upload a screenshot of the payment.');
      return;
    }
    setLoading(true);
    try {
      if (navigator.vibrate) navigator.vibrate(50);
      const screenshotUrl = await uploadImageToImgBB(form.screenshot);
      await submitDonation({
        ngoId,
        donorName: form.donorName,
        amount: form.amount,
        utr: form.utr,
        screenshotUrl,
      });
      setSuccess(true);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!ngo) {
    return (
      <div className="mx-auto max-w-md px-4 py-8 text-center text-sm text-muted">
        Loading...
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-[28px] bg-white p-6 text-center shadow-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-navy">Donation submitted!</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Your payment proof is pending NGO verification. Once verified, your certificate will appear in your dashboard.
          </p>
          <button type="button" onClick={() => navigate('/dashboard')} className="mt-6 min-h-12 w-full rounded-xl bg-accent text-sm font-bold text-white">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-md space-y-5 px-4 py-5">
        <section className="rounded-[28px] bg-white p-5 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            {ngo.logoUrl ? (
              <img src={ngo.logoUrl} alt={ngo.name} className="h-12 w-12 rounded-2xl object-cover" />
            ) : null}
            <div>
              <p className="text-xs text-muted">Donating to</p>
              <p className="text-base font-bold text-navy">{ngo.name}</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-navy">Donate online</h1>

          {/* QR Code section */}
          <div className="mt-5 overflow-hidden rounded-[24px] bg-cream p-4 flex items-center justify-center min-h-48">
            {qrUrl ? (
              <div className="text-center">
                <img
                  src={qrUrl}
                  alt="UPI QR Code"
                  className="mx-auto h-56 w-56 rounded-2xl bg-white object-contain p-2 shadow-card"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <p className="mt-3 text-xs font-semibold text-muted">Scan with any UPI app — GPay, PhonePe, Paytm</p>
              </div>
            ) : upiText ? (
              <div className="text-center space-y-3">
                <QrCode className="h-16 w-16 text-muted mx-auto" />
                <p className="text-sm font-semibold text-navy">Use UPI ID to pay</p>
                <p className="font-mono text-base font-bold text-accent">{upiText}</p>
                <p className="text-xs text-muted">Copy the UPI ID and pay in any UPI app</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-center px-4">
                <QrCode className="h-12 w-12 text-muted" />
                <p className="text-sm text-muted">Payment details not configured yet.</p>
                <p className="text-xs text-muted">Contact the NGO or platform admin.</p>
              </div>
            )}
          </div>

          {upiText ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">UPI ID</p>
                <p className="text-sm font-bold text-navy font-mono">{upiText}</p>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className={`flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${copied ? 'bg-emerald-600 text-white' : 'bg-navy text-white'}`}
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ) : null}

          {/* Amount selector */}
          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-wide text-muted mb-3">Select amount</p>
            <div className="flex flex-wrap gap-2">
              {suggestedAmounts.map((amount) => (
                <button
                  type="button"
                  key={amount}
                  onClick={() => { setForm((current) => ({ ...current, amount: amount.toString() })); setShowCustom(false); }}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    Number(form.amount) === amount && !showCustom ? 'bg-accent text-white shadow-card' : 'bg-cream text-navy'
                  }`}
                >
                  {formatCurrency(amount)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setShowCustom(true); setForm((current) => ({ ...current, amount: '' })); }}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${showCustom ? 'bg-accent text-white' : 'bg-cream text-navy'}`}
              >
                Custom
              </button>
            </div>
            {showCustom ? (
              <input
                type="number"
                placeholder="Enter custom amount (₹)"
                value={form.amount}
                onChange={(e) => setForm((current) => ({ ...current, amount: e.target.value }))}
                className="mt-3 min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent"
                min="1"
                autoFocus
              />
            ) : null}
          </div>

          <ol className="mt-5 space-y-2 rounded-2xl bg-cream p-4 text-sm leading-6 text-muted">
            <li className="flex gap-2"><span className="font-bold text-accent">1.</span> Scan the QR code or copy the UPI ID.</li>
            <li className="flex gap-2"><span className="font-bold text-accent">2.</span> Complete the payment in your UPI app (GPay, PhonePe, Paytm etc).</li>
            <li className="flex gap-2"><span className="font-bold text-accent">3.</span> Come back here and submit your UTR with a screenshot.</li>
          </ol>

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-5 min-h-12 w-full rounded-xl bg-accent text-sm font-bold text-white flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            I Have Donated — Submit Proof
          </button>
        </section>

        {showForm ? (
          <form onSubmit={handleSubmit} className="rounded-[28px] bg-white p-5 shadow-card">
            <h2 className="text-lg font-bold text-navy">Submit proof of payment</h2>
            <p className="mt-1 text-sm text-muted">Enter your UTR and upload a screenshot to complete.</p>
            <div className="mt-4 space-y-4">
              <input
                type="text"
                name="donorName"
                value={form.donorName}
                onChange={handleChange}
                placeholder="Your name"
                required
                className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent"
              />
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="Amount paid (₹)"
                required
                min="1"
                className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent"
              />
              <input
                type="text"
                name="utr"
                value={form.utr}
                onChange={handleChange}
                placeholder="UTR / Transaction ID (min 12 characters)"
                required
                minLength={12}
                className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-accent"
              />
              <label className="block">
                <span className="text-sm font-semibold text-navy">Payment screenshot</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  name="screenshot"
                  onChange={handleChange}
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />
              </label>
              {preview ? <img src={preview} alt="Screenshot preview" className="h-52 w-full rounded-2xl object-cover" /> : null}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-5 min-h-12 w-full rounded-xl bg-navy text-sm font-bold text-white disabled:opacity-70"
            >
              {loading ? 'Uploading & Submitting...' : 'Submit Donation Proof'}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}