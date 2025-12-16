import { useState, useEffect, useCallback } from 'react';
import { municipalitiesAPI } from '../services/api';
import Table from '../components/Table';
import { useToast } from '../components/ToastContainer';
import MunicipalitySidePanel from '../components/MunicipalitySidePanel';

const Municipality = () => {
  const { addToast } = useToast();
  const [municipalities, setMunicipalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [editingMunicipality, setEditingMunicipality] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    hq_latitude: '',
    hq_longitude: '',
    description: '',
  });
  const [errors, setErrors] = useState({});

  const fetchMunicipalities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await municipalitiesAPI.getMunicipalities();
      setMunicipalities(response.data.results || response.data);
    } catch {
      addToast('فشل تحميل المديريات', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchMunicipalities();
  }, [fetchMunicipalities]);

  const openSidePanel = (municipality = null) => {
    if (municipality) {
      setEditingMunicipality(municipality);
      setFormData({
        name: municipality.name || '',
        hq_latitude: municipality.hq_latitude || '',
        hq_longitude: municipality.hq_longitude || '',
        description: municipality.description || '',
      });
    } else {
      setEditingMunicipality(null);
      setFormData({
        name: '',
        hq_latitude: '',
        hq_longitude: '',
        description: '',
      });
    }
    setErrors({});
    setSidePanelOpen(true);
  };

  const closeSidePanel = () => {
    setSidePanelOpen(false);
    setEditingMunicipality(null);
    setFormData({
      name: '',
      hq_latitude: '',
      hq_longitude: '',
      description: '',
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
    if (formData.hq_latitude && (isNaN(formData.hq_latitude) || formData.hq_latitude < 33.40 || formData.hq_latitude > 33.60)) {
      newErrors.hq_latitude = 'خط العرض يجب أن يكون بين 33.40 و 33.60 (حدود مدينة دمشق)';
    }
    if (formData.hq_longitude && (isNaN(formData.hq_longitude) || formData.hq_longitude < 36.10 || formData.hq_longitude > 36.40)) {
      newErrors.hq_longitude = 'خط الطول يجب أن يكون بين 36.10 و 36.40 (حدود مدينة دمشق)';
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
        description: formData.description,
      };

      if (formData.hq_latitude) {
        submitData.hq_latitude = parseFloat(formData.hq_latitude);
      }
      if (formData.hq_longitude) {
        submitData.hq_longitude = parseFloat(formData.hq_longitude);
      }

      if (editingMunicipality) {
        await municipalitiesAPI.updateMunicipality(editingMunicipality.id, submitData);
        addToast('تم تحديث المديرية بنجاح', 'success');
      } else {
        await municipalitiesAPI.createMunicipality(submitData);
        addToast('تم إنشاء المديرية بنجاح', 'success');
      }
      closeSidePanel();
      fetchMunicipalities();
    } catch (error) {
      const errorData = error.response?.data || {};
      setErrors(errorData);
      addToast('فشل العملية', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المديرية؟')) return;
    try {
      await municipalitiesAPI.deleteMunicipality(id);
      addToast('تم حذف المديرية بنجاح', 'success');
      fetchMunicipalities();
    } catch {
      addToast('فشل حذف المديرية', 'error');
    }
  };

  const columns = [
    { key: 'name', label: 'الاسم' },
    { key: 'hq_latitude', label: 'خط العرض' },
    { key: 'hq_longitude', label: 'خط الطول' },
    {
      key: 'description',
      label: 'الوصف',
      render: (value) => (value ? (value.length > 50 ? `${value.substring(0, 50)}...` : value) : '-'),
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
        <h1 className="text-2xl font-bold text-gray-800">إدارة المديريات</h1>
        <button
          onClick={() => openSidePanel()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          إضافة مديرية
        </button>
      </div>

      <Table columns={columns} data={municipalities} loading={loading} />

      <MunicipalitySidePanel
        isOpen={sidePanelOpen}
        onClose={closeSidePanel}
        onSubmit={handleSubmit}
        loading={loading}
        editingMunicipality={editingMunicipality}
        formData={formData}
        errors={errors}
        handleChange={handleChange}
      />
    </div>
  );
};

export default Municipality;

