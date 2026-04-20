import { Download, Share2 } from 'lucide-react';
import { formatDate } from '../utils/date';

export default function CertificateCard({ item, onOpen }) {
  const handleShare = async () => {
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(`I helped elders today! ${item.certificateUrl}`)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-navy">{item.ngoName}</p>
          <p className="mt-1 text-xs text-muted">{formatDate(item.verifiedAt || item.createdAt)}</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Ready</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={onOpen} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white">
          <Download className="h-4 w-4" />
          Download
        </button>
        <button type="button" onClick={handleShare} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-navy text-sm font-semibold text-navy">
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>
    </div>
  );
}

