import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { plannerAPI } from '../services/api';
import Table from '../components/Table';
import PlanSideBar from '../components/PlanSideBar';
import { useToast } from '../components/ToastContainer';
import Pagination from '../components/Pagination';

// --- مكون قائمة الفلترة (كما هو) ---
const PlanFiltersDropdown = ({ 
  filterStatus, setFilterStatus, 
  municipalities, selectedMunicipality, setSelectedMunicipality,
  dateFilter, setDateFilter,
  onReset, onClose 
}) => (
  <div className="absolute top-12 left-0 w-72 bg-white border rounded-lg shadow-xl z-50 p-4 animate-fade-in-down">
    <div className="flex justify-between items-center mb-4 border-b pb-2">
      <h3 className="font-bold text-gray-700">تصفية الخطط</h3>
      <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">✕</button>
    </div>

    {/* فلتر الحالة */}
    <div className="mb-4">
      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">حالة الخطة</label>
      <div className="flex bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setFilterStatus('active')}
          className={`flex-1 py-1 text-sm rounded-md transition-all ${filterStatus === 'active' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
        >
          نشطة
        </button>
        <button
          onClick={() => setFilterStatus('archived')}
          className={`flex-1 py-1 text-sm rounded-md transition-all ${filterStatus === 'archived' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
        >
          منتهية
        </button>
        <button
          onClick={() => setFilterStatus('all')}
          className={`flex-1 py-1 text-sm rounded-md transition-all ${filterStatus === 'all' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
        >
          الكل
        </button>
      </div>
    </div>

    {/* فلتر البلدية */}
    <div className="mb-4">
      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">البلدية</label>
      <select
        value={selectedMunicipality}
        onChange={(e) => setSelectedMunicipality(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
      >
        <option value="">كافة البلديات</option>
        {municipalities.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
    </div>

    {/* فلتر التاريخ */}
    <div className="mb-4">
      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">تاريخ الجمع</label>
      <input 
        type="date" 
        value={dateFilter}
        onChange={(e) => setDateFilter(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>

    <div className="flex gap-3 mt-6">
      <button 
        onClick={onReset} 
        className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        إعادة تعيين
      </button>
      <button 
        onClick={onClose} 
        className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
      >
        تم
      </button>
    </div>
  </div>
);

const normalizeList = (data) => (Array.isArray(data) ? data : data?.results || []);

const PlannerScenarios = () => {
  const { addToast } = useToast();

  const [scenarios, setScenarios] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [availableBins, setAvailableBins] = useState([]);
  const [landfills, setLandfills] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 7;
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [errors, setErrors] = useState({});

  // --- حالات الفلترة والبحث ---
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // 2. إنشاء مرجع للحاوية التي تضم الزر والقائمة
  const filterRef = useRef(null);

  const [filterStatus, setFilterStatus] = useState('active'); 
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    municipality_id: '',
    collection_date: '',
    start_landfill_id: '',
    vehicle_id: '',
    bin_ids: [],
  });

  const DEBOUNCE_DELAY = 200;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [search]);

  // 3. إضافة منطق إغلاق القائمة عند الضغط خارجها
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    }
    // إضافة المستمع عند فتح المكون
    document.addEventListener("mousedown", handleClickOutside);
    
    // تنظيف المستمع عند إغلاق المكون
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filterRef]);

  // --- جلب البيانات ---
  const fetchScenarios = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page };
      
      if (debouncedSearch) params.search = debouncedSearch;
      
      if (filterStatus === 'archived') params.is_archived = 'true';
      else if (filterStatus === 'active') params.is_archived = 'false';
      
      if (selectedMunicipality) params.municipality = selectedMunicipality;
      if (dateFilter) params.collection_date = dateFilter;

      const res = await plannerAPI.getScenarios(params);
      
      // Handle paginated response: { results: [...], count: ... } or fallback to array
      if (res.data?.results !== undefined) {
        setScenarios(res.data.results || []);
        setTotalCount(res.data.count || 0);
      } else if (Array.isArray(res.data)) {
        setScenarios(res.data);
        setTotalCount(res.data.length);
      } else {
        setScenarios([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error(error);
      addToast('فشل تحميل الخطط', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, debouncedSearch, filterStatus, selectedMunicipality, dateFilter]); // الاعتماد على debouncedSearch

  const fetchFormOptions = useCallback(async (scenarioId = null) => {
    try {
      const [muniRes, landfillRes, vehicleRes] = await Promise.all([
        plannerAPI.getMunicipalities(),
        plannerAPI.getLandfills(),
        plannerAPI.getVehicles(scenarioId ? { scenario_id: scenarioId } : {}),
      ]);

      setMunicipalities(normalizeList(muniRes.data));
      setLandfills(normalizeList(landfillRes.data));
      setVehicles(normalizeList(vehicleRes.data));
    } catch (error) {
      console.error(error);
      addToast('فشل تحميل البيانات المساعدة', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    // Reset to page 1 when filters or debounced search change
    setCurrentPage(1);
  }, [debouncedSearch, filterStatus, selectedMunicipality, dateFilter]);

  useEffect(() => {
    fetchScenarios(currentPage);
  }, [fetchScenarios, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    fetchFormOptions();
  }, [fetchFormOptions]);

  // --- بقية الـ Effects والدوال (Load Bins, Handlers, Submit, Delete) ---
  useEffect(() => {
    const loadBins = async () => {
      if (!formData.municipality_id) {
        setAvailableBins([]);
        setFormData((prev) => ({ ...prev, bin_ids: [] }));
        return;
      }
      try {
        const params = { municipality: formData.municipality_id };
        if (editingPlan) params.scenario_id = editingPlan.id;
        const res = await plannerAPI.getAvailableBins(params);
        const bins = normalizeList(res.data);
        setAvailableBins(bins);
        setFormData((prev) => ({
          ...prev,
          bin_ids: prev.bin_ids.filter((id) => bins.some((b) => b.id === id)),
        }));
      } catch (error) {
        console.error(error);
        addToast('فشل تحميل الحاويات المتاحة', 'error');
      }
    };
    loadBins();
  }, [formData.municipality_id, editingPlan, addToast]);

  const resetForm = useCallback(() => {
    setFormData({
      name: '', municipality_id: '', collection_date: '',
      start_landfill_id: '', vehicle_id: '', bin_ids: [],
    });
    setErrors({});
  }, []);

  const openSidePanel = useCallback(async (scenario = null) => {
    if (scenario) {
      setEditingPlan(scenario);
      await fetchFormOptions(scenario.id); 
      setFormData({
        name: scenario.name || '',
        municipality_id: scenario.municipality?.id || '',
        collection_date: scenario.collection_date || '',
        start_landfill_id: '', 
        vehicle_id: scenario.vehicle?.id || '',
        bin_ids: (scenario.bins || []).map((b) => b.id),
      });
    } else {
      setEditingPlan(null);
      await fetchFormOptions();
      resetForm();
    }
    setSidePanelOpen(true);
  }, [fetchFormOptions, resetForm]);

  const closeSidePanel = useCallback(() => {
    setSidePanelOpen(false);
    setEditingPlan(null);
    resetForm();
  }, [resetForm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const toggleBin = (id) => {
    setFormData((prev) => {
      const exists = prev.bin_ids.includes(id);
      const bin_ids = exists ? prev.bin_ids.filter((b) => b !== id) : [...prev.bin_ids, id];
      return { ...prev, bin_ids };
    });
    if (errors.bins) setErrors((prev) => ({ ...prev, bins: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.municipality_id) return setErrors({municipality: 'البلدية مطلوبة'});

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        municipality_id: formData.municipality_id,
        collection_date: formData.collection_date,
        start_landfill_id: formData.start_landfill_id ? Number(formData.start_landfill_id) : null,
        vehicle_id: formData.vehicle_id,
        bin_ids: formData.bin_ids,
      };

      let targetId;
      if (editingPlan) {
        await plannerAPI.updateScenario(editingPlan.id, payload);
        targetId = editingPlan.id;
        addToast('تم تحديث الخطة بنجاح', 'success');
      } else {
        const res = await plannerAPI.createScenario(payload);
        targetId = res.data.id;
        addToast('تم إنشاء الخطة بنجاح', 'success');
      }

      await plannerAPI.solveScenario(targetId);
      closeSidePanel();
      fetchScenarios(currentPage);
    } catch (error) {
      setErrors(error.response?.data || {});
      addToast('حدث خطأ أثناء المعالجة', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRow = useCallback(async (scenario) => {
    if (!window.confirm(`هل أنت متأكد من الحذف النهائي للخطة "${scenario.name || 'بدون اسم'}"؟`)) return;
    try {
      await plannerAPI.deleteScenario(scenario.id);
      addToast('تم حذف الخطة نهائياً', 'success');
      if (editingPlan && editingPlan.id === scenario.id) {
        closeSidePanel();
      }
      fetchScenarios(currentPage);
    } catch (error) {
      console.error(error);
      addToast('فشل حذف الخطة', 'error');
    }
  }, [addToast, editingPlan, fetchScenarios, closeSidePanel, currentPage]);

  // --- تعريف الأعمدة ---
  const columns = useMemo(() => ([
    { key: 'name', label: 'اسم الخطة' },
    { key: 'municipality', label: 'البلدية', render: (_, row) => row.municipality?.name || '-' },
    { key: 'collection_date', label: 'تاريخ الجمع' },
    { key: 'vehicle', label: 'المركبة', render: (_, row) => row.vehicle?.name || '-' },
    { key: 'bins', label: 'عدد الحاويات', render: (_, row) => row.bins?.length || 0 },
    { 
      key: 'status', 
      label: 'الحالة', 
      render: (_, row) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${row.is_expired ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
          {row.is_expired ? 'منتهية الصلاحية' : 'نشطة'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'إجراءات',
      render: (_, row) => (
        <div className="flex gap-3">
          <button
            onClick={() => openSidePanel(row)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            تعديل
          </button>
          <button
            onClick={() => handleDeleteRow(row)}
            className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
          >
            حذف 
          </button>
        </div>
      ),
    },
  ]), [openSidePanel, handleDeleteRow]);

  return (
    <div>
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">خطط الجمع</h1>
        <button
          onClick={() => openSidePanel()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <span>+</span> إنشاء خطة جديدة
        </button>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="mb-6 flex gap-4 items-center">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="ابحث باسم الخطة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pl-10"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
        </div>

        {/* 4. ربط المرجع (Ref) بالحاوية هنا */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-all ${
              showFilters || selectedMunicipality || dateFilter || filterStatus !== 'active'
              ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
              : 'bg-white hover:bg-gray-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            فلترة
            {(selectedMunicipality || dateFilter || filterStatus !== 'active') && (
              <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">!</span>
            )}
          </button>

          {showFilters && (
            <PlanFiltersDropdown
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              municipalities={municipalities}
              selectedMunicipality={selectedMunicipality}
              setSelectedMunicipality={setSelectedMunicipality}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              onReset={() => {
                setSearch('');
                setFilterStatus('active');
                setSelectedMunicipality('');
                setDateFilter('');
              }}
              onClose={() => setShowFilters(false)}
            />
          )}
        </div>
      </div>

      <Table columns={columns} data={scenarios} loading={loading} />

      <Pagination
        currentPage={currentPage}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={handlePageChange}
      />

      <PlanSideBar
        isOpen={sidePanelOpen}
        onClose={closeSidePanel}
        onSubmit={handleSubmit}
        loading={loading}
        editingPlan={editingPlan}
        formData={formData}
        errors={errors}
        handleChange={handleChange}
        municipalities={municipalities}
        vehicles={vehicles}
        bins={availableBins}
        landfills={landfills}
        toggleBin={toggleBin}
        onDelete={editingPlan ? () => handleDeleteRow(editingPlan) : null}
      />
    </div>
  );
};

export default PlannerScenarios;