import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import Table from '../components/Table';
import { useToast } from '../components/ToastContainer';
import UserFiltersDropdown from '../components/UserFiltersDropdown';
import UserSidePanel from '../components/UserSidePanel';

const Users = () => {
  const { addToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedArchived, setSelectedArchived] = useState([]);

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    role: 'driver',
    phone: '',
    image_profile: null,
  });

  const [errors, setErrors] = useState({});

  // هل هناك فلاتر مفعّلة؟
  const hasActiveUserFilters =
    selectedRoles.length > 0 ||
    selectedStates.length > 0 ||
    selectedArchived.length > 0;

  useEffect(() => {
    fetchUsers();
  }, [search, selectedRoles, selectedStates, selectedArchived]);

  const fetchUsers = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (search) params.append('search', search);
      selectedRoles.forEach((r) => params.append('role', r));
      selectedStates.forEach((s) => params.append('is_active', s));
      selectedArchived.forEach((a) => params.append('is_archived', a));

      const res = await usersAPI.getUsers(params);

      setUsers(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch {
      addToast('فشل تحميل المستخدمين', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openSidePanel = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email || '',
        username: user.username || '',
        role: user.role || 'driver',
        phone: user.phone || '',
        image_profile: user.image_profile || null,
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        username: '',
        role: 'driver',
        phone: '',
        image_profile: null,
      });
    }

    setErrors({});
    setSidePanelOpen(true);
  };

  const closeSidePanel = () => {
    setSidePanelOpen(false);
    setEditingUser(null);
    setFormData({
      email: '',
      username: '',
      role: 'driver',
      phone: '',
      image_profile: null,
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

  const handleImageChange = (file) => {
    setFormData((prev) => ({ ...prev, image_profile: file }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email && !editingUser) newErrors.email = 'البريد الإلكتروني مطلوب';
    if (!formData.username) newErrors.username = 'اسم المستخدم مطلوب';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const submitData = new FormData();

      if (!editingUser) submitData.append('email', formData.email);
      submitData.append('username', formData.username);
      submitData.append('role', formData.role);
      submitData.append('phone', formData.phone);

      if (formData.image_profile instanceof File) {
        submitData.append('image_profile', formData.image_profile);
      }

      if (editingUser) {
        await usersAPI.updateUser(editingUser.id, submitData);
        addToast('تم تحديث المستخدم بنجاح', 'success');
      } else {
        await usersAPI.createUser(submitData);
        addToast('تم إنشاء المستخدم بنجاح', 'success');
      }

      closeSidePanel();
      fetchUsers();
    } catch (error) {
      setErrors(error.response?.data || {});
      addToast('فشلت العملية', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('هل أنت متأكد من أرشفة هذا المستخدم؟')) return;
    try {
      await usersAPI.archiveUser(id);
      addToast('تم أرشفة المستخدم', 'success');
      fetchUsers();
    } catch {
      addToast('فشل أرشفة المستخدم', 'error');
    }
  };

  const handleRestore = async (id) => {
    try {
      await usersAPI.restoreUser(id);
      addToast('تم استعادة المستخدم', 'success');
      fetchUsers();
    } catch {
      addToast('فشل الاستعادة', 'error');
    }
  };

  const getRoleLabel = (role) => {
    const labels = { admin: 'مدير', planner: 'مخطط', driver: 'سائق' };
    return labels[role] || role;
  };

  const columns = [
    { key: 'username', label: 'اسم المستخدم' },
    { key: 'email', label: 'البريد الإلكتروني' },
    {
      key: 'role',
      label: 'الدور',
      render: (value) => getRoleLabel(value),
    },
    {
      key: 'is_active',
      label: 'الحالة',
      render: (value) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
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
            className="text-blue-600 hover:text-blue-800 text-sm"
            onClick={() => openSidePanel(row)}
          >
            تعديل
          </button>

          {row.is_archived ? (
            <button
              className="text-green-600 hover:text-green-800 text-sm"
              onClick={() => handleRestore(row.id)}
            >
              استعادة
            </button>
          ) : (
            <button
              className="text-yellow-600 hover:text-yellow-800 text-sm"
              onClick={() => handleArchive(row.id)}
            >
              أرشفة
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
        <button
          onClick={() => openSidePanel()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          إضافة مستخدم
        </button>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 flex gap-4 items-center">
        <input
          type="text"
          placeholder="ابحث عن مستخدم"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />

        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-all ${
              hasActiveUserFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            فلترة
            {hasActiveUserFilters && (
              <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                !
              </span>
            )}
          </button>

          {showFilters && (
            <UserFiltersDropdown
              selectedRoles={selectedRoles}
              setSelectedRoles={setSelectedRoles}
              selectedStates={selectedStates}
              setSelectedStates={setSelectedStates}
              selectedArchived={selectedArchived}
              setSelectedArchived={setSelectedArchived}
              onReset={() => {
                setSelectedRoles([]);
                setSelectedStates([]);
                setSelectedArchived([]);
              }}
              onClose={() => setShowFilters(false)}
            />
          )}
        </div>
      </div>

      <Table columns={columns} data={users} loading={loading} />

      <UserSidePanel
        isOpen={sidePanelOpen}
        onClose={closeSidePanel}
        onSubmit={handleSubmit}
        loading={loading}
        editingUser={editingUser}
        formData={formData}
        errors={errors}
        handleChange={handleChange}
        handleImageChange={handleImageChange}
      />
    </div>
  );
};

export default Users;
