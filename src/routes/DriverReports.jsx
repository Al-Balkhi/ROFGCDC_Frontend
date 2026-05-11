import { useState, useEffect, useCallback, useMemo } from "react";
import { driverReportsAPI } from "../services/api";
import Table from "../components/Table";
import Pagination from "../components/Pagination";
import { useToast } from "../components/ToastContainer";
import { DRIVER_TASK_STATUS } from "../constants/labels";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import AISummaryPanel from "../components/AISummaryPanel";

const DriverReports = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const DEBOUNCE_DELAY = 300;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchReports = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page };
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await driverReportsAPI.getReports(params);
      if (res.data?.results) {
        setReports(res.data.results);
        setTotalCount(res.data.count);
      } else if (Array.isArray(res.data)) {
        setReports(res.data);
        setTotalCount(res.data.length);
      } else {
        setReports([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error(error);
      addToast("فشل تحميل تقارير السائقين", "error");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, addToast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchReports(currentPage);
  }, [fetchReports, currentPage]);

  const handleExportPdf = async () => {
    try {
      addToast(`جاري تصدير التقرير كـ PDF...`, "info");
      const res = await driverReportsAPI.exportReports('pdf');
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'driver_reports.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      addToast("تم التصدير بنجاح", "success");
    } catch (err) {
      console.error(err);
      addToast("فشل في التصدير", "error");
    }
  };

  const handleExportCsv = () => {
    if (!reports.length) {
      addToast("لا توجد تقارير للتصدير", "error");
      return;
    }
    const headers = [
      'رقم التقرير',
      'اسم السائق',
      'المهمة / الخطة',
      'تاريخ الجمع',
      'تاريخ الإنجاز',
      'المسافة (كم)',
      'الزمن (دقيقة)',
      'الوقود (لتر)',
      'CO₂ (كغ)',
      'التوقفات',
      'الانحرافات',
      'تم التقديم',
    ];
    const rows = reports.map((r) => [
      r.id,
      r.driver_name || '-',
      r.scenario_name || '-',
      r.collection_date || '-',
      r.completed_at ? dayjs(r.completed_at).format('YYYY-MM-DD HH:mm') : '-',
      r.total_distance_km?.toFixed(2) ?? '0.00',
      r.total_time_seconds ? Math.round(r.total_time_seconds / 60) : '0',
      r.fuel_litres?.toFixed(2) ?? '0.00',
      r.co2_kg?.toFixed(2) ?? '0.00',
      r.stops_count ?? 0,
      r.deviations_count ?? 0,
      r.is_submitted ? 'نعم' : 'لا',
    ]);
    const csvContent = '\uFEFF' + [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `driver_reports_${dayjs().format('YYYY-MM-DD')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    addToast("تم تصدير CSV بنجاح", "success");
  };

  const columns = useMemo(() => [
    { key: "id", label: "رقم التقرير" },
    { key: "driver_name", label: "اسم السائق", render: (_, row) => row.driver_name || "-" },
    { key: "scenario_name", label: "اسم الخطة", render: (_, row) => row.scenario_name || "-" },
    {
      key: "collection_date",
      label: "تاريخ الجمع",
      render: (_, row) => row.collection_date || "-",
    },
    {
      key: "completed_at",
      label: "تاريخ الإنجاز",
      render: (_, row) => row.completed_at ? dayjs(row.completed_at).format('YYYY-MM-DD HH:mm') : "-",
    },
    {
      key: "status",
      label: "الحالة",
      render: (_, row) => {
        const status = row.task_status || "completed";
        const s = DRIVER_TASK_STATUS[status] || DRIVER_TASK_STATUS._unknown;
        return (
          <span className={`px-2 py-1 rounded text-xs font-semibold ${s.classes}`}>
            {s.label}
          </span>
        );
      }
    },
    {
      key: "actions",
      label: "إجراءات",
      render: (_, row) => (
        <button
          onClick={() => navigate(`/dashboard/planner/driver-reports/${row.id}`)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors border border-blue-600 px-3 py-1 rounded-full hover:bg-blue-50"
        >
          عرض التفاصيل
        </button>
      ),
    },
  ], [navigate]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">تقارير السائقين</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportCsv}
            className="bg-green-600 text-white px-4 py-2 rounded shadow-sm hover:bg-green-700 transition text-sm"
          >
            تصدير جدول CSV
          </button>
          <button
            onClick={handleExportPdf}
            className="bg-red-600 text-white px-4 py-2 rounded shadow-sm hover:bg-red-700 transition text-sm"
          >
            تصدير PDF
          </button>
        </div>
      </div>

      <div className="mb-6 flex gap-4 items-center">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="ابحث باسم السائق أو الخطة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pl-10"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>
      </div>

      <Table
        columns={columns}
        data={reports}
        loading={loading}
      />

      <Pagination
        currentPage={currentPage}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      <AISummaryPanel />
    </div>
  );
};

export default DriverReports;
