import React, { useRef, useEffect } from "react";

const UserFiltersDropdown = ({
  selectedRoles,
  setSelectedRoles,
  selectedStates,
  setSelectedStates,
  selectedArchived,
  setSelectedArchived,
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
  
    // استخدم pointerdown مع capture
    document.addEventListener("pointerdown", handleClickOutside, true);
  
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside, true);
    };
  }, [onClose]);   // إضافة onClose للمصفوفة لتجنب تحذيرات الـ linter

  const toggle = (list, setter, value) => {
    setter(
      list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value]
    );
  };

  return (
    <div
      ref={ref}
      className="absolute top-12 left-0 w-72 bg-white border rounded-lg shadow-xl z-50 p-4 animate-fade-in-down"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h3 className="font-bold text-gray-700">تصفية المستخدمين</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">✕</button>
      </div>

      {/* الأدوار (Roles) */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">الأدوار</label>
        <div className="flex flex-col gap-2">
          {['admin', 'planner', 'driver'].map((role) => (
            <label key={role} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                checked={selectedRoles.includes(role)}
                onChange={() => toggle(selectedRoles, setSelectedRoles, role)}
              />
              <span className="text-sm text-gray-700">
                {role === 'admin' ? 'مدير' : role === 'planner' ? 'مخطط' : 'سائق'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* الحالة (Active/Inactive) */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">حالة الحساب</label>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => {
               // إذا كان "نشط" محدداً، نزيله، وإلا نضيفه (Toggle Logic simplified for buttons if needed, or keep checkboxes)
               // هنا نحافظ على منطق الـ Checkbox الخاص بك لكن بشكل أزرار لتوحيد الشكل
               // أو نبقيه checkboxes كما في التصميم السابق إذا كنت تفضل التحديد المتعدد الواضح.
               // سأبقيه Checkboxes ليتوافق مع منطقك (Select Multiple States)
            }}
            className="hidden" // Placeholder logic
          />
          
          <label className={`flex-1 py-1 text-sm rounded-md transition-all text-center cursor-pointer ${selectedStates.includes(true) ? 'bg-white text-green-600 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
            <input type="checkbox" className="hidden" checked={selectedStates.includes(true)} onChange={() => toggle(selectedStates, setSelectedStates, true)} />
            نشط
          </label>
          
          <label className={`flex-1 py-1 text-sm rounded-md transition-all text-center cursor-pointer ${selectedStates.includes(false) ? 'bg-white text-red-600 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
            <input type="checkbox" className="hidden" checked={selectedStates.includes(false)} onChange={() => toggle(selectedStates, setSelectedStates, false)} />
            غير نشط
          </label>
        </div>
      </div>

      {/* الأرشفة (Archived) */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">الأرشيف</label>
        <label className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${selectedArchived.includes(true) ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
          <span className="text-sm text-gray-700">عرض المؤرشفين فقط</span>
          <input
            type="checkbox"
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            checked={selectedArchived.includes(true)}
            onChange={() => toggle(selectedArchived, setSelectedArchived, true)}
          />
        </label>
      </div>

      {/* أزرار التحكم */}
      <div className="flex gap-3 mt-6 pt-2 border-t">
        <button
          onClick={onReset}
          className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          إعادة تعيين
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          تم
        </button>
      </div>
    </div>
  );
};

export default UserFiltersDropdown;