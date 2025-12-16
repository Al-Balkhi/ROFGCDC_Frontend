import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

import { mapAPI } from '../services/api';

const DAMASCUS_BOUNDS = [
  [33.40, 36.10], // south-west
  [33.60, 36.40], // north-east
];

const defaultCenter = [33.5138, 36.2765]; // Damascus fallback

const createIcon = (color) =>
  L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.4)"></div>`,
    iconAnchor: [8, 8],
  });

const icons = {
  bin: createIcon('#16a34a'),
  vehicle: createIcon('#2563eb'),
  landfill: createIcon('#b45309'),
  municipality: createIcon('#dc2626'),
};

const MapView = () => {
  const navigate = useNavigate();
  const [bins, setBins] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [landfills, setLandfills] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showBins, setShowBins] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);
  const [showLandfills, setShowLandfills] = useState(true);
  const [showMunicipality, setShowMunicipality] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [binsRes, vehiclesRes, landfillsRes, municipalitiesRes] = await Promise.all([
          mapAPI.getBins(),
          mapAPI.getVehicles(),
          mapAPI.getLandfills(),
          mapAPI.getMunicipalities(),
        ]);

        setBins(binsRes.data.results || binsRes.data || []);
        setVehicles(vehiclesRes.data.results || vehiclesRes.data || []);
        setLandfills(landfillsRes.data.results || landfillsRes.data || []);
        setMunicipalities(municipalitiesRes.data.results || municipalitiesRes.data || []);
      } catch {
        setError('فشل تحميل بيانات الخريطة');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const center = useMemo(() => {
    const muniWithHQ = municipalities.find((m) => m.hq_latitude && m.hq_longitude);
    if (muniWithHQ) return [muniWithHQ.hq_latitude, muniWithHQ.hq_longitude];
    return defaultCenter;
  }, [municipalities]);

  return (
    <div className="w-full rounded-lg shadow-md overflow-hidden bg-white">
      <div className="flex items-center gap-4 p-4 border-b flex-shrink-0">
        <span className="font-semibold text-gray-800">الفلترة حسب: </span>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showBins} onChange={(e) => setShowBins(e.target.checked)} />
          حاوية
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showVehicles}
            onChange={(e) => setShowVehicles(e.target.checked)}
          />
          شاحنة
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showLandfills}
            onChange={(e) => setShowLandfills(e.target.checked)}
          />
          مكب قمامة
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showMunicipality}
            onChange={(e) => setShowMunicipality(e.target.checked)}
          />
          مديرية
        </label>
        {loading && <span className="text-sm text-gray-500">جاري التحميل...</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      <div className="w-full h-[600px] relative">
        <MapContainer
          center={center}
          zoom={12}
          minZoom={11}
          maxZoom={18}
          maxBounds={DAMASCUS_BOUNDS}
          maxBoundsViscosity={1.0}
          className="w-full h-full"
          style={{ direction: 'ltr' }} // ensure Leaflet controls render correctly
        >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {showBins &&
          bins
            .filter((b) => b.latitude && b.longitude)
            .map((bin) => (
              <Marker key={`bin-${bin.id}`} position={[bin.latitude, bin.longitude]} icon={icons.bin}>
                <Popup>
                  <div className="text-right space-y-1">
                    <p className="font-semibold">الحاوية: {bin.name}</p>
                    <p className="text-sm text-gray-700">السعة: {bin.capacity}</p>
                    <p className="text-xs text-gray-500">
                      ({bin.latitude}, {bin.longitude})
                    </p>
                    <button
                      className="mt-2 text-blue-600 text-sm underline"
                      onClick={() => navigate(`/dashboard/admin/bins/${bin.id}`)}
                    >
                      تعديل
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

        {showVehicles &&
          vehicles
            .filter((v) => v.start_latitude && v.start_longitude)
            .map((vehicle) => (
              <Marker
                key={`vehicle-${vehicle.id}`}
                position={[vehicle.start_latitude, vehicle.start_longitude]}
                icon={icons.vehicle}
              >
                <Popup>
                  <div className="text-right space-y-1">
                    <p className="font-semibold">الشاحنة: {vehicle.name}</p>
                    <p className="text-sm text-gray-700">السعة: {vehicle.capacity}</p>
                    <p className="text-xs text-gray-500">
                      ({vehicle.start_latitude}, {vehicle.start_longitude})
                    </p>
                    <button
                      className="mt-2 text-blue-600 text-sm underline"
                      onClick={() => navigate(`/dashboard/admin/vehicles/${vehicle.id}`)}
                    >
                      تعديل
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

        {showLandfills &&
          landfills
            .filter((l) => l.latitude && l.longitude)
            .map((landfill) => (
              <Marker
                key={`landfill-${landfill.id}`}
                position={[landfill.latitude, landfill.longitude]}
                icon={icons.landfill}
              >
                <Popup>
                  <div className="text-right space-y-1">
                    <p className="font-semibold">المدفن: {landfill.name}</p>
                    <p className="text-sm text-gray-700">{landfill.description}</p>
                    <p className="text-xs text-gray-500">
                      ({landfill.latitude}, {landfill.longitude})
                    </p>
                    {landfill.municipalities?.length > 0 && (
                      <p className="text-xs text-gray-600">
                        البلديات: {landfill.municipalities.map((m) => m.name).join('، ')}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

        {showMunicipality &&
          municipalities
            .filter((m) => m.hq_latitude && m.hq_longitude)
            .map((m) => (
              <Marker
                key={`muni-${m.id}`}
                position={[m.hq_latitude, m.hq_longitude]}
                icon={icons.municipality}
              >
                <Popup>
                  <div className="text-right space-y-1">
                    <p className="font-semibold">البلدية: {m.name}</p>
                    <p className="text-sm text-gray-700">{m.description}</p>
                    <p className="text-xs text-gray-500">
                      ({m.hq_latitude}, {m.hq_longitude})
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapView;