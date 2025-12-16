import { useState, useEffect, useCallback } from 'react';
import { binsAPI } from '../services/api';
import Table from '../components/Table';
import FormInput from '../components/FormInput';
import { useToast } from '../components/ToastContainer';
import BinSidePanel from '../components/BinSidePanel';

const Bins = () => {
  const { addToast } = useToast();
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [editingBin, setEditingBin] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    capacity: '',
    is_active: true,
    municipality_id: '',
  });
  const [errors, setErrors] = useState({});

  const fetchBins = useCallback(async () => {
    setLoading(true);
    try {
      const response = await binsAPI.getBins();
      setBins(response.data.results || response.data);
    } catch {
      addToast('فشل تحميل الحاويات', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchBins();
  }, [fetchBins]);

  const openSidePanel = (bin = null) => {
    if (bin) {
      setEditingBin(bin);
      setFormData({
        name: bin.name || '',
        latitude: bin.latitude || '',
        longitude: bin.longitude || '',
        capacity: bin.capacity || '',
        is_active: bin.is_active !== undefined ? bin.is_active : true,
        municipality_id: bin.municipality?.id || '',
      });
    } else {
      setEditingBin(null);
      setFormData({
        name: '',
        latitude: '',
        longitude: '',
        capacity: '',
        is_active: true,
        municipality_id: '',
      });
    }
    setErrors({});
    setSidePanelOpen(true);
  };

  const closeSidePanel = () => {
    setSidePanelOpen(false);
    setEditingBin(null);
    setFormData({
      name: '',
      latitude: '',
      longitude: '',
      capacity: '',
      is_active: true,
      municipality_id: '',
    });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'الاسم مطلوب';
    }
    if (!formData.latitude) {
      newErrors.latitude = 'خط العرض مطلوب';
    } else if (isNaN(formData.latitude) || formData.latitude < 33.40 || formData.latitude > 33.60) {
      newErrors.latitude = 'خط العرض يجب أن يكون بين 33.40 و 33.60 (حدود مدينة دمشق)';
    }
    if (!formData.longitude) {
      newErrors.longitude = 'خط الطول مطلوب';
    } else if (isNaN(formData.longitude) || formData.longitude < 36.10 || formData.longitude > 36.40) {
      newErrors.longitude = 'خط الطول يجب أن يكون بين 36.10 و 36.40 (حدود مدينة دمشق)';
    }
    if (!formData.capacity) {
      newErrors.capacity = 'السعة مطلوبة';
    } else if (isNaN(formData.capacity) || formData.capacity < 1) {
      newErrors.capacity = 'السعة يجب أن تكون رقم موجب';
    }
    if (!formData.municipality_id) {
      newErrors.municipality = 'البلدية مطلوبة';
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
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        capacity: parseInt(formData.capacity),
        is_active: formData.is_active,
        municipality_id: formData.municipality_id
          ? parseInt(formData.municipality_id, 10)
          : null,
      };

      if (editingBin) {
        await binsAPI.updateBin(editingBin.id, submitData);
        addToast('تم تحديث الحاوية بنجاح', 'success');
      } else {
        await binsAPI.createBin(submitData);
        addToast('تم إنشاء الحاوية بنجاح', 'success');
      }
      closeSidePanel();
      fetchBins();
    } catch (error) {
      const errorData = error.response?.data || {};
      setErrors(errorData);
      addToast('فشل العملية', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الحاوية؟')) return;
    try {
      await binsAPI.deleteBin(id);
      addToast('تم حذف الحاوية بنجاح', 'success');
      fetchBins();
    } catch {
      addToast('فشل حذف الحاوية', 'error');
    }
  };

  const columns = [
    { key: 'name', label: 'الاسم' },
    { key: 'latitude', label: 'خط العرض' },
    { key: 'longitude', label: 'خط الطول' },
    { key: 'capacity', label: 'السعة' },
    {
      key: 'municipality',
      label: 'البلدية',
      render: (_, row) => row.municipality?.name || '—',
    },
    {
      key: 'is_active',
      label: 'الحالة',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {value ? 'نشط' : 'غير نشط'}
        </span>
      ),
    },
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
        <h1 className="text-2xl font-bold text-gray-800">إدارة الحاويات</h1>
        <button
          onClick={() => openSidePanel()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          إضافة حاوية
        </button>
      </div>

      <Table columns={columns} data={bins} loading={loading} />

      <BinSidePanel
        isOpen={sidePanelOpen}
        onClose={closeSidePanel}
        onSubmit={handleSubmit}
        loading={loading}
        editingBin={editingBin}
        formData={formData}
        errors={errors}
        handleChange={handleChange}
      />
    </div>
  );
};

export default Bins;

