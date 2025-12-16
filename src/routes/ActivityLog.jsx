import { useState, useEffect, useCallback } from 'react';
import { activityLogAPI } from '../services/api';
import Table from '../components/Table';
import { useToast } from '../components/ToastContainer';

const ActivityLog = () => {
  const { addToast } = useToast();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await activityLogAPI.getActivityLog();
      setActivities(response.data);
    } catch {
      addToast('فشل تحميل سجل النشاطات', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ar-SA');
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'مدير',
      planner: 'مخطط',
      driver: 'سائق',
    };
    return labels[role] || role;
  };

  const columns = [
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
        <span className={`px-2 py-1 rounded text-xs ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {value ? 'نشط' : 'غير نشط'}
        </span>
      ),
    },
    {
      key: 'last_login_at',
      label: 'آخر تسجيل دخول',
      render: (value) => formatDate(value),
    },
    {
      key: 'last_logout_at',
      label: 'آخر تسجيل خروج',
      render: (value) => formatDate(value),
    },
    {
      key: 'last_password_change_at',
      label: 'آخر تغيير كلمة مرور',
      render: (value) => formatDate(value),
    },
    {
      key: 'last_password_change_reason',
      label: 'طريقة تغيير كلمة المرور',
      render: (value) => {
        if (!value) return "-";

        const mapping = {
          forgot: "نسيت كلمة المرور",
          profile: "تغيير من الملف الشخصي",
          initial_setup: "إعداد الحساب لأول مرة",
        };

        return mapping[value] || "-";
      },
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">سجل النشاطات</h1>
        <button
          onClick={fetchActivities}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          تحديث
        </button>
      </div>

      <Table columns={columns} data={activities} loading={loading} />
    </div>
  );
};

export default ActivityLog;

