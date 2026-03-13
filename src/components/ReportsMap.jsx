import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getIssueTypeLabel } from "../constants/labels";
import StatusBadge from "../components/StatusBadge";

const DAMASCUS_BOUNDS = [
  [33.4, 36.1], // south-west
  [33.6, 36.4], // north-east
];

const defaultCenter = [33.5138, 36.2765];

const getUrgencyColor = (score) => {
  if (score >= 8) return "#ef4444"; // Red for high urgency
  if (score >= 5) return "#f97316"; // Orange for medium urgency
  return "#fcd34d"; // Amber/Yellow for low urgency
};

const createReportIcon = (score) => {
  const color = getUrgencyColor(score);
  return L.divIcon({
    className: "custom-report-marker",
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
    iconAnchor: [10, 10],
  });
};

const createClusterCustomIcon = function (cluster) {
  const markers = cluster.getAllChildMarkers();

  // Calculate the max urgency score within the cluster
  let maxScore = 0;
  markers.forEach((marker) => {
    // We pass urgencyScore in the Marker options
    const score = marker.options.urgencyScore || 0;
    if (score > maxScore) maxScore = score;
  });

  const color = getUrgencyColor(maxScore);

  return L.divIcon({
    html: `<div style="background-color: ${color}; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);">${markers.length}</div>`,
    className: "custom-marker-cluster",
    iconSize: L.point(40, 40, true),
  });
};

const ReportsMap = ({ reports }) => {
  // Determine center based on the first report, or default to Damascus
  const center = useMemo(() => {
    const validReports = reports.filter((r) => r.latitude && r.longitude);
    if (validReports.length > 0) {
      return [validReports[0].latitude, validReports[0].longitude];
    }
    return defaultCenter;
  }, [reports]);

  return (
    <div className="w-full rounded-lg shadow-sm h-[600px] border border-gray-100 overflow-hidden relative z-0">
      <MapContainer
        center={center}
        zoom={12}
        minZoom={10}
        maxZoom={18}
        maxBounds={DAMASCUS_BOUNDS}
        maxBoundsViscosity={1.0}
        className="w-full h-full"
        style={{ direction: "ltr" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={50}
        >
          {reports.map((report) => {
            if (!report.latitude || !report.longitude) return null;

            return (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
                icon={createReportIcon(report.urgency_score)}
                urgencyScore={report.urgency_score}
              >
                <Popup>
                  <div
                    className="text-right space-y-2 p-1 min-w-[200px]"
                    dir="rtl"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-gray-800">
                        بلاغ رقم #{report.id}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-red-600">
                        الأهمية: {report.urgency_score}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 border-b pb-2 line-clamp-3">
                      {report.description || "لا يوجد وصف"}
                    </p>

                    <div className="text-xs text-gray-500 mb-2">
                      <StatusBadge status={report.status} variant="report" />
                    </div>

                    <div className="text-xs text-gray-600">
                      النوع:{" "}
                      <span className="font-semibold">
                        {getIssueTypeLabel(report.issue_type)}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Legend inside the map overlay */}
      <div
        className="absolute bottom-6 left-6 bg-white p-3 rounded-lg shadow-lg border border-gray-200 z-[1000] text-right"
        dir="rtl"
      >
        <h4 className="text-xs font-bold text-gray-700 mb-2 border-b pb-1">
          مستوى الأهمية
        </h4>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 border border-gray-200"></div>
            <span className="text-xs text-gray-600">عالي (8 - 10)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 border border-gray-200"></div>
            <span className="text-xs text-gray-600">متوسط (5 - 7)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400 border border-gray-200"></div>
            <span className="text-xs text-gray-600">منخفض (1 - 4)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsMap;
