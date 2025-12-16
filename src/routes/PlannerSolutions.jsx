import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Popup, Marker } from 'react-leaflet';
import { useParams } from 'react-router-dom';
import L from 'leaflet';
import { plannerAPI } from '../services/api';
import { useToast } from '../components/ToastContainer';

const DAMASCUS_BOUNDS = [
  [33.4, 36.1],
  [33.6, 36.4],
];
const defaultCenter = [33.5138, 36.2765];

const colors = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0ea5e9'];

const startIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#0ea5e9;width:14px;height:14px;border-radius:50%;border:2px solid white"></div>',
  iconAnchor: [7, 7],
});

const binIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#16a34a;width:10px;height:10px;border-radius:50%;border:2px solid white"></div>',
  iconAnchor: [6, 6],
});

const PlannerSolutions = () => {
  const { solutionId } = useParams();
  const { addToast } = useToast();

  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today'); // today | week | month | all

  const fetchSolutions = useCallback(async (range = filter) => {
    setLoading(true);
    try {
      const params = range === 'all' ? {} : { range };
      const res = await plannerAPI.getSolutions(params);
      setSolutions(res.data.results || res.data || []);
    } catch {
      addToast('فشل تحميل الحلول', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, addToast]);

  // Load list whenever filter changes
  useEffect(() => {
    fetchSolutions(filter);
  }, [fetchSolutions, filter]);

  // Ensure specific solution is loaded when navigating directly
  useEffect(() => {
    const ensureSolution = async () => {
      if (!solutionId) return;
      const exists = solutions.some((s) => String(s.id) === String(solutionId));
      if (!exists) {
        try {
          const res = await plannerAPI.getSolution(solutionId);
          setSolutions((prev) => [res.data, ...prev]);
        } catch {
          addToast('لم يتم العثور على هذا الحل', 'error');
        }
      }
    };
    ensureSolution();
  }, [solutionId, solutions, addToast]);

  const preparedRoutes = useMemo(() => {
    return solutions.flatMap((solution, solutionIndex) => {
      const scenario = solution.scenario || {};
      const binsMap = new Map((scenario.bins || []).map((b) => [b.id, b]));
      const startLat = scenario.start_latitude ?? scenario.vehicle?.start_latitude;
      const startLon = scenario.start_longitude ?? scenario.vehicle?.start_longitude;

      if (!solution.data?.routes) return [];

      return solution.data.routes.map((route, routeIndex) => {
        const coords = [];
        if (startLat && startLon) coords.push([startLat, startLon]);
        route.stops.forEach((binId) => {
          const bin = binsMap.get(binId);
          if (bin?.latitude && bin?.longitude) coords.push([bin.latitude, bin.longitude]);
        });

        return {
          id: `${solution.id}-${routeIndex}`,
          color: colors[(solutionIndex + routeIndex) % colors.length],
          coords,
          meta: {
            planName: scenario.name,
            collectionDate: scenario.collection_date,
            vehicle: route.vehicle,
            binsCount: route.stops.length,
          },
          start: startLat && startLon ? [startLat, startLon] : null,
          bins: route.stops
            .map((id) => binsMap.get(id))
            .filter(Boolean)
            .map((bin) => [bin.latitude, bin.longitude]),
        };
      });
    });
  }, [solutions]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-800">الحلول المثلى</h1>
        <div className="flex gap-2">
          {[
            { key: 'today', label: 'اليوم' },
            // { key: 'week', label: 'هذا الأسبوع' },
            { key: 'month', label: 'هذا الشهر' },
            { key: 'all', label: 'الكل' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`px-3 py-1 rounded-lg border text-sm ${
                filter === item.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {loading && <span className="text-sm text-gray-500">جاري التحميل...</span>}
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="w-full h-[600px] relative">
          <MapContainer
            center={defaultCenter}
            zoom={12}
            minZoom={11}
            maxZoom={18}
            maxBounds={DAMASCUS_BOUNDS}
            maxBoundsViscosity={1.0}
            className="w-full h-full"
            style={{ direction: 'ltr' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {preparedRoutes.map((route) => (
              <Polyline key={route.id} positions={route.coords} color={route.color} weight={5}>
                <Popup>
                  <div className="text-right space-y-1">
                    <p className="font-semibold">الخطة: {route.meta.planName || 'بدون اسم'}</p>
                    <p className="text-sm text-gray-700">تاريخ الجمع: {route.meta.collectionDate}</p>
                    <p className="text-sm text-gray-700">المركبة: {route.meta.vehicle}</p>
                    <p className="text-sm text-gray-700">عدد الحاويات: {route.meta.binsCount}</p>
                  </div>
                </Popup>
              </Polyline>
            ))}

            {preparedRoutes.map((route) => (
              <Fragment key={`${route.id}-markers`}>
                {route.start && <Marker position={route.start} icon={startIcon} />}
                {route.bins.map((pos, idx) => (
                  <Marker key={`${route.id}-bin-${idx}`} position={pos} icon={binIcon} />
                ))}
              </Fragment>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default PlannerSolutions;

