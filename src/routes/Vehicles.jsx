import { useState, useEffect, useCallback } from 'react';
import { vehiclesAPI } from '../services/api';
import Table from '../components/Table';
import FormInput from '../components/FormInput';
import { useToast } from '../components/ToastContainer';
import VehicleSidePanel from '../components/VehicleSidePanel';

const Vehicles = () => {
  const { addToast } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    start_latitude: '',
    start_longitude: '',
  });
  const [errors, setErrors] = useState({});

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await vehiclesAPI.getVehicles();
      setVehicles(response.data.results || response.data);
    } catch {
      addToast('فشل تحميل الشاحنات', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const openSidePanel = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        name: vehicle.name || '',
        capacity: vehicle.capacity || '',
        start_latitude: vehicle.start_latitude || '',
        start_longitude: vehicle.start_longitude || '',
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        name: '',
        capacity: '',
        start_latitude: '',
        start_longitude: '',
      });
    }
    setErrors({});
    setSidePanelOpen(true);
  };

  const closeSidePanel = () => {
    setSidePanelOpen(false);
    setEditingVehicle(null);
    setFormData({
      name: '',
      capacity: '',
      start_latitude: '',
      start_longitude: '',
    });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'الاسم مطلوب';
    }
    if (!formData.capacity) {
      newErrors.capacity = 'السعة مطلوبة';
    } else if (isNaN(formData.capacity) || formData.capacity < 1) {
      newErrors.capacity = 'السعة يجب أن تكون رقم موجب';
    }
    if (!formData.start_latitude) {
      newErrors.start_latitude = 'خط العرض مطلوب';
    } else if (isNaN(formData.start_latitude) || formData.start_latitude < 33.40 || formData.start_latitude > 33.60) {
      newErrors.start_latitude = 'خط العرض يجب أن يكون بين 33.40 و 33.60 (حدود مدينة دمشق)';
    }
    if (!formData.start_longitude) {
      newErrors.start_longitude = 'خط الطول مطلوب';
    } else if (isNaN(formData.start_longitude) || formData.start_longitude < 36.10 || formData.start_longitude > 36.40) {
      newErrors.start_longitude = 'خط الطول يجب أن يكون بين 36.10 و 36.40 (حدود مدينة دمشق)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const submitData = {
        name: formData.name,
        capacity: parseInt(formData.capacity),
        start_latitude: parseFloat(formData.start_latitude),
        start_longitude: parseFloat(formData.start_longitude),
      };

      if (editingVehicle) {
        await vehiclesAPI.updateVehicle(editingVehicle.id, submitData);
        addToast('تم تحديث الشاحنة بنجاح', 'success');
      } else {
        await vehiclesAPI.createVehicle(submitData);
        addToast('تم إنشاء الشاحنة بنجاح', 'success');
      }
      closeSidePanel();
      fetchVehicles();
    } catch (error) {
      const errorData = error.response?.data || {};
      setErrors(errorData);
      addToast('فشل العملية', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الشاحنة؟')) return;
    try {
      await vehiclesAPI.deleteVehicle(id);
      addToast('تم حذف الشاحنة بنجاح', 'success');
      fetchVehicles();
    } catch {
      addToast('فشل حذف الشاحنة', 'error');
    }
  };

  const columns = [
    { key: 'name', label: 'الاسم' },
    { key: 'capacity', label: 'السعة' },
    { key: 'start_latitude', label: 'خط العرض' },
    { key: 'start_longitude', label: 'خط الطول' },
    {
      key: 'actions',
      label: 'الإجراءات',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => openSidePanel(row)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            تعديل
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            حذف
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">إدارة الشاحنات</h1>
        <button
          onClick={() => openSidePanel()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          إضافة شاحنة
        </button>
      </div>

      <Table columns={columns} data={vehicles} loading={loading} />

      <VehicleSidePanel
        isOpen={sidePanelOpen}
        onClose={closeSidePanel}
        onSubmit={handleSubmit}
        loading={loading}
        editingVehicle={editingVehicle}
        formData={formData}
        errors={errors}
        handleChange={handleChange}
      />
    </div>
  );
};

export default Vehicles;

