import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Reuse the simple icon style from MapView or similar
const createIcon = (color) =>
  L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};width:20px;height:20px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.4)"></div>`,
    iconAnchor: [10, 10],
  });

const markerIcon = createIcon('#2563eb'); // Blue color

const DAMASCUS_BOUNDS = [
  [33.40, 36.10], // south-west
  [33.60, 36.40], // north-east
];

const defaultCenter = [33.5138, 36.2765];


function LoadMapState({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position ? <Marker position={position} icon={markerIcon} /> : null;
}

const LocationPickerModal = ({ isOpen, onClose, onConfirm, initialLat, initialLng, title }) => {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (initialLat && initialLng) {
        const lat = parseFloat(initialLat);
        const lng = parseFloat(initialLng);
        setPosition((prev) => {
            if (prev && prev.lat === lat && prev.lng === lng) return prev;
            return { lat, lng };
        });
      } else {
        // Optional: Set to default center if no initial pos? 
        // Or just let user click. Let's keep it null initially so user knows they haven't picked.
        // Actually, centering map on default is good, but marker should be null unless they click.
        // But if they are editing, we need to show the current one.
        setPosition(null);
      }
    }
  }, [isOpen, initialLat, initialLng]);

  if (!isOpen) return null;

  const mapCenter = position ? [position.lat, position.lng] : defaultCenter;

  const handleConfirm = () => {
    if (position) {
      onConfirm(position.lat, position.lng);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[600px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">
            {title || 'تحديد الموقع على الخريطة'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            &times;
          </button>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
           <MapContainer
            center={mapCenter}
            zoom={13}
            minZoom={11}
            maxZoom={18}
            maxBounds={DAMASCUS_BOUNDS}
            maxBoundsViscosity={1.0}
            className="w-full h-full"
            style={{ direction: 'ltr' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {position && <LoadMapState center={position} />}
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>
          
          {/* Instructions Overlay */}
          <div className="absolute top-4 right-4 bg-white/90 p-2 rounded shadow text-sm z-[1000] pointer-events-none">
            قم بالنقر على الخريطة لتحديد الموقع
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirm}
            disabled={!position}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            تأكيد الموقع
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;
