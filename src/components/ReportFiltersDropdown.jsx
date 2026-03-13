import React, { useRef, useEffect } from "react";

const ReportFiltersDropdown = ({
  filterStatus,
  setFilterStatus,
  filterType,
  setFilterType,
  filterRecency,
  setFilterRecency,
  filterImportance,
  setFilterImportance,
  onReset,
  onClose,
}) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener("pointerdown", handleClickOutside, true);

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside, true);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-12 left-0 w-72 bg-white border rounded-lg shadow-xl z-50 p-4 animate-fade-in-down"
      dir="rtl"
    >
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h3 className="font-bold text-gray-700">تصفية البلاغات</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-red-500 transition-colors text-lg"
        >
          ✕
        </button>
      </div>

      {/* حالة الطلب */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
          حالة الطلب
        </label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer"
        >
          <option value="all">الكل</option>
          <option value="pending">قيد الانتظار</option>
          <option value="processing">قيد المعالجة</option>
          <option value="processed">معالج</option>
        </select>
      </div>

      {/* النوع */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
          النوع
        </label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer"
        >
          <option value="all">الكل</option>
          <option value="container_full">امتلاء الحاوية</option>
          <option value="no_container">لا توجد حاوية</option>
        </select>
      </div>

      {/* الوقت (تم تحويله لأزرار تفاعلية) */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
          الوقت
        </label>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <label
            className={`flex-1 py-1.5 text-sm rounded-md transition-all text-center cursor-pointer ${
              filterRecency === "newest"
                ? "bg-white text-blue-600 shadow-sm font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <input
              type="radio"
              className="hidden"
              name="recency"
              value="newest"
              checked={filterRecency === "newest"}
              onChange={(e) => setFilterRecency(e.target.value)}
            />
            الأحدث
          </label>
          <label
            className={`flex-1 py-1.5 text-sm rounded-md transition-all text-center cursor-pointer ${
              filterRecency === "oldest"
                ? "bg-white text-blue-600 shadow-sm font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <input
              type="radio"
              className="hidden"
              name="recency"
              value="oldest"
              checked={filterRecency === "oldest"}
              onChange={(e) => setFilterRecency(e.target.value)}
            />
            الأقدم
          </label>
        </div>
      </div>

      {/* الأهمية (تم تحويله لأزرار تفاعلية) */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
          الأهمية
        </label>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <label
            className={`flex-1 py-1.5 text-sm rounded-md transition-all text-center cursor-pointer ${
              filterImportance === "highest"
                ? "bg-white text-red-600 shadow-sm font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <input
              type="radio"
              className="hidden"
              name="importance"
              value="highest"
              checked={filterImportance === "highest"}
              onChange={(e) => setFilterImportance(e.target.value)}
            />
            الأعلى
          </label>
          <label
            className={`flex-1 py-1.5 text-sm rounded-md transition-all text-center cursor-pointer ${
              filterImportance === "lowest"
                ? "bg-white text-blue-600 shadow-sm font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <input
              type="radio"
              className="hidden"
              name="importance"
              value="lowest"
              checked={filterImportance === "lowest"}
              onChange={(e) => setFilterImportance(e.target.value)}
            />
            الأقل
          </label>
        </div>
      </div>

      {/* أزرار التحكم السفلية */}
      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
        <button
          onClick={onReset}
          className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
        >
          إعادة تعيين
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium"
        >
          تم
        </button>
      </div>
    </div>
  );
};

export default ReportFiltersDropdown;