import { REPORT_STATUS, BIN_REQUEST_STATUS } from "../constants/labels";

/**
 * StatusBadge — renders a colored pill badge for a status value.
 *
 * Replaces all inline ternary-chain status badge patterns across the app.
 *
 * @param {string}  status    - The status key (e.g. "pending", "processing")
 * @param {'report'|'request'} [variant='report'] - Which label map to use
 * @param {string}  [className] - Optional extra Tailwind classes
 */
const STATUS_MAPS = {
  report: REPORT_STATUS,
  request: BIN_REQUEST_STATUS,
};

const StatusBadge = ({ status, variant = "report", className = "" }) => {
  const map = STATUS_MAPS[variant] ?? REPORT_STATUS;
  const config = map[status] ?? map._unknown;

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${config.classes} ${className}`.trim()}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
