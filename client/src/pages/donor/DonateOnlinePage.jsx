import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, X, Upload, ExternalLink } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchNgoById } from '../../services/ngoService';
import { submitDonation } from '../../services/donationService';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/date';
import { uploadImageToImgBB } from '../../utils/uploadImage';

const SUGGESTED_AMOUNTS = [10, 100, 500, 1000];

const UPI_APPS = [
  {
    id: 'gpay',
    name: 'Google Pay',
    emoji: '🟢',
    color: 'from-green-500 to-emerald-600',
    scheme: 'tez://upi/pay',
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    emoji: '🟣',
    color: 'from-purple-500 to-indigo-600',
    scheme: 'phonepe://pay',
  },
  {
    id: 'paytm',
    name: 'Paytm',
    emoji: '🔵',
    color: 'from-blue-500 to-cyan-600',
    scheme: 'paytmmp://pay',
  },
  {
    id: 'bhim',
    name: 'BHIM UPI',
    emoji: '🟠',
    color: 'from-orange-500 to-amber-600',
    scheme: 'upi://pay',
  },
];

const buildUpiLink = (app, upiId, ngoName, amount) => {
  const params = new URLSearchParams({
    pa: upiId,
    pn: ngoName,
    am: String(amount),
    cu: 'INR',
    tn: `Donation to ${ngoName}`,
  });
  return `${app.scheme}?${params.toString()}`;
};

export default function DonateOnlinePage() {
  const { ngoId } = useParams();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [ngo, setNgo] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [step, setStep] = useState('select'); // 'select' | 'confirm'
  const [copied, setCopied] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paidApp, setPaidApp] = useState(null);

  useEffect(() => {
    fetchNgoById(ngoId).then(setNgo);
  }, [ngoId]);

  const finalAmount = useMemo(() => {
    if (showCustom) return Number(customAmount) > 0 ? Number(customAmount) : null;
    return selectedAmount;
  }, [showCustom, customAmount, selectedAmount]);

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setShowCustom(false);
    setCustomAmount('');
  };

  const handleCopyUpi = async () => {
    if (!ngo?.upiId) return;
    await navigator.clipboard.writeText(ngo.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenApp = (app) => {
    if (!finalAmount) {
      alert('Please select an amount first.');
      return;
    }
    if (!ngo?.upiId) {
      alert('This NGO has no UPI ID set yet.');
      return;
    }
    const link = buildUpiLink(app, ngo.upiId, ngo.name, finalAmount);
    window.location.href = link;
    setTimeout(() => {
      setPaidApp(app.name);
      setStep('confirm');
    }, 1500);
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0] || null;
    setScreenshot(file);
    setScreenshotPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let screenshotUrl = null;
      if (screenshot) {
        screenshotUrl = await uploadImageToImgBB(screenshot);
      }
      await submitDonation({
        ngoId,
        donorName: profile?.name || user?.displayName || 'Donor',
        amount: finalAmount,
        screenshotUrl,
      });
      setSuccess(true);
    } catch (error) {
      alert(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!ngo) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <div className="skeleton h-64 rounded-[28px]" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-[28px] bg-white p-8 text-center shadow-card">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-extrabold text-navy">Thank you! 🎉</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Your donation of <span className="font-bold text-accent">{formatCurrency(finalAmount)}</span> to{' '}
            <span className="font-semibold text-navy">{ngo.name}</span> has been recorded.
          </p>
          <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-left">
            <p className="text-xs font-semibold text-amber-800">⏳ Pending verification</p>
            <p className="text-xs text-amber-700 mt-0.5">
              The NGO will verify your payment and issue a certificate once approved.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-6 min-h-12 w-full rounded-2xl bg-accent text-sm font-bold text-white"
          >
            View My Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-md space-y-4 px-4 py-5">

        {/* NGO Header */}
        <section className="rounded-[28px] bg-navy p-5 text-white shadow-card">
          <div className="flex items-center gap-3">
            {ngo.logoUrl ? (
              <img src={ngo.logoUrl} alt={ngo.name} className="h-14 w-14 rounded-2xl object-cover border-2 border-white/20" />
            ) : (
              <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">🏠</div>
            )}
            <div>
              <p className="text-xs text-white/60 uppercase tracking-wide font-semibold">Donating to</p>
              <p className="text-lg font-extrabold text-white">{ngo.name}</p>
            </div>
          </div>
        </section>

        {/* ===== UPI ID DISPLAY - BIG AND CLEAR ===== */}
        <section className="rounded-[28px] bg-white p-5 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wide text-muted mb-3">NGO UPI ID (Pay directly to this)</p>

          {ngo.upiId ? (
            <div className="rounded-2xl bg-cream border-2 border-accent/30 p-4">
              {/* Big visible UPI ID */}
              <p className="text-2xl font-extrabold text-navy text-center tracking-wide font-mono break-all">
                {ngo.upiId}
              </p>
              <p className="text-xs text-center text-muted mt-1">
                This is the NGO's official UPI ID set by admin
              </p>

              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopyUpi}
                className={`mt-3 w-full min-h-11 flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-navy text-white'
                }`}
              >
                <Copy className="h-4 w-4" />
                {copied ? '✓ Copied!' : 'Copy UPI ID'}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-center">
              <p className="text-sm font-semibold text-rose-700">⚠️ No UPI ID set by admin yet</p>
              <p className="text-xs text-rose-500 mt-1">Contact the NGO admin to add UPI ID</p>
            </div>
          )}

          {/* QR Code */}
          {ngo.qrCodeUrl ? (
            <div className="mt-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Or scan QR code</p>
              <img
                src={ngo.qrCodeUrl}
                alt="UPI QR"
                className="mx-auto h-52 w-52 rounded-2xl border border-slate-200 object-contain bg-white p-2 shadow-card"
              />
            </div>
          ) : null}
        </section>

        {/* ===== SELECT AMOUNT + PAY ===== */}
        {step === 'select' && ngo.upiId ? (
          <section className="rounded-[28px] bg-white p-5 shadow-card space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-navy">Choose Amount & Pay</h2>
              <p className="text-sm text-muted mt-1">Select amount, then tap a UPI app to pay</p>
            </div>

            {/* Amount Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {SUGGESTED_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleAmountSelect(amount)}
                  className={`rounded-2xl py-4 text-center font-bold transition-all ${
                    selectedAmount === amount && !showCustom
                      ? 'bg-accent text-white shadow-lg shadow-accent/30 scale-105'
                      : 'bg-cream text-navy border-2 border-slate-200'
                  }`}
                >
                  <p className={`text-xl ${selectedAmount === amount && !showCustom ? 'text-white' : 'text-accent'}`}>
                    ₹{amount}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${selectedAmount === amount && !showCustom ? 'text-white/70' : 'text-muted'}`}>
                    {amount === 10 ? '~1 meal' : amount === 100 ? '~2 days' : amount === 500 ? '~10 days' : '~20 days'}
                  </p>
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <button
              type="button"
              onClick={() => { setShowCustom(!showCustom); setSelectedAmount(null); }}
              className={`w-full rounded-2xl border-2 border-dashed py-3 text-sm font-semibold transition-all ${
                showCustom ? 'border-accent bg-accent/5 text-accent' : 'border-slate-200 text-muted'
              }`}
            >
              + Enter custom amount
            </button>

            {showCustom ? (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-navy">₹</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0"
                  min="1"
                  autoFocus
                  className="min-h-14 w-full rounded-2xl border-2 border-accent pl-9 pr-4 text-2xl font-bold text-navy outline-none"
                />
              </div>
            ) : null}

            {/* Impact Preview */}
            {finalAmount ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex items-center gap-3">
                <span className="text-2xl">🍱</span>
                <p className="text-sm font-bold text-emerald-800">
                  {formatCurrency(finalAmount)} = ~{Math.max(1, Math.round(finalAmount / 50))} meal{finalAmount >= 100 ? 's' : ''} for elders
                </p>
              </div>
            ) : null}

            {/* ===== UPI APP BUTTONS - TAP TO OPEN ===== */}
            <div className="space-y-3 pt-1">
              <p className="text-sm font-bold text-center text-navy">
                {finalAmount
                  ? `Tap to pay ${formatCurrency(finalAmount)} via`
                  : '👆 Select amount above, then tap to pay via'}
              </p>

              <div className="grid grid-cols-2 gap-3">
                {UPI_APPS.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => handleOpenApp(app)}
                    disabled={!finalAmount}
                    className={`flex items-center justify-between gap-2 rounded-2xl bg-gradient-to-br ${app.color} p-4 text-white font-bold text-sm shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{app.emoji}</span>
                      <span>{app.name}</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 opacity-70 shrink-0" />
                  </button>
                ))}
              </div>

              {finalAmount && ngo.upiId ? (
                <p className="text-[11px] text-center text-muted leading-4">
                  Will auto-open app with ₹{finalAmount} pre-filled to{' '}
                  <span className="font-mono font-bold text-navy">{ngo.upiId}</span>
                </p>
              ) : null}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-muted font-semibold">Already paid?</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Already paid */}
            <button
              type="button"
              onClick={() => {
                if (!finalAmount) { alert('Please select an amount first.'); return; }
                setStep('confirm');
              }}
              disabled={!finalAmount}
              className="w-full min-h-11 rounded-2xl border-2 border-emerald-500 text-emerald-700 text-sm font-bold disabled:opacity-40"
            >
              ✓ I already paid — confirm now
            </button>
          </section>
        ) : null}

        {/* ===== CONFIRM STEP ===== */}
        {step === 'confirm' ? (
          <section className="rounded-[28px] bg-white p-5 shadow-card space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-navy">Confirm Donation</h2>
              <p className="text-sm text-muted mt-1">Upload screenshot to help NGO verify faster (optional)</p>
            </div>

            {/* Summary */}
            <div className="rounded-2xl bg-cream px-4 py-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">NGO</span>
                <span className="font-semibold text-navy">{ngo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">UPI ID</span>
                <span className="font-mono font-bold text-navy text-xs">{ngo.upiId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Amount</span>
                <span className="font-bold text-accent text-base">{formatCurrency(finalAmount)}</span>
              </div>
              {paidApp ? (
                <div className="flex justify-between">
                  <span className="text-muted">Paid via</span>
                  <span className="font-semibold text-navy">{paidApp}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-muted">Status</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  Pending verification
                </span>
              </div>
            </div>

            {/* Screenshot Upload */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">
                Payment screenshot (recommended)
              </p>
              {screenshotPreview ? (
                <div className="relative rounded-2xl overflow-hidden">
                  <img src={screenshotPreview} alt="Screenshot" className="w-full h-48 object-cover" />
                  <button
                    type="button"
                    onClick={() => { setScreenshot(null); setScreenshotPreview(null); }}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex min-h-24 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 text-sm text-muted hover:border-accent hover:text-accent transition-colors">
                  <Upload className="h-6 w-6" />
                  <span>Upload payment screenshot</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleScreenshotChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="min-h-12 w-full rounded-2xl bg-emerald-600 text-sm font-bold text-white disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              {loading ? 'Saving...' : 'Submit & Record Donation'}
            </button>

            <button
              type="button"
              onClick={() => setStep('select')}
              className="w-full rounded-xl py-2 text-sm text-muted"
            >
              ← Back
            </button>
          </section>
        ) : null}

      </div>
    </div>
  );
}