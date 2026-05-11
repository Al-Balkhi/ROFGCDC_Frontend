import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { driverReportsAPI } from "../services/api";
import { useToast } from "../components/ToastContainer";
import ReportComparisonMap from "../components/ReportComparisonMap";
import KPIComparisonTable from "../components/KPIComparisonTable";
import ExportButton from "../components/ExportButton";
import { ChevronRight, FileText, Info, Loader } from "lucide-react";
import dayjs from "dayjs";

const DriverReportDetail = () => {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const res = await driverReportsAPI.getReport(reportId);
            setReportData(res.data);
        } catch (error) {
            console.error(error);
            addToast("فشل تحميل تفاصيل التقرير", "error");
        } finally {
            setLoading(false);
        }
    }, [reportId, addToast]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    if (loading && !reportData) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!reportData) {
        return (
            <div className="flex flex-col h-[80vh] items-center justify-center text-gray-500">
                <Info className="w-12 h-12 mb-4 text-gray-400" />
                <p>تعذر العثور على التقرير المطلوب</p>
                <button
                    onClick={() => navigate('/dashboard/planner/driver-reports')}
                    className="mt-4 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                >
                    العودة للتقارير
                </button>
            </div>
        );
    }

    const { report, plan, comparison } = reportData;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
            {/* Header / Breadcrumb */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/dashboard/planner/driver-reports')}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">تفاصيل تقرير السائق #{report?.id}</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            السائق: <span className="font-bold text-gray-700">{report?.driver_name || "غير محدد"}</span> • 
                            الخطة: <span className="font-bold text-gray-700">{report?.scenario_name || "مجهولة"}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500">تم الإنجاز في: {dayjs(report?.completed_at || report?.submitted_at).format('YYYY-MM-DD HH:mm')}</span>
                    <div className="flex gap-2">
                        <ExportButton format="pdf" reportId={report?.id} />
                    </div>
                </div>
            </div>

            {/* KPI Comparison Table */}
            <KPIComparisonTable report={report} plan={plan} comparison={comparison} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map Area */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <MapIcon className="w-5 h-5 text-blue-600" />
                            الخريطة والمقارنة
                        </h3>
                    </div>
                    <div className="p-4 relative">
                        {report || plan ? (
                            <ReportComparisonMap report={report} plan={plan} bins={report?.bins || []} />
                        ) : (
                            <div className="h-[500px] flex items-center justify-center bg-gray-50 text-gray-400">
                                لا تتوفر معلومات جغرافية
                            </div>
                        )}
                    </div>
                </div>

                {/* Insights and AI Summary Sidebar */}
                <div className="flex flex-col gap-6">
                    {/* Notes block */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-500" />
                                ملاحظات السائق
                            </h3>
                        </div>
                        <div className="p-5 text-sm text-gray-700 bg-gray-50 min-h-[100px] leading-relaxed">
                            {report?.driver_notes ? (
                                <span>{report.driver_notes}</span>
                            ) : (
                                <span className="text-gray-400 italic">لا توجد ملاحظات مسجلة.</span>
                            )}
                        </div>
                    </div>

                </div>
            </div>
            
            {/* Stops and Deviations Table */}
            {((report?.stops?.length > 0) || (report?.deviations?.length > 0)) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-bold text-gray-800">أحداث الرحلة بالتفصيل</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-6 font-semibold">نوع الحدث</th>
                                    <th className="py-3 px-6 font-semibold">السبب</th>
                                    <th className="py-3 px-6 font-semibold">الوقت/المدة</th>
                                    <th className="py-3 px-6 font-semibold">ملاحظات إضافية</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {report?.stops?.map((stop, i) => (
                                    <tr key={`stop-${i}`} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="py-3 px-6">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div> وقف
                                            </span>
                                        </td>
                                        <td className="py-3 px-6 font-medium text-gray-800">{stop.reason || "غير محدد"}</td>
                                        <td className="py-3 px-6 text-gray-600">
                                            المتوقع: {stop.duration_seconds || 0} ثانية
                                        </td>
                                        <td className="py-3 px-6 text-gray-500 max-w-sm truncate">{stop.note || "-"}</td>
                                    </tr>
                                ))}
                                {report?.deviations?.map((dev, i) => (
                                    <tr key={`dev-${i}`} className="hover:bg-red-50/30 transition-colors">
                                        <td className="py-3 px-6">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-100 text-red-700 font-semibold text-xs border border-red-200">
                                                <div className="w-2 h-2 rounded-full bg-red-500"></div> انحراف
                                            </span>
                                        </td>
                                        <td className="py-3 px-6 font-medium text-gray-800">{dev.reason || "غير محدد"}</td>
                                        <td className="py-3 px-6 text-gray-600">
                                            {dev.timestamp ? dayjs(dev.timestamp).format("HH:mm:ss") : "-"}
                                        </td>
                                        <td className="py-3 px-6 text-gray-500 max-w-sm truncate">{dev.note || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// Simple Map icon component
const MapIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
);

export default DriverReportDetail;
