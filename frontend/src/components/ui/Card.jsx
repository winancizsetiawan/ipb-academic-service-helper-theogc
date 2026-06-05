export default function Card({ children, className = '', padded = false, ...props }) {
  return (
    <div
      className={`bg-white rounded-lg border border-ipb-50 shadow-sm ${padded ? 'p-5' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', action }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 border-b border-ipb-50 ${className}`}>
      <div className="text-[13px] font-bold text-ipb-900">{children}</div>
      {action && <div>{action}</div>}
    </div>
  )
}
