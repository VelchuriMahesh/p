import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, QrCode, Smartphone, ArrowRight, Upload, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchNgoById } from '../../services/ngoService';
import { submitDonation } from '../../services/donationService';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/date';
import { uploadImageToImgBB } from '../../utils/uploadImage';

const SUGGESTED_AMOUNTS = [10, 100, 500];

const generateUpiLink = (upiId, ngoName, amount) => {
  if (!upiId || !amount) return null;
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(ngoName)}&am=${amount}&cu=INR`;
};

export default function DonateOnlinePage() {
  const { ngoId } = useParams();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [ngo, setNgo] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [step, setStep] = useState('select'); // 'select' | 'pay' | 'confirm'
  const [copied, setCopied] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchNgoById(ngoId).then(setNgo);
  }, [ngoId]);

  const finalAmount = useMemo(() => {
    if (showCustom) return Number(customAmount) > 0 ? Number(customAmount) : null;
    return selectedAmount;
  }, [showCustom, customAmount, selectedAmount]);

  const upiLink = useMemo(() => {
    if (!ngo?.upiId || !finalAmount) return null;
    return generateUpiLink(ngo.upiId, ngo.name, finalAmount);
  }, [ngo, finalAmount]);

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setShowCustom(false);
    setCustomAmount('');
  };

  const handleCustomSelect = () => {
    setSelectedAmount(null);
    setShowCustom(true);
  };

  const handleCopyUpi = async () => {
    if (!ngo?.upiId) return;
    await navigator.clipboard.writeText(ngo.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProceedToPay = () => {
    if (!finalAmount) {
      alert('Please select or enter a donation amount.');
      return;
    }
    setStep('pay');
  };

  const handleOpenUpiApp = () => {
    if (upiLink) {
      window.location.href = upiLink;
    }
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0] || null;
    setScreenshot(file);
    setScreenshotPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleIHavePaid = async () => {
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
      <div className="mx-auto max-w-md px-4 py-8 text-center text-sm text-muted">
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
            Your donation of <span className="font-bold text-accent">{formatCurrency(finalAmount)}</span> to <span className="font-semibold text-navy">{ngo.name}</span> has been recorded.
          </p>
          <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-left">
            <p className="text-xs font-semibold text-amber-800">⏳ Pending verification</p>
            <p className="text-xs text-amber-700 mt-0.5">The NGO will manually verify your payment and issue your certificate once approved.</p>
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
          <div className="flex items-center gap-3 mb-4">
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
          <div className="rounded-2xl bg-white/10 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-white/50 font-semibold">Zero charges</p>
              <p className="text-xs font-semibold text-white/80">100% goes to the NGO via UPI</p>
            </div>
            <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-bold text-emerald-300">Free</span>
          </div>
        </section>

        {/* Step 1: Amount Selection */}
        {step === 'select' ? (
          <section className="rounded-[28px] bg-white p-5 shadow-card space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-navy">Choose amount</h2>
              <p className="text-sm text-muted mt-1">Every rupee directly feeds an elder in need.</p>
            </div>

            {/* Amount buttons */}
            <div className="grid grid-cols-3 gap-3">
              {SUGGESTED_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleAmountSelect(amount)}
                  className={`relative rounded-2xl py-4 text-center font-bold transition-all ${
                    selectedAmount === amount && !showCustom
                      ? 'bg-accent text-white shadow-lg shadow-accent/30 scale-105'
                      : 'bg-cream text-navy border border-slate-200'
                  }`}
                >
                  <p className={`text-lg ${selectedAmount === amount && !showCustom ? 'text-white' : 'text-accent'}`}>
                    ₹{amount}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${selectedAmount === amount && !showCustom ? 'text-white/70' : 'text-muted'}`}>
                    {amount === 10 ? '~1 meal' : amount === 100 ? '~2 days' : '~10 days'}
                  </p>
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <button
              type="button"
              onClick={handleCustomSelect}
              className={`w-full rounded-2xl border-2 border-dashed py-3 text-sm font-semibold transition-all ${
                showCustom ? 'border-accent bg-accent/5 text-accent' : 'border-slate-200 text-muted'
              }`}
            >
              {showCustom ? 'Enter custom amount below' : '+ Enter custom amount'}
            </button>

            {showCustom ? (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-navy">₹</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0"
                  min="1"
                  autoFocus
                  className="min-h-14 w-full rounded-2xl border-2 border-accent pl-9 pr-4 text-xl font-bold text-navy outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            ) : null}

            {/* Impact preview */}
            {finalAmount ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex items-center gap-3">
                <span className="text-2xl">🍱</span>
                <div>
                  <p className="text-sm font-bold text-emerald-800">
                    {formatCurrency(finalAmount)} = ~{Math.max(1, Math.round(finalAmount / 50))} meal{finalAmount >= 100 ? 's' : ''}
                  </p>
                  <p className="text-xs text-emerald-600">for elders at {ngo.name}</p>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleProceedToPay}
              disabled={!finalAmount}
              className="min-h-13 w-full rounded-2xl bg-accent text-sm font-bold text-white disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-accent/30"
            >
              Proceed to Pay {finalAmount ? formatCurrency(finalAmount) : ''}
              <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        ) : null}

        {/* Step 2: Pay via UPI */}
        {step === 'pay' ? (
          <section className="rounded-[28px] bg-white p-5 shadow-card space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-navy">Pay via UPI</h2>
                <p className="text-sm text-muted mt-0.5">Scan QR or use UPI ID</p>
              </div>
              <div className="rounded-2xl bg-accent/10 px-4 py-2 text-center">
                <p className="text-xl font-extrabold text-accent">{formatCurrency(finalAmount)}</p>
              </div>
            </div>

            {/* QR Code */}
            {ngo.qrCodeUrl ? (
              <div className="rounded-[20px] bg-cream p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-muted mb-3">Scan with any UPI app</p>
                <img
                  src={ngo.qrCodeUrl}
                  alt="UPI QR Code"
                  className="mx-auto h-52 w-52 rounded-2xl bg-white object-contain p-2 shadow-card"
                />
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted">
                  <span className="h-4 w-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px]">G</span>
                  <span className="h-4 w-4 rounded-full bg-indigo-100 flex items-center justify-center text-[8px] text-indigo-600">P</span>
                  <span className="h-4 w-4 rounded-full bg-blue-100 flex items-center justify-center text-[8px] text-blue-600">P</span>
                  GPay · PhonePe · Paytm
                </div>
              </div>
            ) : (
              <div className="rounded-[20px] bg-cream p-5 text-center">
                <QrCode className="h-16 w-16 text-muted mx-auto mb-2" />
                <p className="text-sm text-muted">No QR configured. Use the UPI ID below.</p>
              </div>
            )}

            {/* UPI ID copy */}
            {ngo.upiId ? (
              <div className="rounded-2xl border border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted font-semibold">UPI ID</p>
                  <p className="text-sm font-bold text-navy font-mono">{ngo.upiId}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                    copied ? 'bg-emerald-500 text-white' : 'bg-navy text-white'
                  }`}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ) : null}

            {/* Pay with UPI app button */}
            {upiLink ? (
              <button
                type="button"
                onClick={handleOpenUpiApp}
                className="w-full rounded-2xl bg-gradient-to-r from-navy to-slate-700 py-4 text-sm font-bold text-white flex items-center justify-center gap-3 shadow-lg"
              >
                <Smartphone className="h-5 w-5" />
                Open UPI App to Pay
              </button>
            ) : null}

            {/* Steps */}
            <ol className="space-y-2 rounded-2xl bg-cream px-4 py-4 text-sm text-muted">
              <li className="flex gap-2.5 items-start">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white text-[10px] font-bold shrink-0 mt-0.5">1</span>
                Scan the QR or copy the UPI ID into any UPI app.
              </li>
              <li className="flex gap-2.5 items-start">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white text-[10px] font-bold shrink-0 mt-0.5">2</span>
                Complete payment of <strong className="text-navy">{formatCurrency(finalAmount)}</strong>.
              </li>
              <li className="flex gap-2.5 items-start">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white text-[10px] font-bold shrink-0 mt-0.5">3</span>
                Come back here and click <strong className="text-navy">"I Have Paid"</strong>.
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setStep('confirm')}
              className="w-full rounded-2xl bg-accent py-4 text-sm font-bold text-white shadow-lg shadow-accent/30 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-5 w-5" />
              I Have Paid — Confirm
            </button>

            <button
              type="button"
              onClick={() => setStep('select')}
              className="w-full rounded-xl py-2 text-sm text-muted"
            >
              ← Change amount
            </button>
          </section>
        ) : null}

        {/* Step 3: Confirmation */}
        {step === 'confirm' ? (
          <section className="rounded-[28px] bg-white p-5 shadow-card space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-navy">Confirm donation</h2>
              <p className="text-sm text-muted mt-1">Add a screenshot to help the NGO verify faster (optional but recommended).</p>
            </div>

            <div className="rounded-2xl bg-cream px-4 py-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">NGO</span>
                <span className="font-semibold text-navy">{ngo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Amount</span>
                <span className="font-bold text-accent">{formatCurrency(finalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">UPI ID</span>
                <span className="font-mono text-xs text-navy">{ngo.upiId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Status</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Pending verification</span>
              </div>
            </div>

            {/* Screenshot upload */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Payment screenshot (recommended)</p>
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
                  <span className="text-xs">JPG, PNG, WebP up to 5MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleScreenshotChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3">
              <p className="text-xs font-semibold text-blue-800">🔒 Secure & free</p>
              <p className="text-xs text-blue-600 mt-0.5">No payment gateway. 100% of your donation goes to the NGO. The NGO will verify your payment and issue a certificate.</p>
            </div>

            <button
              type="button"
              onClick={handleIHavePaid}
              disabled={loading}
              className="min-h-13 w-full rounded-2xl bg-emerald-600 text-sm font-bold text-white disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Submit & Record Donation
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep('pay')}
              className="w-full rounded-xl py-2 text-sm text-muted"
            >
              ← Back to payment
            </button>
          </section>
        ) : null}

      </div>
    </div>
  );
}