import { Fragment, useCallback, useEffect, useMemo, useState, cloneElement } from 'react';
import { MapContainer, TileLayer, Polyline, Popup, Marker } from 'react-leaflet';
import { useParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';  
import { 
  MapPin, 
  Leaf, 
  Fuel, 
  Timer, 
  Calendar, 
  Filter, 
  Loader2,
  Navigation,
  Truck,
  Ruler
} from 'lucide-react';
import { plannerAPI } from '../services/api';
import { useToast } from '../components/ToastContainer';

const DAMASCUS_BOUNDS = [[33.4, 36.1], [33.6, 36.4]];
const defaultCenter = [33.5138, 36.2765];
const colors = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0ea5e9'];

// --- Markers Styling ---
const startIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#2563eb;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 5px rgba(0,0,0,0.2)"></div>',
  iconAnchor: [7, 7],
});

const binIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#10b981;width:10px;height:10px;border-radius:50%;border:2px solid white"></div>',
  iconAnchor: [5, 5],
});

// --- Polyline Decoding ---
const decodePolyline = (encoded) => {
  if (!encoded) return [];
  const poly = [];
  let index = 0, len = encoded.length, lat = 0, lng = 0;
  while (index < len) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) !== 0 ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) !== 0 ? ~(result >> 1) : (result >> 1);
    poly.push([lat / 1e5, lng / 1e5]);
  }
  return poly;
};

const PlannerSolutions = () => {
  const { solutionId } = useParams();
  const { addToast } = useToast();
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');

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

  useEffect(() => { fetchSolutions(filter); }, [fetchSolutions, filter]);

  useEffect(() => {
    const ensureSolution = async () => {
      if (!solutionId) return;
      if (!solutions.some((s) => String(s.id) === String(solutionId))) {
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
        let coords = route.geometry ? decodePolyline(route.geometry) : [];
        if (!route.geometry) {
          if (startLat && startLon) coords.push([startLat, startLon]);
          route.stops.forEach((binId) => {
            const bin = binsMap.get(binId);
            if (bin?.latitude && bin?.longitude) coords.push([bin.latitude, bin.longitude]);
          });
          if (startLat && startLon) coords.push([startLat, startLon]);
        }

        return {
          id: `${solution.id}-${routeIndex}`,
          color: colors[(solutionIndex + routeIndex) % colors.length],
          coords,
          meta: {
            planName: scenario.name,
            collectionDate: scenario.collection_date,
            vehicle: route.vehicle,
            binsCount: route.stops.length,
            distance: route.distance,
          },
          start: startLat && startLon ? [startLat, startLon] : null,
          bins: route.stops.map(id => binsMap.get(id)).filter(Boolean).map(b => [b.latitude, b.longitude]),
        };
      });
    });
  }, [solutions]);

  const kpis = useMemo(() => {
    let stats = { km: 0, co2: 0, fuel: 0, onTime: 0, totalBins: 0 };
    solutions.forEach(s => {
      const k = s.data?.kpis;
      if (k) {
        stats.km += k.total_km || 0;
        stats.co2 += k.co2_kg || 0;
        stats.fuel += k.fuel_litres || 0;
        stats.onTime += k.on_time_pickups || 0;
      }
      stats.totalBins += s.data?.routes?.reduce((acc, r) => acc + (r.stops?.length || 0), 0) || 0;
    });
    return {
      totalKm: stats.km.toFixed(1),
      co2: stats.co2.toFixed(1),
      fuel: stats.fuel.toFixed(1),
      onTimeRate: stats.totalBins > 0 ? ((stats.onTime / stats.totalBins) * 100).toFixed(1) : "100"
    };
  }, [solutions]);

  return (
    <div className="space-y-6 p-2 lg:p-4" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            تحليل المسارات الذكية
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-fit">
          {[
            { key: 'today', label: 'اليوم' },
            { key: 'month', label: 'الشهري' },
            { key: 'all', label: 'الكل' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === item.key 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {item.label}
            </button>
          ))}
          {loading && <Loader2 className="w-4 h-4 animate-spin mx-2 text-blue-500" />}
        </div>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="المسافة الإجمالية" 
          value={kpis.totalKm} 
          unit="كم" 
          icon={<MapPin />} 
          color="blue" 
        />
        <StatCard 
          label="انبعاثات CO₂" 
          value={kpis.co2} 
          unit="كغ" 
          icon={<Leaf />} 
          color="green" 
        />
        <StatCard 
          label="استهلاك الوقود" 
          value={kpis.fuel} 
          unit="لتر" 
          icon={<Fuel />} 
          color="orange" 
        />
        <StatCard 
          label="دقة المواعيد" 
          value={kpis.onTimeRate} 
          unit="%" 
          icon={<Timer />} 
          color="purple" 
        />
      </div>

      {/* Map Section */}
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="w-full h-[650px] relative"> 
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
              <Fragment key={route.id}>
                <Polyline 
                  positions={route.coords} 
                  color={route.color} 
                  weight={4} 
                  opacity={0.8}
                  eventHandlers={{ mouseover: (e) => e.target.setStyle({ weight: 7, opacity: 1 }), mouseout: (e) => e.target.setStyle({ weight: 4, opacity: 0.8 }) }}
                >
                  <Popup>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Truck className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-medium">المركبة:</span>
                        <span className="text-gray-900">{route.meta.vehicle}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-green-500" />
                        <span className="font-medium">الحاويات:</span>
                        <span className="text-gray-900">{route.meta.binsCount} حاوية</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Ruler className="w-3.5 h-3.5 text-orange-500" />
                        <span className="font-medium">المسافة:</span>
                        <div className="flex gap-1 items-baseline" dir="ltr">
                            <span className="text-gray-900 font-bold">{route.meta.distance?.toFixed(1)}</span>
                            <span className="text-[10px] text-gray-400">KM</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Polyline>
                {route.start && <Marker position={route.start} icon={startIcon} />}
                {route.bins.map((pos, idx) => (
                  <Marker key={`${route.id}-b-${idx}`} position={pos} icon={binIcon} />
                ))}
              </Fragment>
            ))}
          </MapContainer>

          {/* Map Legend */}
          <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-gray-100 max-h-[80%] overflow-y-auto w-64 hidden md:block">
            <div className="flex items-center gap-2 mb-3 border-b pb-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <h3 className="font-bold text-sm text-gray-800">تحليل المسارات الحالية</h3>
            </div>
            <div className="space-y-3">
              {preparedRoutes.length > 0 ? preparedRoutes.slice(0, 8).map((route) => (
                <div key={`lg-${route.id}`} className="group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: route.color }}></div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-bold text-gray-800 truncate">{route.meta.vehicle}</span>
                      <span className="text-[10px] text-gray-500 truncate">{route.meta.planName}</span>
                    </div>
                  </div>
                </div>
              )) : <p className="text-xs text-gray-400 text-center">لا توجد بيانات متاحة</p>}
              {preparedRoutes.length > 8 && (
                <p className="text-[10px] text-blue-600 font-medium text-center bg-blue-50 py-1 rounded">
                  + {preparedRoutes.length - 8} مسارات أخرى يتم عرضها
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-component for KPI Cards ---
const StatCard = ({ label, value, unit, icon, color }) => {
  const colorsMap = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors">{label}</p>
          <div className="flex items-baseline gap-1" dir="ltr">
            <span className="text-2xl font-extrabold text-gray-900">{value}</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{unit}</span>
          </div>
        </div>
        <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${colorsMap[color]}`}>
          {cloneElement(icon, { size: 22, strokeWidth: 2.5 })}
        </div>
      </div>
    </div>
  );
};

export default PlannerSolutions;