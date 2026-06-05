import { useEffect } from 'react'
import { X } from 'lucide-react'
import Button from './Button'

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg', footer }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-ipb-900/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`bg-white rounded-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto shadow-lg`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-ipb-50 sticky top-0 bg-white z-10">
          <h2 className="text-[15px] font-bold text-ipb-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded p-1 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-ipb-50">{footer}</div>
        )}
      </div>
    </div>
  )
}
