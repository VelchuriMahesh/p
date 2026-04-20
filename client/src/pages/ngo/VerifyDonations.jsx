import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Award } from 'lucide-react';
import DonationStatusBadge from '../../components/DonationStatusBadge';
import { fetchNgoDonations, verifyNgoDonation, rejectNgoDonation } from '../../services/ngoAdminService';
import { issueCertificate } from '../../services/certificateService';
import { formatCurrency, formatDate } from '../../utils/date';

export default function VerifyDonations() {
  const [donations, setDonations] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [reasons, setReasons] = useState({});
  const [certLoading, setCertLoading] = useState({});
  const [loading, setLoading] = useState(true);

  const loadDonations = async () => {
    setLoading(true);
    try {
      const list = await fetchNgoDonations();
      setDonations(list || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  const filtered = donations.filter((item) =>
    filter === 'all' ? true : item.status === filter
  );

  const handleIssueCertificate = async (donation) => {
    setCertLoading((prev) => ({ ...prev, [donation.donationId]: true }));
    try {
      await issueCertificate({ type: 'donation', record: donation });
      await loadDonations();
      alert('Certificate issued successfully!');
    } catch (error) {
      alert(error.message);
    } finally {
      setCertLoading((prev) => ({ ...prev, [donation.donationId]: false }));
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-5">
      <section className="rounded-[28px] bg-white p-5 shadow-card">
        <h1 className="text-2xl font-bold text-navy">Verify donations</h1>
        <p className="mt-1 text-sm text-muted">Review screenshots and issue certificates.</p>
        <div className="mt-4 flex gap-2 flex-wrap">
          {['pending', 'verified', 'rejected', 'all'].map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                filter === item ? 'bg-accent text-white' : 'bg-cream text-navy'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {loading ? <div className="skeleton h-32 rounded-2xl" /> : null}

      <div className="space-y-4">
        {!loading && filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-muted">
            No {filter} donations.
          </div>
        ) : null}

        {filtered.map((donation) => (
          <div key={donation.donationId} className="rounded-2xl bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-navy">{donation.donorName}</p>
                <p className="mt-1 text-sm text-muted">
                  {formatCurrency(donation.amount)} • UTR: {donation.utr}
                </p>
                <p className="mt-1 text-xs text-muted">{formatDate(donation.createdAt)}</p>
              </div>
              <DonationStatusBadge status={donation.status} />
            </div>

            {donation.screenshotUrl ? (
              <a href={donation.screenshotUrl} target="_blank" rel="noreferrer">
                <img
                  src={donation.screenshotUrl}
                  alt="Payment screenshot"
                  className="mt-4 h-56 w-full rounded-2xl object-cover border border-slate-100"
                />
              </a>
            ) : (
              <div className="mt-4 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-xs text-muted">
                No screenshot uploaded
              </div>
            )}

            {donation.status === 'pending' ? (
              <>
                <input
                  type="text"
                  value={reasons[donation.donationId] || ''}
                  onChange={(event) =>
                    setReasons((current) => ({
                      ...current,
                      [donation.donationId]: event.target.value,
                    }))
                  }
                  placeholder="Reason if rejecting (optional)"
                  className="mt-4 min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm"
                />
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (navigator.vibrate) navigator.vibrate(50);
                        await verifyNgoDonation(donation.donationId);
                        await loadDonations();
                      } catch (err) {
                        alert(err.message);
                      }
                    }}
                    className="min-h-11 rounded-xl bg-emerald-600 text-sm font-semibold text-white flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await rejectNgoDonation(
                          donation.donationId,
                          reasons[donation.donationId] || 'Proof needs clarification.'
                        );
                        await loadDonations();
                      } catch (err) {
                        alert(err.message);
                      }
                    }}
                    className="min-h-11 rounded-xl bg-rose-600 text-sm font-semibold text-white flex items-center justify-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </>
            ) : null}

            {donation.status === 'verified' && !donation.certificateUrl ? (
              <button
                type="button"
                onClick={() => handleIssueCertificate(donation)}
                disabled={certLoading[donation.donationId]}
                className="mt-3 min-h-11 w-full rounded-xl bg-accent text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <Award className="h-4 w-4" />
                {certLoading[donation.donationId] ? 'Issuing...' : 'Issue Certificate'}
              </button>
            ) : null}

            {donation.certificateUrl ? (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3">
                <Award className="h-4 w-4 text-emerald-700" />
                <p className="text-sm font-semibold text-emerald-700">Certificate issued</p>
                <a
                  href={donation.certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto text-xs font-semibold text-accent"
                >
                  View
                </a>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}