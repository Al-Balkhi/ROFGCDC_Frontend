/**
 * src/components/ExportButton.jsx
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * PDF/Excel export button for driver reports.
 * Handles blob download with loading state + toast feedback.
 */

import { useState } from 'react';
import { DownloadCloud, Loader } from 'lucide-react';
import { driverReportsAPI } from '../services/api';
import { useToast } from './ToastContainer';

const FORMAT_LABELS = {
  pdf: { label: 'PDF', mime: 'application/pdf', ext: 'pdf' },
  excel: { label: 'Excel', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: 'xlsx' },
};

/**
 * @param {{
 *   format: 'pdf' | 'excel',
 *   reportId?: number | string,
 *   startDate?: string,
 *   endDate?: string,
 *   className?: string,
 * }} props
 */
export default function ExportButton({ format = 'excel', reportId, startDate, endDate, className = '' }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const cfg = FORMAT_LABELS[format] ?? FORMAT_LABELS.excel;

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await driverReportsAPI.exportReports(format, startDate, endDate, reportId);

      // Build a blob URL and trigger the download
      const blob = new Blob([res.data], { type: cfg.mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = reportId
        ? `report_${reportId}_${new Date().toISOString().slice(0, 10)}.${cfg.ext}`
        : `driver_reports_${new Date().toISOString().slice(0, 10)}.${cfg.ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      addToast(`تم تصدير التقرير بصيغة ${cfg.label} بنجاح`, 'success');
    } catch {
      addToast(`فشل تصدير التقرير بصيغة ${cfg.label}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${format === 'pdf'
          ? 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100'
          : 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
        } ${className}`}
    >
      {loading ? (
        <Loader className="w-4 h-4 animate-spin" />
      ) : (
        <DownloadCloud className="w-4 h-4" />
      )}
      {loading ? 'جاري التصدير...' : `تصدير ${cfg.label}`}
    </button>
  );
}
