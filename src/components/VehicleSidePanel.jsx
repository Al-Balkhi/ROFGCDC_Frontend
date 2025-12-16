import { useEffect, useRef } from 'react';
import FormInput from './FormInput';

const VehicleSidePanel = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  editingVehicle,
  formData,
  errors,
  handleChange,
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
            {editingVehicle ? 'تعديل الشاحنة' : 'إضافة شاحنة جديدة'}
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
            label="السعة"
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            error={errors.capacity}
            min="1"
            required
          />

          <FormInput
            label="خط العرض"
            type="number"
            name="start_latitude"
            value={formData.start_latitude}
            onChange={handleChange}
            error={errors.start_latitude}
            placeholder="33.40 إلى 33.60"
            min="33.40"
            max="33.60"
            step="0.0001"
            required
          />

          <FormInput
            label="خط الطول"
            type="number"
            name="start_longitude"
            value={formData.start_longitude}
            onChange={handleChange}
            error={errors.start_longitude}
            placeholder="36.10 إلى 36.40"
            min="36.10"
            max="36.40"
            step="0.0001"
            required
          />

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
              {editingVehicle ? 'تحديث' : 'إنشاء'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleSidePanel;


