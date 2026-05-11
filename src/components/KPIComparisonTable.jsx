/**
 * src/components/KPIComparisonTable.jsx
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Reusable table for comparing planned vs actual KPIs side-by-side.
 * Used in DriverReportDetail.
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return '—';
  const mins = Math.round(seconds / 60);
  return `${mins} دقيقة`;
};

const DiffBadge = ({ diff, unit = '', positiveIsBad = true }) => {
  if (diff === null || diff === undefined || diff === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-gray-400 text-xs font-medium">
        <Minus className="w-3 h-3" />
        لا فرق
      </span>
    );
  }
  const isBad = positiveIsBad ? diff > 0 : diff < 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
        isBad ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
      }`}
    >
      {isBad ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {diff > 0 ? '+' : ''}{typeof diff === 'number' ? diff.toFixed(2) : diff} {unit}
    </span>
  );
};

/**
 * @param {{ report: object, plan: object, comparison: object }} props
 */
export default function KPIComparisonTable({ report, plan, comparison }) {
  if (!report || !plan) return null;

  const rows = [
    {
      label: 'المسافة',
      actual: `${report.total_distance_km?.toFixed(2) ?? '0.00'} كم`,
      planned: `${plan.total_distance_km?.toFixed(2) ?? '0.00'} كم`,
      diff: <DiffBadge diff={comparison?.distance_diff_km} unit="كم" />,
    },
    {
      label: 'الزمن',
      actual: formatDuration(report.total_time_seconds),
      planned: formatDuration(plan.total_time_seconds),
      diff: (
        <DiffBadge
          diff={comparison?.time_diff_seconds ? Math.round(comparison.time_diff_seconds / 60) : null}
          unit="دق"
        />
      ),
    },
    {
      label: 'الوقود',
      actual: `${report.fuel_litres?.toFixed(2) ?? '0.00'} لتر`,
      planned: `${plan.fuel_litres?.toFixed(2) ?? '0.00'} لتر`,
      diff: <DiffBadge diff={comparison?.fuel_diff_litres} unit="لتر" />,
    },
    {
      label: 'CO₂',
      actual: `${report.co2_kg?.toFixed(2) ?? '0.00'} كغم`,
      planned: `${plan.co2_kg?.toFixed(2) ?? '0.00'} كغم`,
      diff: <DiffBadge diff={comparison?.co2_diff_kg} unit="كغم" />,
    },
    {
      label: 'توقفات مسجلة',
      actual: `${comparison?.extra_stops ?? 0}`,
      planned: '—',
      diff: null,
    },
    {
      label: 'انحرافات مسار',
      actual: `${comparison?.deviations_count ?? 0}`,
      planned: '—',
      diff: null,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="font-bold text-gray-800 text-base">مقارنة KPIs: المخطط vs الفعلي</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-200">
            <tr>
              <th className="py-3 px-6 font-semibold">المؤشر</th>
              <th className="py-3 px-6 font-semibold text-blue-700">المخطط</th>
              <th className="py-3 px-6 font-semibold text-gray-800">الفعلي</th>
              <th className="py-3 px-6 font-semibold">الفارق</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.label} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-6 font-semibold text-gray-700">{row.label}</td>
                <td className="py-3 px-6 text-blue-700 font-medium">{row.planned}</td>
                <td className="py-3 px-6 text-gray-800 font-bold">{row.actual}</td>
                <td className="py-3 px-6">{row.diff ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
