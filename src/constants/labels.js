/**
 * labels.js — Single source of truth for all display strings,
 * CSS classes, and shared constants across the application.
 *
 * ✅ Usage:
 *   import { REPORT_STATUS, ISSUE_TYPE_LABELS, BASE_API_URL } from "../constants/labels";
 */

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

/** Resolved backend base URL — use everywhere instead of repeating the literal. */
export const BASE_API_URL =
  import.meta.env.VITE_BASE_API_URL || "http://localhost:8000";

// ---------------------------------------------------------------------------
// Citizen Report Status
// ---------------------------------------------------------------------------

/**
 * Map of report status value → display label + Tailwind badge classes.
 *
 * @example
 * const { label, classes } = REPORT_STATUS[report.status] ?? REPORT_STATUS._unknown;
 */
export const REPORT_STATUS = {
  pending: {
    label: "قيد الانتظار",
    classes: "bg-yellow-100 text-yellow-800",
    textClass: "text-yellow-700",
  },
  processing: {
    label: "قيد المعالجة",
    classes: "bg-blue-100 text-blue-800",
    textClass: "text-blue-700",
  },
  processed: {
    label: "معالج",
    classes: "bg-green-100 text-green-800",
    textClass: "text-green-700",
  },
  /** Fallback for any unrecognised status string. */
  _unknown: {
    label: "غير محدد",
    classes: "bg-gray-100 text-gray-700",
    textClass: "text-gray-600",
  },
};

// ---------------------------------------------------------------------------
// Issue Types
// ---------------------------------------------------------------------------

/**
 * Map of report issue_type value → Arabic label.
 * Use getIssueTypeLabel() for a safe lookup with a built-in fallback.
 */
export const ISSUE_TYPE_LABELS = {
  no_container: "لا توجد حاوية",
  container_full: "امتلاء الحاوية",
};

/**
 * Returns the Arabic label for an issue type, with a "غير محدد" fallback.
 * Replaces the local `issueTypeLabel` functions defined in multiple files.
 */
export const getIssueTypeLabel = (issueType) =>
  ISSUE_TYPE_LABELS[issueType] ?? "غير محدد";

// ---------------------------------------------------------------------------
// Bin Request Status
// ---------------------------------------------------------------------------

/**
 * Map of bin-request status value → display label + Tailwind badge classes.
 */
export const BIN_REQUEST_STATUS = {
  pending: {
    label: "قيد الانتظار",
    classes: "bg-yellow-100 text-yellow-800",
  },
  approved: {
    label: "موافق عليه",
    classes: "bg-green-100 text-green-800",
  },
  rejected: {
    label: "مرفوض",
    classes: "bg-red-100 text-red-800",
  },
  _unknown: {
    label: "غير محدد",
    classes: "bg-gray-100 text-gray-700",
  },
};

// ---------------------------------------------------------------------------
// Collection Plan / Scenario Status
// ---------------------------------------------------------------------------

/**
 * Map of scenario status value → display label + Tailwind badge classes.
 */
export const SCENARIO_STATUS = {
  pending: {
    label: "معلقة",
    classes: "bg-yellow-100 text-yellow-700",
  },
  in_progress: {
    label: "قيد الانجاز",
    classes: "bg-blue-100 text-blue-700",
  },
  completed: {
    label: "منجزة",
    classes: "bg-green-100 text-green-700",
  },
  _unknown: {
    label: "غير محدد",
    classes: "bg-gray-100 text-gray-700",
  },
};

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

/**
 * Arabic day names indexed 0 (Saturday) → 6 (Friday),
 * matching the backend week_day convention.
 *
 * Replaces two duplicate inline arrays in PlannerScenarios.jsx.
 */
export const WEEKDAY_NAMES = [
  "السبت",
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];
