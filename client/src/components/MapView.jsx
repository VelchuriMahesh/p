import { GoogleMap, InfoWindowF, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const defaultCenter = { lat: 20.5937, lng: 78.9629 };

export default function MapView({ ngos = [], center = defaultCenter, filter = 'all' }) {
  const navigate = useNavigate();
  const [selectedNgo, setSelectedNgo] = useState(null);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const visibleNgos = useMemo(() => {
    if (filter === 'urgent') {
      return ngos.filter((ngo) => ngo.mealsServed < 10 || ngo.totalReceived < 5000);
    }

    return ngos;
  }, [filter, ngos]);

  if (!isLoaded) {
    return <div className="skeleton h-[70vh] rounded-[28px]" />;
  }

  return (
    <GoogleMap mapContainerClassName="h-[70vh] w-full rounded-[28px]" center={center} zoom={filter === 'nearby' ? 11 : 5}>
      {visibleNgos.map((ngo) => (
        <MarkerF key={ngo.ngoId} position={{ lat: ngo.lat, lng: ngo.lng }} onClick={() => setSelectedNgo(ngo)} />
      ))}

      {selectedNgo ? (
        <InfoWindowF position={{ lat: selectedNgo.lat, lng: selectedNgo.lng }} onCloseClick={() => setSelectedNgo(null)}>
          <div className="max-w-[180px]">
            <p className="text-sm font-semibold text-navy">{selectedNgo.name}</p>
            <p className="mt-1 text-xs text-muted">{selectedNgo.address}</p>
            <button
              type="button"
              onClick={() => navigate(`/ngo/${selectedNgo.ngoId}`)}
              className="mt-3 rounded-full bg-accent px-3 py-2 text-xs font-semibold text-white"
            >
              Donate
            </button>
          </div>
        </InfoWindowF>
      ) : null}
    </GoogleMap>
  );
}

