import { useState, useEffect, useCallback } from 'react';
import { landfillsAPI, municipalitiesAPI } from '../services/api';
import Table from '../components/Table';
import { useToast } from '../components/ToastContainer';
import LandfillSidePanel from '../components/LandfillSidePanel';
import Pagination from '../components/Pagination';

const Landfill = () => {
  const { addToast } = useToast();
  const [landfills, setLandfills] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 7;
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [editingLandfill, setEditingLandfill] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    description: '',
    municipality_ids: [],
  });
  const [errors, setErrors] = useState({});

  const fetchLandfills = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page };
      const response = await landfillsAPI.getLandfills(params);
      
      // Handle paginated response: { results: [...], count: ... } or fallback to array
      if (response.data?.results !== undefined) {
        setLandfills(response.data.results || []);
        setTotalCount(response.data.count || 0);
      } else if (Array.isArray(response.data)) {
        setLandfills(response.data);
        setTotalCount(response.data.length);
      } else {
        setLandfills([]);
        setTotalCount(0);
      }
    } catch {
      addToast('فشل تحميل مكبات القمامة', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchMunicipalities = useCallback(async () => {
    try {
      const response = await municipalitiesAPI.getMunicipalities();
      setMunicipalities(Array.isArray(response.data) ? response.data : response.data?.results || []);
    } catch {
      // Silently fail - municipalities are optional
    }
  }, []);

  useEffect(() => {
    fetchLandfills(currentPage);
    fetchMunicipalities();
  }, [fetchLandfills, fetchMunicipalities, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openSidePanel = (landfill = null) => {
    if (landfill) {
      setEditingLandfill(landfill);
      setFormData({
        name: landfill.name || '',
        latitude: landfill.latitude || '',
        longitude: landfill.longitude || '',
        description: landfill.description || '',
        municipality_ids: landfill.municipalities?.map((m) => m.id) || [],
      });
    } else {
      setEditingLandfill(null);
      setFormData({
        name: '',
        latitude: '',
        longitude: '',
        description: '',
        municipality_ids: [],
      });
    }
    setErrors({});
    setSidePanelOpen(true);
  };

  const closeSidePanel = () => {
    setSidePanelOpen(false);
    setEditingLandfill(null);
    setFormData({
      name: '',
      latitude: '',
      longitude: '',
      description: '',
      municipality_ids: [],
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

  const handleMunicipalityToggle = (municipalityId) => {
    setFormData((prev) => {
      const currentIds = prev.municipality_ids || [];
      const newIds = currentIds.includes(municipalityId)
        ? currentIds.filter((id) => id !== municipalityId)
        : [...currentIds, municipalityId];
      return { ...prev, municipality_ids: newIds };
    });
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
        description: formData.description,
        municipality_ids: formData.municipality_ids,
      };

      if (editingLandfill) {
        await landfillsAPI.updateLandfill(editingLandfill.id, submitData);
        addToast('تم تحديث مكب القمامة بنجاح', 'success');
      } else {
        await landfillsAPI.createLandfill(submitData);
        addToast('تم إنشاء مكب القمامة بنجاح', 'success');
      }
      closeSidePanel();
      fetchLandfills(currentPage);
    } catch (error) {
      const errorData = error.response?.data || {};
      setErrors(errorData);
      addToast('فشل العملية', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف مكب القمامة هذا؟')) return;
    try {
      await landfillsAPI.deleteLandfill(id);
      addToast('تم حذف مكب القمامة بنجاح', 'success');
      fetchLandfills(currentPage);
    } catch {
      addToast('فشل حذف مكب القمامة', 'error');
    }
  };

  const columns = [
    { key: 'name', label: 'الاسم' },
    { key: 'latitude', label: 'خط العرض' },
    { key: 'longitude', label: 'خط الطول' },
    {
      key: 'description',
      label: 'الوصف',
      render: (value) => (value ? (value.length > 50 ? `${value.substring(0, 50)}...` : value) : '-'),
    },
    {
      key: 'municipalities',
      label: 'البلديات',
      render: (value) => {
        if (!value || value.length === 0) return '-';
        return value.map((m) => m.name).join('، ');
      },
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
        <h1 className="text-2xl font-bold text-gray-800">إدارة مكبات القمامة</h1>
        <button
          onClick={() => openSidePanel()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          إضافة مكب قمامة
        </button>
      </div>

      <Table columns={columns} data={landfills} loading={loading} />

      <Pagination
        currentPage={currentPage}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={handlePageChange}
      />

      <LandfillSidePanel
        isOpen={sidePanelOpen}
        onClose={closeSidePanel}
        onSubmit={handleSubmit}
        loading={loading}
        editingLandfill={editingLandfill}
        formData={formData}
        errors={errors}
        handleChange={handleChange}
        municipalities={municipalities}
        handleMunicipalityToggle={handleMunicipalityToggle}
      />
    </div>
  );
};

export default Landfill;

