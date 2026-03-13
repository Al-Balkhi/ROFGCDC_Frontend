/**
 * ConfirmDialog — a styled modal that replaces window.confirm().
 *
 * Usage:
 *   const [confirmState, setConfirmState] = useState({ open: false, message: "", onConfirm: null });
 *
 *   // To trigger:
 *   setConfirmState({ open: true, message: "هل أنت متأكد؟", onConfirm: () => doDelete() });
 *
 *   // In JSX:
 *   <ConfirmDialog
 *     open={confirmState.open}
 *     message={confirmState.message}
 *     onConfirm={() => { confirmState.onConfirm?.(); setConfirmState({ open: false }); }}
 *     onCancel={() => setConfirmState({ open: false })}
 *   />
 *
 * @param {boolean}  open        - Whether the dialog is visible
 * @param {string}   message     - The confirmation message shown to the user
 * @param {string}   [confirmLabel='تأكيد'] - Text for the confirm button
 * @param {string}   [cancelLabel='إلغاء'] - Text for the cancel button
 * @param {'danger'|'warning'} [variant='danger'] - Controls confirm button color
 * @param {function} onConfirm   - Called when the user clicks confirm
 * @param {function} onCancel    - Called when the user clicks cancel or the overlay
 */
const ConfirmDialog = ({
  open,
  message,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  variant = "danger",
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const confirmClasses =
    variant === "warning"
      ? "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
      : "bg-red-600 hover:bg-red-700 focus:ring-red-500";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        dir="rtl"
      >
        {/* Icon */}
        <div className="flex justify-center pt-6 pb-2">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              variant === "warning" ? "bg-orange-100" : "bg-red-100"
            }`}
          >
            <svg
              className={`w-6 h-6 ${
                variant === "warning" ? "text-orange-600" : "text-red-600"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>
        </div>

        {/* Message */}
        <div className="px-6 py-4 text-center">
          <p className="text-gray-700 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 transition-colors ${confirmClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
