import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { plannerAPI } from "../services/api";
import Table from "../components/Table";
import PlanSideBar from "../components/PlanSideBar";
import { useToast } from "../components/ToastContainer";
import Pagination from "../components/Pagination";
import useAuthStore from "../store/authStore";
import { useSearchParams } from "react-router-dom";
import { ROLES } from "../constants/roles";
import { WEEKDAY_NAMES, SCENARIO_STATUS } from "../constants/labels";
import ConfirmDialog from "../components/ConfirmDialog";
import PlanFiltersDropdown from "../components/PlanFiltersDropdown";

const normalizeList = (data) =>
  Array.isArray(data) ? data : data?.results || [];

const PlannerScenarios = () => {
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("id");
  const user = useAuthStore((state) => state.user);
  const isPlanner = user?.role === ROLES.PLANNER;
  const isSuperuser = user?.is_superuser;

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

  // ConfirmDialog state
  const [confirmState, setConfirmState] = useState({ open: false });

  // --- حالات الفلترة والبحث ---
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // 2. إنشاء مرجع للحاوية التي تضم الزر والقائمة
  const filterRef = useRef(null);

  const [filterStatus, setFilterStatus] = useState("active");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [weekDayFilter, setWeekDayFilter] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    municipality_id: "",
    collection_date: "",
    // start_landfill_id removed
    end_landfill_id: "",
    vehicle_id: "",
    bin_ids: [],
    is_recurring: false,
    weekdays: [],
  });

  const [activeTab, setActiveTab] = useState("scenarios"); // 'scenarios' or 'templates'
  const [templates, setTemplates] = useState([]);

  // ... (keeping DEBOUNCE_DELAY and effects)
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
  useAutoScroll(highlightId, activeTab === "scenarios" ? scenarios : templates);

  const fetchScenarios = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page };

        if (debouncedSearch) params.search = debouncedSearch;

        if (filterStatus === "archived") params.is_archived = "true";
        else if (filterStatus === "active") params.is_archived = "false";

        if (selectedMunicipality) params.municipality = selectedMunicipality;
        if (weekDayFilter !== "") params.week_day = weekDayFilter;

        const res = await plannerAPI.getScenarios(params);

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
        addToast("فشل تحميل الخطط", "error");
      } finally {
        setLoading(false);
      }
    },
    [
      addToast,
      debouncedSearch,
      filterStatus,
      selectedMunicipality,
      weekDayFilter,
    ],
  );

  const fetchTemplates = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page };
        if (debouncedSearch) params.search = debouncedSearch;
        if (selectedMunicipality) params.municipality = selectedMunicipality;
        if (weekDayFilter !== "") params.week_day = weekDayFilter;

        const res = await plannerAPI.getScenarioTemplates(params);
        if (res.data?.results !== undefined) {
          setTemplates(res.data.results || []);
          setTotalCount(res.data.count || 0);
        } else {
          setTemplates([]);
          setTotalCount(0);
        }
      } catch (error) {
        console.error(error);
        addToast("فشل تحميل القوالب", "error");
      } finally {
        setLoading(false);
      }
    },
    [addToast, debouncedSearch, selectedMunicipality, weekDayFilter],
  );

  const fetchFormOptions = useCallback(
    async (scenarioId = null) => {
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
        addToast("فشل تحميل البيانات المساعدة", "error");
      }
    },
    [addToast],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearch,
    filterStatus,
    selectedMunicipality,
    activeTab,
    weekDayFilter,
  ]);

  useEffect(() => {
    if (activeTab === "scenarios") {
      fetchScenarios(currentPage);
    } else {
      fetchTemplates(currentPage);
    }
  }, [fetchScenarios, fetchTemplates, currentPage, activeTab]);

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
        if (editingPlan && !formData.is_recurring)
          params.scenario_id = editingPlan.id;
        const res = await plannerAPI.getAvailableBins(params);
        const bins = normalizeList(res.data);
        setAvailableBins(bins);
        setFormData((prev) => ({
          ...prev,
          bin_ids: prev.bin_ids.filter((id) => bins.some((b) => b.id === id)),
        }));
      } catch (error) {
        console.error(error);
        addToast("فشل تحميل الحاويات المتاحة", "error");
      }
    };
    loadBins();
  }, [formData.municipality_id, editingPlan, formData.is_recurring, addToast]);

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      municipality_id: "",
      collection_date: "",
      end_landfill_id: "",
      vehicle_id: "",
      bin_ids: [],
      is_recurring: false,
      weekdays: [],
    });
    setErrors({});
  }, []);

  const openSidePanel = useCallback(
    async (item = null) => {
      if (item) {
        setEditingPlan(item);
        await fetchFormOptions(item.id);

        const isTemplate = !!item.weekdays; // Simple check if it has weekdays field

        setFormData({
          name: item.name || "",
          municipality_id: item.municipality?.id || "",
          collection_date: item.collection_date || "",
          end_landfill_id: item.end_landfill?.id || "",
          vehicle_id: item.vehicle?.id || "",
          bin_ids: (item.bins || []).map((b) => b.id),
          is_recurring: isTemplate,
          weekdays: isTemplate ? item.weekdays.split(",") : [],
        });
      } else {
        setEditingPlan(null);
        await fetchFormOptions();
        resetForm();
      }
      setSidePanelOpen(true);
    },
    [fetchFormOptions, resetForm],
  );

  const closeSidePanel = useCallback(() => {
    setSidePanelOpen(false);
    setEditingPlan(null);
    resetForm();
  }, [resetForm]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      let newData = { ...prev };

      if (type === "checkbox" && name === "is_recurring") {
        newData[name] = checked;
      } else {
        newData[name] = value;
      }

      // Logic for Municipality Change: Auto-select Landfill
      if (name === "municipality_id") {
        const muniId = Number(value);
        if (muniId) {
          // Find a landfill linked to this municipality
          const matchingLandfill = landfills.find(
            (lf) =>
              lf.municipalities &&
              lf.municipalities.some((m) => m.id === muniId),
          );
          if (matchingLandfill) {
            newData.end_landfill_id = matchingLandfill.id;
          } else {
            newData.end_landfill_id = "";
          }
        } else {
          newData.end_landfill_id = "";
        }
        // Reset dependent fields
        newData.vehicle_id = "";
        newData.bin_ids = [];
      }

      return newData;
    });

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const toggleBin = (id) => {
    setFormData((prev) => {
      const exists = prev.bin_ids.includes(id);
      const bin_ids = exists
        ? prev.bin_ids.filter((b) => b !== id)
        : [...prev.bin_ids, id];
      return { ...prev, bin_ids };
    });
    if (errors.bins) setErrors((prev) => ({ ...prev, bins: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.municipality_id)
      return setErrors({ municipality: "البلدية مطلوبة" });

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        municipality_id: formData.municipality_id,
        end_landfill_id: formData.end_landfill_id,
        vehicle_id: formData.vehicle_id,
        bin_ids: formData.bin_ids,
        weekdays: formData.weekdays.join(","), // Always present now
      };

      if (editingPlan) {
        // Update existing template (both recurring templates and historical scenarios
        // use the same endpoint since the workflow is now template-centric).
        await plannerAPI.updateScenarioTemplate(editingPlan.id, payload);
        addToast("تم تحديث القالب الدوري بنجاح", "success");
        fetchTemplates(currentPage);
      } else {
        // Create new recurring template
        await plannerAPI.createScenarioTemplate(payload);
        addToast("تم إنشاء القالب الدوري بنجاح", "success");
        if (activeTab !== "templates") setActiveTab("templates");
        fetchTemplates(1);
      }

      closeSidePanel();
    } catch (error) {
      setErrors(error.response?.data || {});
      addToast("حدث خطأ أثناء المعالجة", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRow = useCallback(
    async (item) => {
      setConfirmState({
        open: true,
        message: `هل أنت متأكد من الحذف النهائي لـ "${item.name}"?`,
        onConfirm: async () => {
          try {
            if (activeTab === "templates") {
              await plannerAPI.deleteScenarioTemplate(item.id);
              addToast("تم حذف القالب بنجاح", "success");
              fetchTemplates(currentPage);
            } else {
              await plannerAPI.deleteScenario(item.id);
              addToast("تم حذف الخطة نهائياً", "success");
              fetchScenarios(currentPage);
            }
            if (editingPlan && editingPlan.id === item.id) closeSidePanel();
          } catch (error) {
            console.error(error);
            addToast("فشل الحذف", "error");
          }
        },
      });
    },
    [
      addToast,
      editingPlan,
      fetchScenarios,
      fetchTemplates,
      closeSidePanel,
      currentPage,
      activeTab,
    ],
  );

  const columns = useMemo(
    () => [
      { key: "name", label: "اسم الخطة" },
      {
        key: "municipality",
        label: "البلدية",
        render: (_, row) => row.municipality?.name || "-",
      },
      { key: "collection_date", label: "تاريخ الجمع" },
      {
        key: "vehicle",
        label: "المركبة",
        render: (_, row) => row.vehicle?.name || "-",
      },
      {
        key: "bins",
        label: "عدد الحاويات",
        render: (_, row) => row.bins?.length || 0,
      },
      {
        key: "status",
        label: "الحالة",
        render: (_, row) => {
          const s = SCENARIO_STATUS[row.status] ?? SCENARIO_STATUS._unknown;
          return (
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${s.classes}`}
            >
              {s.label}
            </span>
          );
        },
      },
      ...(!isPlanner
        ? [
            {
              key: "creator",
              label: "المخطط",
              render: (_, row) =>
                row.created_by?.username || row.created_by || "-",
            },
          ]
        : []),
      ...(isSuperuser
        ? [
            {
              key: "admin_creator",
              label: "المدير المسؤول",
              render: (_, row) => row.created_by?.admin_name || "-",
            },
          ]
        : []),
    ],
    [isPlanner, isSuperuser],
  );

  const templateColumns = useMemo(
    () => [
      { key: "name", label: "اسم القالب" },
      {
        key: "municipality",
        label: "البلدية",
        render: (_, row) => row.municipality?.name || "-",
      },
      {
        key: "weekdays",
        label: "أيام التكرار",
        render: (_, row) =>
          row.weekdays
            ? row.weekdays
                .split(",")
                .map((d) => WEEKDAY_NAMES[parseInt(d)])
                .join("، ")
            : "-",
      },
      {
        key: "vehicle",
        label: "المركبة",
        render: (_, row) => row.vehicle?.name || "-",
      },
      {
        key: "bins",
        label: "عدد الحاويات",
        render: (_, row) => row.bins?.length || 0,
      },
      ...(isPlanner
        ? [
            {
              key: "actions",
              label: "إجراءات",
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
          ]
        : []),
      ...(!isPlanner
        ? [
            {
              key: "creator",
              label: "المخطط",
              render: (_, row) =>
                row.created_by?.username || row.created_by || "-",
            },
          ]
        : []),
      ...(isSuperuser
        ? [
            {
              key: "admin_creator",
              label: "المدير المسؤول",
              render: (_, row) => row.created_by?.admin_name || "-",
            },
          ]
        : []),
    ],
    [openSidePanel, handleDeleteRow, isPlanner, isSuperuser],
  );

  return (
    <div>
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">إدارة الخطط</h1>
        {isPlanner && (
          <button
            onClick={() => openSidePanel()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <span>+</span> إنشاء خطة دورية
          </button>
        )}
      </div>

      <div className="mb-6 border-b">
        <div className="flex gap-6">
          <button
            className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === "scenarios" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            onClick={() => setActiveTab("scenarios")}
          >
            الخطط اليومية
          </button>
          <button
            className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === "templates" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            onClick={() => setActiveTab("templates")}
          >
            الخطط الدورية
          </button>
        </div>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="mb-6 flex gap-4 items-center">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder={
              activeTab === "scenarios"
                ? "ابحث باسم الخطة..."
                : "ابحث باسم الخطة..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pl-10"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>

        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-all ${
              showFilters || selectedMunicipality || filterStatus !== "active"
                ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            فلترة
            {(selectedMunicipality || filterStatus !== "active") && (
              <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                !
              </span>
            )}
          </button>

          {showFilters && (
            <PlanFiltersDropdown
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              municipalities={municipalities}
              selectedMunicipality={selectedMunicipality}
              setSelectedMunicipality={setSelectedMunicipality}
              weekDayFilter={weekDayFilter}
              setWeekDayFilter={setWeekDayFilter}
              activeTab={activeTab}
              onReset={() => {
                setSearch("");
                setFilterStatus("active");
                setSelectedMunicipality("");
                setWeekDayFilter("");
              }}
              onClose={() => setShowFilters(false)}
            />
          )}
        </div>
      </div>

      <Table
        columns={activeTab === "scenarios" ? columns : templateColumns}
        data={activeTab === "scenarios" ? scenarios : templates}
        loading={loading}
        highlightId={highlightId}
        rowIdPrefix="scenario"
      />

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
        toggleBin={toggleBin}
        onDelete={editingPlan ? () => handleDeleteRow(editingPlan) : null}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        confirmLabel="حذف"
        onConfirm={() => {
          confirmState.onConfirm?.();
          setConfirmState({ open: false });
        }}
        onCancel={() => setConfirmState({ open: false })}
      />
    </div>
  );
};

// Add auto-scroll effect for highlighted plans
const useAutoScroll = (highlightId, data) => {
  useEffect(() => {
    if (highlightId && data.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`scenario-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
    }
  }, [highlightId, data]);
};

export default PlannerScenarios;
