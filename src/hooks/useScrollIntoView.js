import { useEffect } from "react";

/**
 * useScrollIntoView — scrolls the element with id `{prefix}-{targetId}`
 * into view when both targetId and data are present.
 *
 * Replaces the repeated inline useEffect + setTimeout pattern found in
 * AdminBinRequests, PlannerScenarios, and CitizenReports.
 *
 * @param {string|null} targetId  - The ID to match (from a URL search param)
 * @param {Array}       data      - The list of loaded items; scroll triggers when non-empty
 * @param {object}      [options]
 * @param {string}      [options.prefix='row']  - DOM id prefix (e.g. "report", "scenario", "request")
 * @param {number}      [options.delay=300]     - Milliseconds before attempting scroll
 */
export function useScrollIntoView(
  targetId,
  data,
  { prefix = "row", delay = 300 } = {},
) {
  useEffect(() => {
    if (!targetId || !data?.length) return;

    const timer = setTimeout(() => {
      const element = document.getElementById(`${prefix}-${targetId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [targetId, data, prefix, delay]);
}
