import StatusBadge from "../StatusBadge";
import { getIssueTypeLabel, BASE_API_URL } from "../../constants/labels";

/**
 * ReportDetailsModal — full-screen modal for viewing a report's details,
 * media attachments (with lightbox), and taking actions on pending reports.
 *
 * @param {object}   report        - The report to display
 * @param {function} onClose       - Closes this modal
 * @param {function} onAction      - Called with (report, actionType) when an action button is clicked
 * @param {function} onDelete      - Called when the delete button is clicked
 * @param {function} onImageClick  - Called with imageUrl when a thumbnail is clicked
 */
const ReportDetailsModal = ({
  report,
  onClose,
  onAction,
  onDelete,
  onImageClick,
}) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 className="text-lg font-bold text-gray-900">
          تفاصيل البلاغ رقم #{report.id}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1"
          aria-label="إغلاق"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="p-6 overflow-y-auto">
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded-lg flex flex-col">
            <span className="text-xs text-gray-500 mb-1">النوع</span>
            <span className="font-semibold text-gray-800">
              {getIssueTypeLabel(report.issue_type)}
            </span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg flex flex-col">
            <span className="text-xs text-gray-500 mb-1">الحالة</span>
            <StatusBadge
              status={report.status}
              variant="report"
              className="self-start mt-1"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-2">
            الوصف
          </h4>
          <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
            {report.description || "لا يوجد وصف متاح لهذا البلاغ"}
          </p>
        </div>

        {/* Media Grid */}
        {report.media && report.media.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-2">
              المرفقات ({report.media.length})
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {report.media.map((m) => {
                const imageUrl = m.image.startsWith("http")
                  ? m.image
                  : `${BASE_API_URL}${m.image}`;
                return (
                  <img
                    key={m.id}
                    src={imageUrl}
                    alt="Report attachment"
                    className="w-full h-24 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity border border-gray-200"
                    loading="lazy"
                    onClick={() => onImageClick(imageUrl)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer — pending reports */}
      {report.status === "pending" && (
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-3">
          {report.issue_type === "container_full" ? (
            <>
              <button
                onClick={() => onAction(report, "immediate")}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors shadow-sm"
              >
                إنشاء خطة جمع فورية
              </button>
              <button
                onClick={() => onAction(report, "resize_bin")}
                className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold py-2.5 px-3 rounded-lg text-sm transition-colors border border-orange-200 shadow-sm"
              >
                تغيير حجم حاوية
              </button>
            </>
          ) : report.issue_type === "no_container" ? (
            <button
              onClick={() => onAction(report, "new_bin")}
              className="w-full bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-2.5 px-3 rounded-lg text-sm transition-colors border border-green-200 shadow-sm"
            >
              طلب حاوية جديدة
            </button>
          ) : null}
        </div>
      )}

      {/* Delete Footer — processed reports */}
      {report.status === "processed" && (
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={() => onDelete(report.id)}
            className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors border border-red-200 shadow-sm flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            حذف البلاغ
          </button>
        </div>
      )}
    </div>
  </div>
);

export default ReportDetailsModal;
