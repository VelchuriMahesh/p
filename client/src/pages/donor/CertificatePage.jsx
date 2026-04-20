import { useEffect, useState } from 'react';
import { Share2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { fetchDonationCertificate } from '../../services/donationService';
import { fetchDeliveryCertificate } from '../../services/deliveryService';
import { openCertificate } from '../../services/certificateService';

export default function CertificatePage() {
  const { type, recordId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCertificate = async () => {
      try {
        const payload =
          type === 'donation'
            ? await fetchDonationCertificate(recordId)
            : await fetchDeliveryCertificate(recordId);
        setCertificate(payload);
      } catch (loadError) {
        setError(loadError.message);
      }
    };
    loadCertificate();
  }, [type, recordId]);

  const handleShare = async () => {
    if (!certificate?.certificateUrl) return;
    const text = `I helped elders today through Celebrate With Purpose!`;
    if (navigator.share) {
      await navigator.share({ text });
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  if (error) {
    return <div className="mx-auto max-w-md px-4 py-8 text-center text-sm text-rose-700">{error}</div>;
  }

  if (!certificate) {
    return <div className="mx-auto max-w-md px-4 py-8 text-center text-sm text-muted">Loading certificate...</div>;
  }

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-md space-y-5 px-4 py-5">
        <section className="rounded-[28px] bg-white p-5 shadow-card">
          <h1 className="text-2xl font-bold text-navy">Your Certificate</h1>
          <p className="mt-2 text-sm text-muted">Your verified giving certificate is ready.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => openCertificate(certificate.certificateUrl)}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white"
            >
              View Certificate
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-navy text-sm font-semibold text-navy"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}