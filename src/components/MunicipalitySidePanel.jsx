import { useEffect, useRef, useState } from 'react';
import FormInput from './FormInput';
import LocationPickerModal from './LocationPickerModal';

const MunicipalitySidePanel = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  editingMunicipality,
  formData,
  errors,
  handleChange,
  planners = [],
}) => {
  const panelRef = useRef(null);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const handleLocationSelect = (lat, lng) => {
    handleChange({ target: { name: 'hq_latitude', value: lat } });
    handleChange({ target: { name: 'hq_longitude', value: lng } });
    setShowMapPicker(false);
  };

  // Close when clicking outside the panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMapPicker) return;

      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, showMapPicker]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        } z-50 flex justify-end`}
      >
        <div
          ref={panelRef}
          className={`w-full max-w-md h-full bg-white shadow-xl p-6 overflow-y-auto transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {editingMunicipality ? 'تعديل المديرية' : 'إضافة مديرية جديدة'}
            </h2>
            <button onClick={onClose} className="text-gray-600 text-xl">
              ×
            </button>
          </div>

          <form onSubmit={onSubmit}>
            <FormInput
              label="الاسم"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />

            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowMapPicker(true)}
                className="w-full bg-indigo-50 text-indigo-700 py-2 rounded-lg border border-indigo-200 hover:bg-indigo-100 flex items-center justify-center gap-2 transition-colors"
              >
                📍 حدد الموقع على الخريطة
              </button>
              {formData.hq_latitude && formData.hq_longitude ? (
                <div className="mt-2 text-sm text-gray-600 text-center">
                  تم تحديد الموقع: {Number(formData.hq_latitude).toFixed(5)}, {Number(formData.hq_longitude).toFixed(5)}
                </div>
              ) : (
                <div className="mt-2 text-sm text-red-500 text-center">
                  لم يتم تحديد الموقع بعد *
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block mb-1 text-gray-700 font-medium text-sm">المخطط المسؤول عن المديرية</label>
              <select
                name="planner_id"
                value={formData.planner_id || ""}
                onChange={handleChange}
                // تمت إزالة خاصية size هنا ليصبح قائمة منسدلة عادية
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white"
              >
                <option value="">-- اختر المخطط --</option>
                {planners.map((planner) => (
                  <option key={planner.id} value={planner.id}>
                    {planner.username || planner.email}
                  </option>
                ))}
              </select>
              
              {errors.planner_id && (
                <p className="text-red-500 text-sm mt-1">{errors.planner_id}</p>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
              >
                {editingMunicipality ? 'تحديث' : 'إنشاء'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <LocationPickerModal
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onConfirm={handleLocationSelect}
        initialLat={formData.hq_latitude}
        initialLng={formData.hq_longitude}
        title="تحديد موقع المديرية"
      />
    </>
  );
};

export default MunicipalitySidePanel;