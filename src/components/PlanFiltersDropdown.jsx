import { WEEKDAY_NAMES } from "../constants/labels";

/**
 * PlanFiltersDropdown — filter panel for the PlannerScenarios page.
 *
 * Extracted from PlannerScenarios.jsx where it was defined as a local
 * component at file scope, making it impossible to test in isolation.
 *
 * @param {string}   filterStatus          - Current status filter ('all'|'active'|'archived')
 * @param {function} setFilterStatus       - Setter for filterStatus
 * @param {Array}    municipalities        - List of municipality objects {id, name}
 * @param {string}   selectedMunicipality  - Current municipality filter value
 * @param {function} setSelectedMunicipality - Setter
 * @param {string}   weekDayFilter         - Current weekday filter value
 * @param {function} setWeekDayFilter      - Setter
 * @param {string}   activeTab             - 'scenarios' | 'templates'
 * @param {function} onReset               - Resets all filters
 * @param {function} onClose               - Closes the dropdown
 */
const PlanFiltersDropdown = ({
  filterStatus,
  setFilterStatus,
  municipalities,
  selectedMunicipality,
  setSelectedMunicipality,
  weekDayFilter,
  setWeekDayFilter,
  activeTab,
  onReset,
  onClose,
}) => (
  <div className="absolute top-12 left-0 w-72 bg-white border rounded-lg shadow-xl z-50 p-4 animate-fade-in-down">
    <div className="flex justify-between items-center mb-4 border-b pb-2">
      <h3 className="font-bold text-gray-700">تصفية الخطط</h3>
    </div>

    {/* حالة الخطة — يظهر فقط في الخطط اليومية */}
    {activeTab === "scenarios" && (
      <div className="mb-4 animate-fade-in">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
          حالة الخطة
        </label>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {[
            { value: "active", label: "قيد الانجاز" },
            { value: "archived", label: "منجزة" },
            { value: "all", label: "الكل" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterStatus(value)}
              className={`flex-1 py-1 text-sm rounded-md transition-all ${
                filterStatus === value
                  ? "bg-white text-blue-600 shadow-sm font-semibold"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    )}

    {/* البلدية */}
    <div className="mb-4">
      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
        البلدية
      </label>
      <select
        value={selectedMunicipality}
        onChange={(e) => setSelectedMunicipality(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
      >
        <option value="">كافة البلديات</option>
        {municipalities.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </div>

    {/* يوم الأسبوع */}
    <div className="mb-4">
      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
        يوم الأسبوع
      </label>
      <select
        value={weekDayFilter}
        onChange={(e) => setWeekDayFilter(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
      >
        <option value="">كافة الأيام</option>
        {WEEKDAY_NAMES.map((day, index) => (
          <option key={index} value={index}>
            {day}
          </option>
        ))}
      </select>
    </div>

    {/* Actions */}
    <div className="flex gap-3 mt-6">
      <button
        onClick={onReset}
        className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        إعادة تعيين
      </button>
      <button
        onClick={onClose}
        className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
      >
        تم
      </button>
    </div>
  </div>
);

export default PlanFiltersDropdown;
