import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { BASE_API_URL } from "../constants/labels";
import { useNotifications } from "../hooks/useNotifications";

const Header = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  // All notification logic (REST fetch + WebSocket + reconnect) lives in this hook
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications(user);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getAvatarUrl = () => {
    if (user?.image_profile) {
      // If it's already a full URL, return it
      if (user.image_profile.startsWith("http")) {
        return user.image_profile;
      }
      // Otherwise, construct the full URL using the shared constant
      return `${BASE_API_URL}${user.image_profile.startsWith("/") ? "" : "/"}${user.image_profile}`;
    }
    return null;
  };

  const getInitials = () => {
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <header className="bg-white shadow-md h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      {/* Left side - Menu button (mobile) */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="فتح القائمة"
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
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Right side - Notifications & Profile dropdown */}
      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 relative"
            aria-label="قائمة الإشعارات"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center p-1 w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-96 flex flex-col">
              <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                <span className="font-semibold text-gray-700">الإشعارات</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    تحديد الكل كمقروء
                  </button>
                )}
              </div>
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-gray-500 text-center">
                    لا توجد إشعارات
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 border-b border-gray-50 text-right cursor-pointer hover:bg-gray-50 ${!notif.is_read ? "bg-blue-50/50" : ""}`}
                      onClick={async () => {
                        if (!notif.is_read) {
                          markAsRead(notif.id);
                        }
                        if (
                          notif.type === "container_request" &&
                          notif.related_id
                        ) {
                          setNotificationsOpen(false);
                          navigate(
                            `/dashboard/admin/bin-requests?id=${notif.related_id}`,
                          );
                        } else if (
                          notif.type === "citizen_report" &&
                          notif.related_id
                        ) {
                          setNotificationsOpen(false);
                          navigate(
                            `/dashboard/planner/citizen-reports?id=${notif.related_id}`,
                          );
                        } else if (
                          notif.type === "plan_created" &&
                          notif.related_id
                        ) {
                          setNotificationsOpen(false);
                          navigate(
                            `/dashboard/planner/scenarios?id=${notif.related_id}`,
                          );
                        }
                      }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={`text-sm ${!notif.is_read ? "font-semibold text-gray-900" : "text-gray-700"}`}
                        >
                          {notif.title}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-gray-400 mt-2 block">
                        {new Date(notif.created_at).toLocaleString("ar-SA")}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2 border-t border-gray-100 text-center bg-gray-50 rounded-b-lg mt-1">
                <button
                  onClick={() => {
                    setNotificationsOpen(false);
                    navigate("/notifications");
                  }}
                  className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  عرض جميع الإشعارات &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="قائمة المستخدم"
            aria-expanded={dropdownOpen}
          >
            {getAvatarUrl() ? (
              <img
                src={getAvatarUrl()}
                alt={user?.username || "المستخدم"}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                {getInitials()}
              </div>
            )}
            <span className="hidden md:block text-sm font-medium text-gray-700">
              {user?.username || user?.email || "المستخدم"}
            </span>
            <svg
              className={`w-4 h-4 text-gray-600 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate("/profile");
                }}
                className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none"
              >
                تعديل الملف الشخصي
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  handleLogout();
                }}
                className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-gray-100 focus:outline-none"
              >
                تسجيل الخروج
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
