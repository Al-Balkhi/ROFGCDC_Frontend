import { useEffect, useRef, useState } from 'react';
import FormInput from './FormInput';
import LocationPickerModal from './LocationPickerModal';
import { fetchAddressFromCoordinates } from '../utils/geocoding';
import { municipalitiesAPI } from '../services/api';

const BinSidePanel = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  editingBin,
  formData,
  errors,
  handleChange,
}) => {
  const panelRef = useRef(null);
  const [municipalities, setMunicipalities] = useState([]);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const handleLocationSelect = async (lat, lng) => {
    handleChange({ target: { name: 'latitude', value: lat } });
    handleChange({ target: { name: 'longitude', value: lng } });
    setShowMapPicker(false);

    handleChange({ target: { name: 'address', value: 'جاري جلب العنوان...' } });
    const shortAddress = await fetchAddressFromCoordinates(lat, lng);
    handleChange({ target: { name: 'address', value: shortAddress } });
  };

  // Close when clicking outside the panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the map picker is open, do not close the panel on outside clicks
      if (showMapPicker) return;

      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, showMapPicker]);

  // Fetch municipalities for admin to assign bins
  useEffect(() => {
    const fetchMunicipalities = async () => {
      setLoadingMunicipalities(true);
      try {
        const res = await municipalitiesAPI.getMunicipalities();
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setMunicipalities(data);
      } catch {
        // Silent failure; form will just not show options
        setMunicipalities([]);
      } finally {
        setLoadingMunicipalities(false);
      }
    };
    if (isOpen) {
      fetchMunicipalities();
    }
  }, [isOpen]);

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
              {editingBin ? 'تعديل الحاوية' : 'إضافة حاوية جديدة'}
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

            <FormInput
              label="العنوان"
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              error={errors.address}
            />

            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowMapPicker(true)}
                className="w-full bg-indigo-50 text-indigo-700 py-2 rounded-lg border border-indigo-200 hover:bg-indigo-100 flex items-center justify-center gap-2"
              >
                حدد الموقع على الخريطة
              </button>
              {formData.latitude && formData.longitude ? (
                <div className="mt-2 text-sm text-gray-600 text-center">
                  تم تحديد الموقع: {Number(formData.latitude).toFixed(5)}, {Number(formData.longitude).toFixed(5)}
                </div>
              ) : (
                <div className="mt-2 text-sm text-red-500 text-center">
                  لم يتم تحديد الموقع بعد *
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                السعة
              </label>
              <select
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="" disabled>اختر السعة (لتر)</option>
                <option value="240">240</option>
                <option value="660">660</option>
                <option value="1100">1100</option>
              </select>
              {errors.capacity && (
                <p className="text-red-600 text-sm mt-1">{errors.capacity}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <FormInput
                label="وقت البداية (اختياري)"
                type="time"
                name="pickup_window_start"
                value={formData.pickup_window_start || ''}
                onChange={handleChange}
                error={errors.pickup_window_start}
              />
              <FormInput
                label="وقت النهاية (اختياري)"
                type="time"
                name="pickup_window_end"
                value={formData.pickup_window_end || ''}
                onChange={handleChange}
                error={errors.pickup_window_end}
              />
            </div>
            {errors.pickup_window && (
              <p className="text-red-600 text-sm mt-1 -mt-2 mb-4">{errors.pickup_window}</p>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المديرية
              </label>
              <select
                name="municipality_id"
                value={formData.municipality_id || ''}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">
                  {loadingMunicipalities ? 'جاري تحميل المديريات...' : 'اختر المديريات'}
                </option>
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

            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">نشط</span>
              </label>
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
                {editingBin ? 'تحديث' : 'إنشاء'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <LocationPickerModal
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onConfirm={handleLocationSelect}
        initialLat={formData.latitude}
        initialLng={formData.longitude}
        title="تحديد موقع الحاوية"
      />
    </>
  );
};

export default BinSidePanel;
