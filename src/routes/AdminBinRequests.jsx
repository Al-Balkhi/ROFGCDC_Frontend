import React, { useEffect, useState, useCallback } from "react";
import { binRequestsAPI } from "../services/api";
import { fetchAddressFromCoordinates } from "../utils/geocoding";
import { useToast } from "../components/ToastContainer";
import { useSearchParams } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import { useScrollIntoView } from "../hooks/useScrollIntoView";

const AdminBinRequests = () => {
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("id");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  // ConfirmDialog state
  const [confirmState, setConfirmState] = useState({ open: false });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(""); // 'approve' or 'reject'
  const [rejectReason, setRejectReason] = useState("");
  const [newBinCapacity, setNewBinCapacity] = useState("1000");
  const [newBinName, setNewBinName] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await binRequestsAPI.getRequests({ page });
      if (response.data.results) {
        setRequests(response.data.results);
        setTotalCount(response.data.count ?? 0);
      } else {
        setRequests(response.data);
        setTotalCount((response.data ?? []).length);
      }
    } catch (error) {
      console.error(error);
      addToast("فشل تحميل الطلبات", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast, page]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests, page]);

  const handleDeleteRequest = (id) => {
    setConfirmState({
      open: true,
      message: "هل أنت متأكد من حذف هذا الطلب من السجل نهائياً؟",
      onConfirm: async () => {
        try {
          await binRequestsAPI.deleteRequest(id);
          addToast("تم حذف الطلب بنجاح", "success");
          fetchRequests();
        } catch (error) {
          console.error(error);
          addToast("فشل حذف الطلب", "error");
        }
      },
    });
  };

  // Scroll to highlighted row when data loads (from deep-link ?id=X)
  useScrollIntoView(highlightId, requests, { prefix: "request" });

  const handleActionSubmit = async () => {
    try {
      if (actionType === "approve") {
        const payload = {};
        if (selectedRequest.request_type === "new_bin") {
          payload.capacity = parseInt(newBinCapacity);
          payload.name =
            newBinName || `Bin for Report ${selectedRequest.report}`;
            
          const lat = selectedRequest.report_details?.latitude;
          const lng = selectedRequest.report_details?.longitude;
          if (lat && lng) {
            const address = await fetchAddressFromCoordinates(lat, lng);
            if (address) {
              payload.address = address;
            }
          }
        } else if (selectedRequest.request_type === "resize_bin") {
          payload.capacity = parseInt(newBinCapacity);
        }

        await binRequestsAPI.approveRequest(selectedRequest.id, payload);
        addToast("تمت الموافقة على الطلب بنجاح", "success");
      } else if (actionType === "reject") {
        if (!rejectReason) {
          addToast("الرجاء كتابة سبب الرفض", "error");
          return;
        }
        await binRequestsAPI.rejectRequest(selectedRequest.id, {
          reason: rejectReason,
        });
        addToast("تم رفض الطلب وتحويله لخطة جمع", "success");
      }

      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error(error);
      addToast(
        error.response?.data?.error || "حدث خطأ عند تنفيذ الإجراء",
        "error",
      );
    }
  };

  const openActionModal = (req, type) => {
    setSelectedRequest(req);
    setActionType(type);
    setRejectReason("");

    // Proactively fill values from Planner's request
    if (req.requested_capacity) {
      setNewBinCapacity(req.requested_capacity.toString());
    } else if (req.target_bin_details && req.request_type === "resize_bin") {
      setNewBinCapacity(req.target_bin_details.capacity.toString());
    } else {
      setNewBinCapacity("1100");
    }

    if (type === "approve" && req.request_type === "new_bin") {
      setNewBinName(`حاوية جديدة - بلاغ ${req.report}`);
    }
  };

  return (
    <div className="w-full space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">الطلبات</h1>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">جاري التحميل...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
          {requests.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              لا توجد طلبات معلقة
            </div>
          ) : (
            <table className="w-full text-right border-collapse">
              <thead className="bg-[#f8fafc] border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 w-12 text-center">
                    #
                  </th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 w-24 text-center">
                    رقم البلاغ
                  </th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700">
                    نوع الطلب
                  </th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700">
                    المُخطِط
                  </th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700">
                    تاريخ الطلب
                  </th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 text-center">
                    حالة الطلب
                  </th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 text-center">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req, index) => (
                  <tr
                    key={req.id}
                    id={`request-${req.id}`}
                    className={`transition-colors ${
                      highlightId == req.id
                        ? "bg-blue-50 shadow-inner ring-2 ring-blue-400 z-10 relative"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-400 text-center font-bold">
                      {(page - 1) * 10 + index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-center font-medium">
                      #{req.report}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-1 rounded-md text-xs font-semibold ${
                          req.request_type === "new_bin"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {req.request_type === "new_bin"
                          ? "طلب حاوية جديدة"
                          : "تغيير حجم حاوية"}
                      </span>
                      {req.target_bin_details && (
                        <div className="text-[10px] text-gray-500 mt-1">
                          الحاوية: {req.target_bin_details.name} (السعة:{" "}
                          {req.target_bin_details.capacity})
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {req.planner_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(req.created_at).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={req.status} variant="request" />
                    </td>
                    <td className="px-6 py-4 text-center h-full">
                      {req.status === "pending" ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => openActionModal(req, "approve")}
                            className="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded-md transition-colors"
                            title="موافقة"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              ></path>
                            </svg>
                          </button>
                          <button
                            onClick={() => openActionModal(req, "reject")}
                            className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-md transition-colors"
                            title="رفض"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              ></path>
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-gray-400 text-[11px] font-semibold">
                            تمت المعالجة
                          </span>
                          <button
                            onClick={() => handleDeleteRequest(req.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded text-xs transition-colors"
                            title="حذف من السجل"
                          >
                            حذف
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Shared Pagination component */}
          <Pagination
            currentPage={page}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
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

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3
                className={`text-lg font-semibold ${actionType === "approve" ? "text-green-700" : "text-red-700"}`}
              >
                {actionType === "approve"
                  ? "تأكيد الموافقة على الطلب"
                  : "رفض الطلب وتحويله لخطة جمع"}
              </h3>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800">
                <span className="font-semibold block mb-1">
                  تفاصيل البلاغ المُرفق:
                </span>
                الموقع: {selectedRequest.report_details?.latitude?.toFixed(4)},{" "}
                {selectedRequest.report_details?.longitude?.toFixed(4)}
                {selectedRequest.note && (
                  <div className="mt-2 text-xs italic">
                    ملاحظة المخطط: "{selectedRequest.note}"
                  </div>
                )}
              </div>

              {actionType === "approve" && (
                <div className="space-y-4">
                  {selectedRequest.request_type === "new_bin" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        اسم الحاوية الجديدة
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                        value={newBinName}
                        onChange={(e) => setNewBinName(e.target.value)}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      السعة (لتر)
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                      value={newBinCapacity}
                      onChange={(e) => setNewBinCapacity(e.target.value)}
                    >
                      <option value="240">240</option>
                      <option value="660">660</option>
                      <option value="1100">1100</option>
                    </select>
                  </div>
                </div>
              )}

              {actionType === "reject" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    سبب الرفض (إلزامي للتعويض)
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="مثال: يرجى إرسال خطة جمع فورية بدلاً من وضع حاوية جديدة..."
                  />
                  <p className="text-xs text-red-500 mt-2">
                    * الموافقة على الرفض ستقوم آلياً بإنشاء خطة جمع فورية للمخطط
                    كبديل.
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleActionSubmit}
                  disabled={actionType === "reject" && !rejectReason}
                  className={`px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white focus:outline-none disabled:bg-gray-400 ${
                    actionType === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  تأكيد {actionType === "approve" ? "الموافقة" : "الرفض"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBinRequests;
