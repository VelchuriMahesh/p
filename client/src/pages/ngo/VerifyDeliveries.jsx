import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Award } from 'lucide-react';
import DonationStatusBadge from '../../components/DonationStatusBadge';
import { fetchNgoDeliveries, verifyNgoDelivery, rejectNgoDelivery } from '../../services/ngoAdminService';
import { issueCertificate } from '../../services/certificateService';
import { formatDateTime } from '../../utils/date';

export default function VerifyDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [reasons, setReasons] = useState({});
  const [certLoading, setCertLoading] = useState({});
  const [loading, setLoading] = useState(true);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const list = await fetchNgoDeliveries();
      setDeliveries(list || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  const filtered = deliveries.filter((item) =>
    filter === 'all' ? true : item.status === filter
  );

  const handleIssueCertificate = async (delivery) => {
    setCertLoading((prev) => ({ ...prev, [delivery.deliveryId]: true }));
    try {
      await issueCertificate({ type: 'delivery', record: delivery });
      await loadDeliveries();
      alert('Certificate issued successfully!');
    } catch (error) {
      alert(error.message);
    } finally {
      setCertLoading((prev) => ({ ...prev, [delivery.deliveryId]: false }));
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-5">
      <section className="rounded-[28px] bg-white p-5 shadow-card">
        <h1 className="text-2xl font-bold text-navy">Verify deliveries</h1>
        <p className="mt-1 text-sm text-muted">Review delivery proofs and issue certificates.</p>
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
            No {filter} deliveries.
          </div>
        ) : null}

        {filtered.map((delivery) => (
          <div key={delivery.deliveryId} className="rounded-2xl bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-navy">{delivery.donorName}</p>
                <p className="mt-1 text-sm text-muted">{delivery.itemsDelivered}</p>
                <p className="mt-1 text-xs text-muted">{formatDateTime(delivery.deliveredAt)}</p>
              </div>
              <DonationStatusBadge status={delivery.status} />
            </div>

            {delivery.proofImageUrl ? (
              <a href={delivery.proofImageUrl} target="_blank" rel="noreferrer">
                <img
                  src={delivery.proofImageUrl}
                  alt="Delivery proof"
                  className="mt-4 h-56 w-full rounded-2xl object-cover border border-slate-100"
                />
              </a>
            ) : null}

            {delivery.status === 'pending' ? (
              <>
                <input
                  type="text"
                  value={reasons[delivery.deliveryId] || ''}
                  onChange={(event) =>
                    setReasons((current) => ({
                      ...current,
                      [delivery.deliveryId]: event.target.value,
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
                        await verifyNgoDelivery(delivery.deliveryId);
                        await loadDeliveries();
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
                        await rejectNgoDelivery(
                          delivery.deliveryId,
                          reasons[delivery.deliveryId] || 'Proof needs clarification.'
                        );
                        await loadDeliveries();
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

            {delivery.status === 'verified' && !delivery.certificateUrl ? (
              <button
                type="button"
                onClick={() => handleIssueCertificate(delivery)}
                disabled={certLoading[delivery.deliveryId]}
                className="mt-3 min-h-11 w-full rounded-xl bg-accent text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <Award className="h-4 w-4" />
                {certLoading[delivery.deliveryId] ? 'Issuing...' : 'Issue Certificate'}
              </button>
            ) : null}

            {delivery.certificateUrl ? (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3">
                <Award className="h-4 w-4 text-emerald-700" />
                <p className="text-sm font-semibold text-emerald-700">Certificate issued</p>
                <a
                  href={delivery.certificateUrl}
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