import { useState, useEffect } from "react";
import { driverReportsAPI } from "../services/api";

/**
 * AssignDriverModal
 * Opens when a planner clicks "إسناد لسائق" on a solved scenario.
 *
 * Sends { scenario: scenarioId, driver: selectedDriverId } to match the
 * DriverTaskAssignSerializer field names (ForeignKey PK, no _id suffix).
 */
const AssignDriverModal = ({ isOpen, onClose, scenarioId, onSuccess }) => {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSelectedDriver("");
      fetchDrivers();
    }
  }, [isOpen]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await driverReportsAPI.getDrivers();
      const list = res.data ?? [];
      setDrivers(list);
      if (list.length > 0) {
        setSelectedDriver(list[0].id);
      }
    } catch (err) {
      console.error(err);
      setError("فشل في تحميل قائمة السائقين");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedDriver) {
      setError("يرجى اختيار سائق");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      // Backend DriverTaskAssignSerializer expects 'scenario' and 'driver' (FK PKs)
      await driverReportsAPI.assignTask({
        scenario: scenarioId,
        driver: selectedDriver,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        "فشل في إسناد المهمة";
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedDriverObj = drivers.find((d) => d.id === selectedDriver);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <h2 className="text-xl font-bold text-white">إسناد الخطة إلى سائق</h2>
          <p className="text-blue-100 text-sm mt-1">اختر سائقاً من قائمة السائقين المتاحين في البلدية</p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg text-sm">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
              جاري تحميل قائمة السائقين...
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="font-medium">لا يوجد سائقون متاحون في هذه البلدية</p>
              <p className="text-sm text-gray-400 mt-1">يرجى إضافة حسابات سائقين أولاً</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                السائق المُختار
              </label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                disabled={submitting}
              >
                <option value="" disabled>-- الرجاء الاختيار --</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name || driver.username}
                    {driver.email ? ` — ${driver.email}` : ""}
                  </option>
                ))}
              </select>

              {/* Selected driver info card */}
              {selectedDriverObj && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {(selectedDriverObj.name || selectedDriverObj.username || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {selectedDriverObj.name || selectedDriverObj.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{selectedDriverObj.email}</p>
                  </div>
                  <div className="mr-auto shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                      نشط
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            disabled={submitting}
          >
            إلغاء
          </button>
          <button
            onClick={handleAssign}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2 shadow-sm"
            disabled={submitting || loading || drivers.length === 0}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري الإسناد...
              </>
            ) : (
              "إسناد المهمة"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignDriverModal;
