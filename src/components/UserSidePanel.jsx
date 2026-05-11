import React, { useEffect, useRef } from "react";
import useAuthStore from "../store/authStore";

const WorkScheduleDay = ({ day, data, onChange }) => (
  <div className={`flex items-center gap-2 p-3 rounded-lg border ${data.enabled ? "bg-white border-gray-200" : "bg-gray-50 border-gray-200"}`}>
    <button
      type="button"
      onClick={() => onChange(day.key, "enabled", !data.enabled)}
      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
        data.enabled
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-red-100 text-red-700 hover:bg-red-200"
      }`}
    >
      {data.enabled ? "مفعل" : "معطل"}
    </button>

    <span className={`font-medium min-w-[60px] ${data.enabled ? "text-gray-800" : "text-gray-400"}`}>
      {day.label}
    </span>

    <div className="flex items-center gap-1 flex-1">
      <input
        type="time"
        value={data.start_time}
        onChange={(e) => onChange(day.key, "start_time", e.target.value)}
        disabled={!data.enabled}
        className="w-full px-2 py-1 text-sm border rounded disabled:bg-gray-100 disabled:text-gray-400"
      />
      <span className="text-gray-400">-</span>
      <input
        type="time"
        value={data.end_time}
        onChange={(e) => onChange(day.key, "end_time", e.target.value)}
        disabled={!data.enabled}
        className="w-full px-2 py-1 text-sm border rounded disabled:bg-gray-100 disabled:text-gray-400"
      />
    </div>
  </div>
);

const UserSidePanel = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  municipalities = [],
  editingUser,
  formData,
  errors,
  handleChange,
  handleImageChange,
  handleWorkScheduleChange,
  days = [],
}) => {
  const panelRef = useRef();
  const currentUser = useAuthStore((state) => state.user);

  // إغلاق عند الضغط خارج اللوحة
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div
      className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      } z-50 flex justify-end`}
    >
      <div
        ref={panelRef}
        className={`
          w-full max-w-md h-full bg-white shadow-xl p-6 overflow-y-auto
          transition-transform duration-300 
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {editingUser ? "تعديل المستخدم" : "إضافة مستخدم جديد"}
          </h2>

          <button onClick={onClose} className="text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={onSubmit}>
          {!editingUser && (
            <div className="mb-4">
              <label className="block mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>
          )}

          <div className="mb-4">
            <label className="block mb-1">اسم المستخدم</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
            />
            {errors.username && (
              <p className="text-red-500 text-sm">{errors.username}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block mb-1">الدور</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="driver">سائق</option>
              <option value="planner">مخطط</option>
              {currentUser?.is_superuser && <option value="admin">مدير</option>}
            </select>
          </div>

          {formData.role === "driver" && (
            <div className="mb-4">
              <label className="block mb-1">البلدية التابع لها السائق</label>
              <select
                name="municipality_id"
                value={formData.municipality_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">-- اختر البلدية --</option>
                {municipalities.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-4">
            <label className="block mb-1">رقم الهاتف</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          {/* الصورة */}
          <div className="mb-4">
            <label className="block mb-1">الصورة الشخصية</label>
            <input type="file" onChange={(e) => handleImageChange(e.target.files[0])} />
          </div>

          {/* جدول أعمال السائق */}
          {formData.role === "driver" && (
            <div className="mb-4">
              <label className="block mb-2 font-medium text-gray-700">جدول العمل</label>
              <div className="space-y-2">
                {days.map((day) => (
                  <WorkScheduleDay
                    key={day.key}
                    day={day}
                    data={formData.work_schedule?.[day.key] || { enabled: false, start_time: "08:00", end_time: "17:00" }}
                    onChange={handleWorkScheduleChange}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                انقر على "مفعل/معطل" لتحديد أيام العمل والإجازات
              </p>
            </div>
          )}

          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 py-2 rounded-lg"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
            >
              {editingUser ? "تحديث" : "إنشاء"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserSidePanel;
