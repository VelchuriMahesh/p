import { MapPin, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function NGOCard({ ngo, distanceLabel }) {
  const navigate = useNavigate();

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/ngo/${ngo.ngoId}`)}
      className="w-full rounded-2xl bg-white p-4 text-left shadow-card"
    >
      <div className="flex items-start gap-3">
        <img
          src={ngo.logoUrl || 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=300&q=80'}
          alt={ngo.name}
          className="h-14 w-14 rounded-2xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-navy">{ngo.name}</h3>
              <p className="mt-1 max-h-10 overflow-hidden text-sm text-muted">{ngo.description}</p>
            </div>
            {distanceLabel ? <span className="rounded-full bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">{distanceLabel}</span> : null}
          </div>
          <div className="mt-3 space-y-1 text-xs text-muted">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">{ngo.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" />
              <span>{ngo.phone}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
