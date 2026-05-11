/**
 * src/components/AISummaryPanel.jsx
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * AI summary generation modal + result display.
 * Opens a modal to select a time range, fetches reports,
 * then calls the AI summary endpoint and displays the result.
 */

import { useState } from 'react';
import { Zap, Loader, X } from 'lucide-react';
import { driverReportsAPI } from '../services/api';
import { useToast } from './ToastContainer';
import dayjs from 'dayjs';

const RANGES = [
  { key: 'last_day', label: 'اليوم الماضي', days: 1 },
  { key: 'last_week', label: 'الأسبوع الماضي', days: 7 },
  { key: 'last_month', label: 'الشهر الماضي', days: 30 },
];

export default function AISummaryPanel() {
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [selectedRange, setSelectedRange] = useState('last_day');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const range = RANGES.find((r) => r.key === selectedRange);
      const dateTo = dayjs().format('YYYY-MM-DD');
      const dateFrom = dayjs().subtract(range.days, 'day').format('YYYY-MM-DD');

      const res = await driverReportsAPI.getReports({
        date_from: dateFrom,
        date_to: dateTo,
      });
      const reports = res.data?.results || res.data || [];
      if (!reports.length) {
        addToast('لا توجد تقارير في الفترة المحددة', 'error');
        setLoading(false);
        return;
      }

      const reportIds = reports.map((r) => r.id);
      const summaryRes = await driverReportsAPI.generateAISummary({
        report_ids: reportIds,
      });
      if (summaryRes.data?.summary) {
        setSummary(summaryRes.data.summary);
        addToast('تم التحليل بنجاح', 'success');
        setShowModal(false);
      } else {
        addToast('لم يتم إرجاع ملخص من الخادم', 'error');
      }
    } catch {
      addToast('فشل التحليل بالذكاء الاصطناعي', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      {/* Trigger button */}
      {!summary && (
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors flex items-center gap-2 shadow-sm mx-auto"
        >
          <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
          تحليل ذكي للتقارير
        </button>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">تحليل ذكي للتقارير</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">اختر الفترة الزمنية للتحليل:</p>
            <div className="space-y-2 mb-6">
              {RANGES.map((r) => (
                <label
                  key={r.key}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    selectedRange === r.key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="range"
                    value={r.key}
                    checked={selectedRange === r.key}
                    onChange={(e) => setSelectedRange(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">{r.label}</span>
                </label>
              ))}
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                'بدء التحليل'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Summary display */}
      {summary && (
        <div className="bg-gradient-to-b from-blue-50 to-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-blue-100 flex justify-between items-center bg-white/50">
            <h3 className="font-bold text-blue-900 flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              ملخص ذكي
            </h3>
            <button
              onClick={() => setShowModal(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              إعادة التحليل
            </button>
          </div>
          <div className="p-5 text-sm">
            <div className="text-gray-700 leading-relaxed space-y-2 max-h-96 overflow-y-auto">
              {summary.split('\n').filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
