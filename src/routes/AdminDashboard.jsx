import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapView from '../components/MapView';
import StatCard from '../components/StatCard';
import { adminStatsAPI } from '../services/api';

// Icons constant
const Icons = {
  users: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  bins: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  vehicles: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  municipalities: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users_active: 0,
    vehicles_total: 0,
    bins_active: 0,
    municipality_total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminStatsAPI.getStats();
        setStats(response.data);
      } catch (err) {
        setError('فشل تحميل الإحصائيات');
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Card configuration array
  const cardConfig = [
    {
      title: 'المستخدمين',
      valueKey: 'users_active',
      icon: Icons.users,
      colorTheme: 'blue',
      route: '/dashboard/admin/users',
    },
    {
      title: 'الحاويات',
      valueKey: 'bins_active',
      icon: Icons.bins,
      colorTheme: 'green',
      route: '/dashboard/admin/bins',
    },
    {
      title: 'الشاحنات',
      valueKey: 'vehicles_total',
      icon: Icons.vehicles,
      colorTheme: 'yellow',
      route: '/dashboard/admin/vehicles',
    },
    {
      title: 'المديريات',
      valueKey: 'municipality_total',
      icon: Icons.municipalities,
      colorTheme: 'purple',
      route: '/dashboard/admin/municipalities',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">لوحة التحكم</h1>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cardConfig.map((card) => (
          <StatCard
            key={card.valueKey}
            title={card.title}
            value={stats[card.valueKey]}
            icon={card.icon}
            colorTheme={card.colorTheme}
            onClick={() => navigate(card.route)}
            loading={loading}
          />
        ))}
      </div>

      <div className="w-full">
        <MapView />
      </div>
    </div>
  );
};

export default AdminDashboard;
