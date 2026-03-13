import { useEffect, useState, useCallback } from "react";
import { reportsAPI } from "../services/api";
import { useToast } from "../components/ToastContainer";
import { useSearchParams } from "react-router-dom";
import ReportsMap from "../components/ReportsMap";
import ReportFiltersDropdown from "../components/ReportFiltersDropdown";
import ConfirmDialog from "../components/ConfirmDialog";
import ReportCard from "../components/reports/ReportCard";
import ReportDetailsModal from "../components/reports/ReportDetailsModal";
import ReportActionModal from "../components/reports/ReportActionModal";
import { useReportFilters } from "../hooks/useReportFilters";
import { useScrollIntoView } from "../hooks/useScrollIntoView";

/**
 * CitizenReports — orchestration-only route component.
 *
 * Data fetching, filter logic, and scroll behaviour live in hooks.
 * Report card, details modal, and action modal each live in their own files.
 * This component contains only the wiring between them.
 */
const CitizenReports = () => {
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("id");

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'map'

  // ---- filter / sort hook ----
  const {
    filterType,
    setFilterType,
    filterRecency,
    setFilterRecency,
    filterImportance,
    setFilterImportance,
    filterStatus,
    setFilterStatus,
    showFilters,
    setShowFilters,
    activeFilters,
    filteredAndSortedReports,
    resetFilters,
  } = useReportFilters(reports);

  // ---- modal state ----
  const [detailsModalReport, setDetailsModalReport] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionType, setActionType] = useState("");
  const [capacity, setCapacity] = useState("");
  const [note, setNote] = useState("");

  // ---- confirm dialog state ----
  const [confirmState, setConfirmState] = useState({ open: false });

  // ---- data fetch ----
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getReports();
      setReports(response.data.results || response.data);
    } catch (error) {
      console.error(error);
      addToast("فشل تحميل البلاغات", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // ---- deep-link support: scroll + auto-open modal ----
  useScrollIntoView(highlightId, reports, { prefix: "report" });
  useEffect(() => {
    if (!highlightId || !reports.length) return;
    const target = reports.find((r) => r.id.toString() === highlightId);
    if (target) setDetailsModalReport(target);
  }, [highlightId, reports]);

  // ---- action handlers ----
  const handleActionSubmit = async () => {
    try {
      if (actionType === "immediate") {
        const res = await reportsAPI.createPlan(selectedReport.id);
        addToast(res.data.message || "تم إنشاء الخطة بنجاح", "success");
      } else if (actionType === "new_bin" || actionType === "resize_bin") {
        const payload = { request_type: actionType, note };
        if (capacity) payload.capacity = capacity;
        const res = await reportsAPI.requestBin(selectedReport.id, payload);
        addToast(res.data.message || "تم تقديم طلب الحاوية", "success");
      }
      setSelectedReport(null);
      setDetailsModalReport(null);
      fetchReports();
    } catch (error) {
      console.error(error);
      addToast(
        error.response?.data?.error || "حدث خطأ عند تنفيذ الإجراء",
        "error",
      );
    }
  };

  const handleDeleteReport = (id) => {
    setConfirmState({
      open: true,
      message: "هل أنت متأكد من حذف هذا البلاغ نهائياً؟",
      onConfirm: async () => {
        try {
          await reportsAPI.deleteReport(id);
          addToast("تم حذف البلاغ بنجاح", "success");
          setDetailsModalReport(null);
          fetchReports();
        } catch (error) {
          console.error(error);
          addToast(
            error.response?.data?.error || "حدث خطأ عند حذف البلاغ",
            "error",
          );
        }
      },
    });
  };

  const openActionModal = (report, type) => {
    setSelectedReport(report);
    setActionType(type);
    setCapacity("");
    setNote("");
  };

  // ---- render ----
  return (
    <div className="w-full space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">بلاغات المواطنين</h1>

        <div className="flex items-center gap-3">
          {/* Filter button — list view only */}
          {viewMode === "list" && (
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-all ${
                  activeFilters > 0
                    ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                    : "bg-white hover:bg-gray-50 text-gray-700"
                }`}
              >
                فلترة
                {activeFilters > 0 && (
                  <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {activeFilters}
                  </span>
                )}
              </button>

              {showFilters && (
                <ReportFiltersDropdown
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  filterType={filterType}
                  setFilterType={setFilterType}
                  filterRecency={filterRecency}
                  setFilterRecency={setFilterRecency}
                  filterImportance={filterImportance}
                  setFilterImportance={setFilterImportance}
                  onReset={resetFilters}
                  onClose={() => setShowFilters(false)}
                />
              )}
            </div>
          )}

          {/* View mode toggle */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            {[
              { mode: "list", label: "قائمة" },
              { mode: "map", label: "خريطة" },
            ].map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-white shadow-sm text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">جاري التحميل...</div>
      ) : viewMode === "list" ? (
        <div className="flex flex-col gap-4">
          {filteredAndSortedReports.length === 0 && (
            <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm">
              لا توجد بلاغات تلبي معايير البحث
            </div>
          )}
          {filteredAndSortedReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              isHighlighted={highlightId == report.id}
              onClick={() => setDetailsModalReport(report)}
            />
          ))}
        </div>
      ) : (
        <ReportsMap reports={reports} />
      )}

      {/* Details Modal */}
      {detailsModalReport && (
        <ReportDetailsModal
          report={detailsModalReport}
          onClose={() => setDetailsModalReport(null)}
          onAction={openActionModal}
          onDelete={handleDeleteReport}
          onImageClick={setLightboxImage}
        />
      )}

      {/* Action Modal */}
      {selectedReport && (
        <ReportActionModal
          report={selectedReport}
          actionType={actionType}
          capacity={capacity}
          note={note}
          setCapacity={setCapacity}
          setNote={setNote}
          onConfirm={handleActionSubmit}
          onCancel={() => setSelectedReport(null)}
        />
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxImage(null);
            }}
            aria-label="إغلاق"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <img
            src={lightboxImage}
            alt="Enlarged view"
            className="max-w-full max-h-full object-contain cursor-default"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        confirmLabel="حذف"
        onConfirm={() => {
          confirmState.onConfirm?.();
          setConfirmState({ open: false });
        }}
        onCancel={() => setConfirmState({ open: false })}
      />
    </div>
  );
};

export default CitizenReports;
