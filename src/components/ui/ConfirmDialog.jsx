import { AlertTriangle } from 'lucide-react'

/**
 * ConfirmDialog — dark glassmorphism confirmation modal.
 *
 * Props:
 *   isOpen    {boolean}  — whether the dialog is visible
 *   title     {string}   — dialog heading
 *   message   {string}   — body text
 *   onConfirm {function} — called when user clicks the red confirm button
 *   onCancel  {function} — called when user clicks Cancel or the backdrop
 */
export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="glass-panel w-full max-w-sm p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon + Title */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
        </div>

        {/* Message */}
        <p className="mb-6 text-sm leading-relaxed text-white/60">{message}</p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 transition-all hover:bg-white/5 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl border border-red-500/30 bg-red-500/15 px-4 py-2.5 text-sm font-medium text-red-400 transition-all hover:bg-red-500/25 hover:text-red-300"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
