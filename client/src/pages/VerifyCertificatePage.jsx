import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldX } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../services/apiClient';
import { formatDate } from '../utils/date';

export default function VerifyCertificatePage() {
  const { certId } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest(`/api/certificate/verify/${certId}`)
      .then(setResult)
      .catch((verificationError) => setError(verificationError.message));
  }, [certId]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-4">
        <div className="w-full max-w-md rounded-[28px] bg-white p-6 text-center shadow-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <ShieldX className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-navy">Certificate not found</h1>
          <p className="mt-2 text-sm text-muted">{error}</p>
        </div>
      </main>
    );
  }

  if (!result) {
    return <main className="flex min-h-screen items-center justify-center bg-cream text-sm text-muted">Checking certificate...</main>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-card">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-center text-2xl font-bold text-navy">Certificate verified</h1>
        <p className="mt-2 text-center text-sm text-muted">This certificate was issued by Celebrate With Purpose.</p>
        <div className="mt-6 space-y-3 rounded-2xl bg-cream p-4 text-sm text-navy">
          <p><span className="font-semibold">Type:</span> {result.type}</p>
          <p><span className="font-semibold">Donor:</span> {result.record.donorName}</p>
          <p><span className="font-semibold">NGO:</span> {result.record.ngoName}</p>
          <p><span className="font-semibold">Date:</span> {formatDate(result.record.verifiedAt || result.record.createdAt || result.record.deliveredAt)}</p>
        </div>
      </div>
    </main>
  );
}

