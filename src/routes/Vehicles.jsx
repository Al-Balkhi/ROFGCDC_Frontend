import { useState, useEffect, useCallback } from "react";
import useAuthStore from "../store/authStore";
import { vehiclesAPI } from "../services/api";
import Table from "../components/Table";
import FormInput from "../components/FormInput";
import { useToast } from "../components/ToastContainer";
import VehicleSidePanel from "../components/VehicleSidePanel";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";

const Vehicles = () => {
  const { addToast } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 7;
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    capacity: "",
    municipality_id: "",
  });
  const [errors, setErrors] = useState({});
  const [confirmState, setConfirmState] = useState({ open: false });

  const fetchVehicles = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page };
        const response = await vehiclesAPI.getVehicles(params);

        // Handle paginated response: { results: [...], count: ... } or fallback to array
        if (response.data?.results !== undefined) {
          setVehicles(response.data.results || []);
          setTotalCount(response.data.count || 0);
        } else if (Array.isArray(response.data)) {
          setVehicles(response.data);
          setTotalCount(response.data.length);
        } else {
          setVehicles([]);
          setTotalCount(0);
        }
      } catch {
        addToast("فشل تحميل الشاحنات", "error");
      } finally {
        setLoading(false);
      }
    },
    [addToast],
  );

  useEffect(() => {
    fetchVehicles(currentPage);
  }, [fetchVehicles, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openSidePanel = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        name: vehicle.name || "",
        capacity: vehicle.capacity || "",
        municipality_id: vehicle.municipality?.id || "",
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        name: "",
        capacity: "",
        municipality_id: "",
      });
    }
    setErrors({});
    setSidePanelOpen(true);
  };

  const closeSidePanel = () => {
    setSidePanelOpen(false);
    setEditingVehicle(null);
    setFormData({
      name: "",
      capacity: "",
      municipality_id: "",
    });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "الاسم مطلوب";
    }
    if (!formData.capacity) {
      newErrors.capacity = "السعة مطلوبة";
    } else if (isNaN(formData.capacity) || formData.capacity < 1) {
      newErrors.capacity = "السعة يجب أن تكون رقم موجب";
    }
    if (!formData.municipality_id) {
      newErrors.municipality = "البلدية مطلوبة";
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
        municipality_id: formData.municipality_id,
      };

      if (editingVehicle) {
        await vehiclesAPI.updateVehicle(editingVehicle.id, submitData);
        addToast("تم تحديث الشاحنة بنجاح", "success");
      } else {
        await vehiclesAPI.createVehicle(submitData);
        addToast("تم إنشاء الشاحنة بنجاح", "success");
      }
      closeSidePanel();
      fetchVehicles(currentPage);
    } catch (error) {
      const errorData = error.response?.data || {};
      setErrors(errorData);
      addToast("فشل العملية", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmState({
      open: true,
      message: "هل أنت متأكد من حذف هذه الشاحنة؟",
      onConfirm: async () => {
        try {
          await vehiclesAPI.deleteVehicle(id);
          addToast("تم حذف الشاحنة بنجاح", "success");
          fetchVehicles(currentPage);
        } catch {
          addToast("فشل حذف الشاحنة", "error");
        }
      },
    });
  };

  const currentUser = useAuthStore((state) => state.user);

  const columns = [
    { key: "name", label: "الاسم" },
    { key: "capacity", label: "السعة" },
    {
      key: "municipality",
      label: "البلدية",
      render: (_, row) => row.municipality?.name || "—",
    },
  ];

  if (currentUser?.is_superuser) {
    columns.push({
      key: "created_by",
      label: "تم الإنشاء بواسطة",
      render: (_, row) => row.created_by || "—",
    });
  }

  columns.push({
    key: "actions",
    label: "الإجراءات",
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
  });

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

      <Pagination
        currentPage={currentPage}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={handlePageChange}
      />

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

export default Vehicles;
