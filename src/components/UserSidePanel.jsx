import React, { useEffect, useRef } from "react";

const UserSidePanel = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  editingUser,
  formData,
  errors,
  handleChange,
  handleImageChange,
}) => {
  const panelRef = useRef();

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
              <option value="admin">مدير</option>
            </select>
          </div>

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
