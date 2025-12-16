import { useEffect, useMemo, useState } from 'react';
import { plannerAPI } from '../services/api';
import { useToast } from '../components/ToastContainer';

const PlannerDashboard = () => {
  const { addToast } = useToast();
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await plannerAPI.getScenarios({ page_size: 1000 });
        setScenarios(res.data.results || res.data || []);
      } catch {
        addToast('فشل تحميل الإحصائيات', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [addToast]);

  const counts = useMemo(() => {
    const total = scenarios.length;
    
    // --- إصلاح منطق التاريخ (استخدام التوقيت المحلي) ---
    const now = new Date();
    // استخراج السنة والشهر واليوم المحليين
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // صيغة التاريخ المتوافقة مع الباك إند: YYYY-MM-DD
    const todayString = `${year}-${month}-${day}`;

    // 1. حساب خطط اليوم
    const todayCount = scenarios.filter((s) => s.collection_date === todayString).length;

    // 2. حساب خطط الشهر الحالي
    const monthCount = scenarios.filter((s) => {
      if (!s.collection_date) return false;
      const d = new Date(s.collection_date);
      // مقارنة الشهر والسنة
      return d.getMonth() + 1 === parseInt(month) && d.getFullYear() === year;
    }).length;

    return { total, today: todayCount, month: monthCount };
  }, [scenarios]);

  // تعريف البطاقات مع الألوان والأيقونات لتطابق تصميم الأدمن
  const cards = [
    { 
      title: 'إجمالي الخطط', 
      value: counts.total,
      color: 'blue',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      )
    },
    { 
      title: 'خطط اليوم', 
      value: counts.today,
      color: 'green', // لون مميز لليوم
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      )
    },
    { 
      title: 'خطط هذا الشهر', 
      value: counts.month,
      color: 'purple',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      )
    },
  ];

  // دالة مساعدة لتحديد تنسيق الألوان ديناميكياً
  const getColorClasses = (color) => {
    const colors = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
      green: { bg: 'bg-green-100', text: 'text-green-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">لوحة تحكم المخطط</h1>
        {loading && <span className="text-sm text-gray-500">جاري التحديث...</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => {
          const style = getColorClasses(card.color);
          return (
            <div 
              key={card.title} 
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-transparent"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {loading ? '...' : card.value}
                  </p>
                </div>
                <div className={`${style.bg} p-3 rounded-full`}>
                  <svg 
                    className={`w-6 h-6 ${style.text}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    {card.icon}
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlannerDashboard;