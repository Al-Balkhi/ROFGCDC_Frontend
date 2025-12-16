import { useEffect, useRef } from 'react';
import FormInput from './FormInput';

const PlanSideBar = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  editingPlan,
  formData,
  errors,
  handleChange,
  municipalities = [],
  vehicles = [],
  bins = [],
  landfills = [],
  onDelete,
  toggleBin,
}) => {
  const panelRef = useRef(null);
  const selectedMunicipality = municipalities.find(
    (m) => String(m.id) === String(formData.municipality_id)
  );

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      } z-50 flex justify-end`}
    >
      <div
        ref={panelRef}
        className={`w-full max-w-xl h-full bg-white shadow-xl p-6 overflow-y-auto transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {editingPlan ? 'تعديل خطة الجمع' : 'إضافة خطة جمع'}
          </h2>
          <button onClick={onClose} className="text-gray-600 text-xl">
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <FormInput
            label="اسم الخطة (اختياري)"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="مثال: خطة 1 – منطقة المزة"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">البلدية</label>
              <select
                name="municipality_id"
                value={formData.municipality_id}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">اختر البلدية</option>
                {municipalities.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {errors.municipality && (
                <p className="text-red-600 text-sm mt-1">{errors.municipality}</p>
              )}
            </div>

            <FormInput
              label="تاريخ الجمع"
              type="date"
              name="collection_date"
              value={formData.collection_date}
              onChange={handleChange}
              error={errors.collection_date}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">حدد نقطة البداية (اختياري)</label>
            <select
              name="start_landfill_id"
              value={formData.start_landfill_id}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">بدون تحديد</option>
              
              <option value="municipality">
                {selectedMunicipality
                  ? `مديرية ${selectedMunicipality.name}`
                  : 'استخدام المديرية المختارة'}
              </option>
              <option value="landfills" disabled className="bg-gray-100">المكبات</option>
              {landfills.map((lf) => (
                <option key={lf.id} value={lf.id}>
                  {lf.name}
                </option>
              ))}
            </select>
            {errors.start_landfill && (
              <p className="text-red-600 text-sm mt-1">{errors.start_landfill}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المركبة</label>
              <select
                name="vehicle_id"
                value={formData.vehicle_id}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">اختر المركبة</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} (السعة: {v.capacity})
                  </option>
                ))}
              </select>
              {errors.vehicle && (
                <p className="text-red-600 text-sm mt-1">{errors.vehicle}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الحاويات</label>
            <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
              {bins.length === 0 && (
                <p className="text-gray-500 text-sm">لا توجد حاويات متاحة.</p>
              )}
              {bins.map((bin) => (
                <label key={bin.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.bin_ids.includes(bin.id)}
                    onChange={() => toggleBin(bin.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span>
                    {bin.name} ({bin.latitude}, {bin.longitude}) - السعة: {bin.capacity}
                  </span>
                </label>
              ))}
            </div>
            {errors.bins && <p className="text-red-600 text-sm mt-1">{errors.bins}</p>}
          </div>

          <div className="flex gap-2 mt-6">
            {editingPlan && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg"
              >
                حذف
              </button>
            )}
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
              {editingPlan ? 'تحديث' : 'إنشاء'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlanSideBar;

