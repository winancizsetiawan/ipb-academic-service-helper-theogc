import { X } from 'lucide-react'

const COLORS = {
  success: 'bg-green-700',
  error:   'bg-danger-700',
  warn:    'bg-amber-700',
  info:    'bg-ipb-700',
}

export default function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 ${COLORS[t.type] || COLORS.info} text-white px-4 py-3 rounded-lg shadow-lg text-[12px] font-medium max-w-xs pointer-events-auto toast-enter`}
        >
          <span className="text-base flex-shrink-0">{t.icon}</span>
          <span className="flex-1">{t.msg}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="text-white/60 hover:text-white ml-1"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
