import StatusBadge from "../StatusBadge";
import { getIssueTypeLabel } from "../../constants/labels";

/**
 * ReportCard — a single list-view card for a citizen report.
 *
 * @param {object}   report        - The report object from the API
 * @param {boolean}  isHighlighted - Whether this card is the deep-link target
 * @param {function} onClick       - Opens the details modal for this report
 */
const ReportCard = ({ report, isHighlighted, onClick }) => (
  <div
    id={`report-${report.id}`}
    className={`bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${
      isHighlighted
        ? "border-blue-400 ring-1 ring-blue-400 bg-blue-50/30"
        : "border-gray-100"
    }`}
    onClick={onClick}
  >
    <div className="p-5">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <StatusBadge status={report.status} variant="report" />
          <div className="text-xs text-gray-600">
            النوع:{" "}
            <span className="font-semibold">
              {getIssueTypeLabel(report.issue_type)}
            </span>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-1 line-clamp-2">
        {report.description || "لا يوجد وصف متاح لهذا البلاغ"}
      </div>
    </div>
  </div>
);

export default ReportCard;
