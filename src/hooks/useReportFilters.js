import { useState, useMemo } from "react";

/**
 * useReportFilters — encapsulates all filter/sort state and the derived
 * filtered-and-sorted report list for the CitizenReports page.
 *
 * Extracted from CitizenReports.jsx to keep the route component focused
 * on data fetching and user interactions.
 *
 * @param {Array} reports - The raw (unfiltered) list of reports from the API
 * @returns {object} Filter state, setters, activeFilters count, computed list, resetFilters
 */
export function useReportFilters(reports) {
  const [filterType, setFilterType] = useState("all");
  const [filterRecency, setFilterRecency] = useState("newest");
  const [filterImportance, setFilterImportance] = useState("highest");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  /** Number of filters currently active (used for the badge counter on the filter button) */
  const activeFilters = [
    filterType !== "all",
    filterRecency !== "newest",
    filterImportance !== "highest",
    filterStatus !== "all",
  ].filter(Boolean).length;

  /** Filtered + sorted derive of reports — recomputes only when inputs change */
  const filteredAndSortedReports = useMemo(() => {
    let result = [...reports];

    if (filterType !== "all") {
      result = result.filter((r) => r.issue_type === filterType);
    }
    if (filterStatus !== "all") {
      result = result.filter((r) => r.status === filterStatus);
    }

    result.sort((a, b) => {
      // Primary sort: urgency score (if the importance filter is active)
      if (
        filterImportance === "highest" &&
        a.urgency_score !== b.urgency_score
      ) {
        return b.urgency_score - a.urgency_score;
      }
      if (
        filterImportance === "lowest" &&
        a.urgency_score !== b.urgency_score
      ) {
        return a.urgency_score - b.urgency_score;
      }
      // Secondary sort: date
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return filterRecency === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [reports, filterType, filterRecency, filterImportance, filterStatus]);

  /** Resets all filters to their default values and closes the dropdown */
  const resetFilters = () => {
    setFilterType("all");
    setFilterRecency("newest");
    setFilterImportance("highest");
    setFilterStatus("all");
    setShowFilters(false);
  };

  return {
    filterType,
    setFilterType,
    filterRecency,
    setFilterRecency,
    filterImportance,
    setFilterImportance,
    filterStatus,
    setFilterStatus,
    showFilters,
    setShowFilters,
    activeFilters,
    filteredAndSortedReports,
    resetFilters,
  };
}
