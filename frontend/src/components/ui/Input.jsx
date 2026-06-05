import { forwardRef } from 'react'

const baseClass = 'w-full border border-ipb-200 rounded-md text-[12px] text-gray-900 bg-white outline-none transition-all focus:border-ipb-400 focus:ring-2 focus:ring-ipb-100 placeholder:text-gray-300 disabled:bg-gray-50 disabled:text-gray-400'

export const Input = forwardRef(({ className = '', error, ...props }, ref) => (
  <input
    ref={ref}
    className={`${baseClass} h-9 px-3 ${error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-100' : ''} ${className}`}
    {...props}
  />
))
Input.displayName = 'Input'

export const Select = forwardRef(({ className = '', children, ...props }, ref) => (
  <select
    ref={ref}
    className={`${baseClass} h-9 px-3 cursor-pointer appearance-none bg-no-repeat bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%23888' d='M5 7L1 3h8z'/%3E%3C/svg%3E")] bg-[right_10px_center] ${className}`}
    {...props}
  >
    {children}
  </select>
))
Select.displayName = 'Select'

export const Textarea = forwardRef(({ className = '', rows = 4, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={`${baseClass} p-2.5 resize-y min-h-[80px] ${className}`}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export function FormGroup({ label, required, hint, error, children, className = '' }) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
          {label}{required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-[10px] text-danger-600 mt-1">{error}</p>}
    </div>
  )
}

export default Input
