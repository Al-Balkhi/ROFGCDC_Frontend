import { useEffect, useRef } from 'react';
import FormInput from './FormInput';

const LandfillSidePanel = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  editingLandfill,
  formData,
  errors,
  handleChange,
  municipalities,
  handleMunicipalityToggle,
}) => {
  const panelRef = useRef(null);

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
            {editingLandfill ? 'تعديل مكب القمامة' : 'إضافة مكب قمامة جديد'}
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
            step="0.0001"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            error={errors.latitude}
            placeholder="33.40 إلى 33.60"
            min="33.40"
            max="33.60"
            required
          />

          <FormInput
            label="خط الطول"
            type="number"
            step="0.0001"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            error={errors.longitude}
            placeholder="36.10 إلى 36.40"
            min="36.10"
            max="36.40"
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">المديريات</label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
              {municipalities.length === 0 ? (
                <p className="text-sm text-gray-500">لا توجد مديريات متاحة</p>
              ) : (
                municipalities.map((municipality) => (
                  <label
                    key={municipality.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.municipality_ids?.includes(municipality.id) || false}
                      onChange={() => handleMunicipalityToggle(municipality.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{municipality.name}</span>
                  </label>
                ))
              )}
            </div>
            {errors.municipality_ids && (
              <p className="text-red-500 text-sm mt-1">{errors.municipality_ids}</p>
            )}
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
              {editingLandfill ? 'تحديث' : 'إنشاء'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LandfillSidePanel;

