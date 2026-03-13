/**
 * ReportActionModal — confirmation modal for taking action on a pending report.
 * Handles three action types: immediate plan, new bin request, bin resize request.
 *
 * @param {object}   report      - The report being acted upon
 * @param {string}   actionType  - 'immediate' | 'new_bin' | 'resize_bin'
 * @param {string}   capacity    - Controlled input value for bin capacity
 * @param {string}   note        - Controlled input value for admin note
 * @param {function} setCapacity - Setter for capacity
 * @param {function} setNote     - Setter for note
 * @param {function} onConfirm   - Called to submit the action
 * @param {function} onCancel    - Called to dismiss the modal
 */
const ACTION_TITLES = {
  immediate: "تأكيد إنشاء خطة فورية",
  new_bin: "طلب حاوية جديدة",
  resize_bin: "طلب تغيير حاوية",
};

const ReportActionModal = ({
  report,
  actionType,
  capacity,
  note,
  setCapacity,
  setNote,
  onConfirm,
  onCancel,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">
          {ACTION_TITLES[actionType] ?? "إجراء"}
        </h3>
      </div>

      {/* Body */}
      <div className="p-6">
        <p className="text-sm text-gray-600 mb-4">
          الإجراء للبلاغ رقم #{report.id}
        </p>

        {(actionType === "new_bin" || actionType === "resize_bin") && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              السعة المطلوبة{" "}
              {actionType === "resize_bin" ? "(لتعديل الحاوية القريبة)" : ""}
            </label>
            <select
              className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm mb-4"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            >
              <option value="" disabled>اختر السعة (لتر)</option>
              <option value="240">240</option>
              <option value="660">660</option>
              <option value="1100">1100</option>
            </select>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات للأدمن (اختياري)
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="اكتب التبرير أو المواصفات المطلوبة..."
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={actionType === "resize_bin" && !capacity}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 focus:outline-none disabled:bg-gray-400"
          >
            تأكيد الإجراء
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default ReportActionModal;
