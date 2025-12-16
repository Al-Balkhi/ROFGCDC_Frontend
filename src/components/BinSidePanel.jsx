import { useEffect, useRef, useState } from 'react';
import FormInput from './FormInput';
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

  // Close when clicking outside the panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

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
            label="خط العرض"
            type="number"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            error={errors.latitude}
            placeholder="33.40 إلى 33.60"
            min="33.40"
            max="33.60"
            step="0.0001"
            required
          />

          <FormInput
            label="خط الطول"
            type="number"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            error={errors.longitude}
            placeholder="36.10 إلى 36.40"
            min="36.10"
            max="36.40"
            step="0.0001"
            required
          />

          <FormInput
            label="السعة"
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            error={errors.capacity}
            min="1"
            required
          />

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
  );
};

export default BinSidePanel;


