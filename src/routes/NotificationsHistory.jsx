import React, { useState, useEffect, useCallback } from "react";
import { notificationsAPI } from "../services/api";
import { useNavigate } from "react-router-dom";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";

// Page size must match the backend's default PAGE_SIZE
const PAGE_SIZE = 10;

const NotificationsHistory = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'unread' | 'read'

  // ConfirmDialog state
  const [confirmState, setConfirmState] = useState({ open: false });

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      if (statusFilter === "unread") params.is_read = "False";
      else if (statusFilter === "read") params.is_read = "True";

      const res = await notificationsAPI.getNotifications(params);

      if (res.data.results) {
        setNotifications(res.data.results);
        setTotalCount(res.data.count ?? 0);
      } else {
        setNotifications(res.data);
        setTotalCount(res.data.length ?? 0);
      }
    } catch (err) {
      console.error(err);
      setError("فشل جلب سجل الإشعارات.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      fetchHistory();
    } catch (error) {
      console.error("Error marking as read", error);
    }
  };

  const handleClearAll = () => {
    setConfirmState({
      open: true,
      message: "هل أنت متأكد من مسح جميع الإشعارات نهائياً؟",
      onConfirm: async () => {
        try {
          await notificationsAPI.clearAll();
          setPage(1);
          fetchHistory();
        } catch (error) {
          console.error("Error clearing notifications", error);
          setError("فشل مسح الإشعارات.");
        }
      },
    });
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) handleMarkAsRead(notif.id);

    if (notif.type === "container_request" && notif.related_id) {
      navigate(`/dashboard/admin/bin-requests?id=${notif.related_id}`);
    }
  };

  const changeFilter = (filter) => {
    setStatusFilter(filter);
    setPage(1);
  };

  return (
    <div className="w-full space-y-6" dir="rtl">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">سجل الإشعارات</h1>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            className="px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium border border-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            مسح السجل
          </button>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {["all", "unread", "read"].map((f) => (
              <button
                key={f}
                onClick={() => changeFilter(f)}
                className={`px-4 py-2 text-sm rounded-md transition-all ${
                  statusFilter === f
                    ? "bg-white text-blue-600 shadow-sm font-semibold"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {f === "all" ? "الكل" : f === "unread" ? "غير مقروء" : "مقروء"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">جاري التحميل...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-500">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            لا توجد إشعارات لعرضها
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-5 transition-colors cursor-pointer ${
                  !notif.is_read ? "bg-blue-50/40" : "hover:bg-gray-50"
                }`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3
                    className={`font-semibold text-lg ${
                      !notif.is_read ? "text-gray-900" : "text-gray-700"
                    }`}
                  >
                    {notif.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md shadow-sm border border-gray-200">
                      {new Date(notif.created_at).toLocaleString("ar-SA")}
                    </span>
                    {!notif.is_read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-300"></span>
                    )}
                  </div>
                </div>
                <p
                  className={`text-sm leading-relaxed ${
                    !notif.is_read ? "text-gray-800" : "text-gray-500"
                  }`}
                >
                  {notif.message}
                </p>
                {!notif.is_read && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif.id);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold transition-colors bg-white border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg"
                    >
                      تحديد كمقروء ✓
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shared Pagination component */}
      <Pagination
        currentPage={page}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        confirmLabel="مسح الكل"
        onConfirm={() => {
          confirmState.onConfirm?.();
          setConfirmState({ open: false });
        }}
        onCancel={() => setConfirmState({ open: false })}
      />
    </div>
  );
};

export default NotificationsHistory;
