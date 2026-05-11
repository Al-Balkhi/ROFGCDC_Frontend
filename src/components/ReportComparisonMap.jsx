import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Polyline decoding utility
function decodePolyline(str, precision) {
  var index = 0,
      lat = 0,
      lng = 0,
      coordinates = [],
      shift = 0,
      result = 0,
      byte = null,
      latitude_change,
      longitude_change,
      factor = Math.pow(10, precision || 5);

  while (index < str.length) {
    byte = null;
    shift = 0;
    result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

    shift = result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

    lat += latitude_change;
    lng += longitude_change;

    coordinates.push([lat / factor, lng / factor]);
  }

  return coordinates;
}

const DAMASCUS_BOUNDS = [
  [33.4, 36.1],
  [33.6, 36.4],
];
const defaultCenter = [33.5138, 36.2765];

// Custom Icons
const stopIcon = L.divIcon({
  className: "custom-stop-marker",
  html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
  iconAnchor: [8, 8],
});

const deviationIcon = L.divIcon({
  className: "custom-deviation-marker",
  html: `<div style="background-color: #ef4444; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
  iconAnchor: [8, 8],
});

const plannedBinIcon = L.divIcon({
  className: "custom-planned-marker",
  html: `<div style="background-color: #9ca3af; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
  iconAnchor: [6, 6],
});

const ReportComparisonMap = ({ plan, report, bins = [] }) => {
  // Planned route: extract from plan.data.routes[0].geometry (OSRM polyline)
  const plannedPoints = useMemo(() => {
    const geometry = plan?.data?.routes?.[0]?.geometry;
    if (geometry && typeof geometry === "string") {
      return decodePolyline(geometry);
    }
    return [];
  }, [plan]);

  // Actual route: parse GeoJSON LineString
  const actualPoints = useMemo(() => {
    const geojsonStr = report?.actual_route_geometry;
    if (!geojsonStr) return [];
    try {
      const geojson = typeof geojsonStr === "string" ? JSON.parse(geojsonStr) : geojsonStr;
      if (geojson?.type === "LineString" && Array.isArray(geojson.coordinates)) {
        // GeoJSON coordinates are [lng, lat]; Leaflet expects [lat, lng]
        return geojson.coordinates.map((c) => [c[1], c[0]]);
      }
    } catch {
      // ignore parse errors
    }
    return [];
  }, [report]);

  const center = useMemo(() => {
    if (actualPoints.length > 0) return actualPoints[0];
    if (plannedPoints.length > 0) return plannedPoints[0];
    if (bins.length > 0) return [bins[0].latitude, bins[0].longitude];
    return defaultCenter;
  }, [actualPoints, plannedPoints, bins]);

  return (
    <div className="w-full rounded-lg shadow-sm h-[500px] border border-gray-200 overflow-hidden relative z-0">
      <MapContainer
        center={center}
        zoom={13}
        maxBounds={DAMASCUS_BOUNDS}
        maxBoundsViscosity={1.0}
        className="w-full h-full"
        style={{ direction: "ltr" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* Planned Route - Dashed Gray */}
        {plannedPoints.length > 0 && (
          <Polyline 
            positions={plannedPoints} 
            color="#9ca3af" 
            weight={4} 
            dashArray="10, 10"
            opacity={0.8}
          />
        )}

        {/* Actual Route - Solid Blue */}
        {actualPoints.length > 0 && (
          <Polyline 
            positions={actualPoints} 
            color="#3b82f6" 
            weight={5} 
            opacity={0.9}
          />
        )}

        {/* Bins */}
        {bins.map((bin, i) => {
          if (!bin.latitude || !bin.longitude) return null;
          return (
            <Marker key={`bin-${i}`} position={[bin.latitude, bin.longitude]} icon={plannedBinIcon}>
              <Popup>
                <div className="text-right rtl" dir="rtl">
                  <p className="font-bold text-gray-700 mb-1">{bin.name || `حاوية #${bin.id}`}</p>
                  <p className="text-xs text-gray-500">السعة: {bin.capacity || "-"}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Stops */}
        <MarkerClusterGroup chunkedLoading maxClusterRadius={30}>
          {report?.stops?.map((stop, i) => {
            // Assuming stop location could be string or object. Need to be cautious.
            // Wait, we need point lat/lng. If backend provides location as geojson or coordinates...
            // the implementation plan says location = PointField. Usually serialized as {type: 'Point', coordinates: [lng, lat]}
            let pos = null;
            if (stop.location?.coordinates) {
              pos = [stop.location.coordinates[1], stop.location.coordinates[0]];
            } else if (stop.latitude && stop.longitude) {
              pos = [stop.latitude, stop.longitude];
            }
            if (!pos) return null;

            return (
              <Marker key={`stop-${i}`} position={pos} icon={stopIcon}>
                <Popup>
                  <div className="text-right rtl" dir="rtl">
                    <p className="font-bold text-blue-600 mb-1">توقف: {stop.reason}</p>
                    <p className="text-xs text-gray-600">المدة: {stop.duration_seconds} ثانية</p>
                    {stop.note && <p className="text-xs mt-1">{stop.note}</p>}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>

        {/* Deviations */}
        {report?.deviations?.map((dev, i) => {
          let pos = null;
          if (dev.location?.coordinates) {
            pos = [dev.location.coordinates[1], dev.location.coordinates[0]];
          } else if (dev.latitude && dev.longitude) {
            pos = [dev.latitude, dev.longitude];
          }
          if (!pos) return null;

          return (
            <Marker key={`dev-${i}`} position={pos} icon={deviationIcon}>
              <Popup>
                <div className="text-right rtl" dir="rtl">
                  <p className="font-bold text-red-600 mb-1">انحراف مسار: {dev.reason}</p>
                  {dev.note && <p className="text-xs">{dev.note}</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Legend inside map view */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-3 rounded shadow-md border border-gray-200 z-[1000] text-right" dir="rtl">
        <h4 className="text-sm font-bold text-gray-800 mb-2 border-b pb-1">مفتاح الخريطة</h4>
        <div className="flex flex-col gap-2 text-xs text-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-5 h-1 border-t-2 border-dashed border-gray-400"></div> مسار مخطط
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-1 bg-blue-500"></div> مسار فعلي
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 border border-white"></div> وقوف مسجل
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div> انحراف تقريره
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportComparisonMap;
