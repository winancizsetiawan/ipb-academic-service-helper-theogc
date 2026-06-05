export default function StatCard({ icon, val, label, trend, trendUp, color = 'text-ipb-700', className = '' }) {
  return (
    <div className={`bg-white rounded-lg border border-ipb-50 shadow-sm p-4 ${className}`}>
      {icon && <div className="text-sm mb-1">{icon}</div>}
      <div className={`text-2xl font-bold leading-none ${color}`}>{val}</div>
      <div className="text-[11px] text-gray-500 mt-1">{label}</div>
      {trend && (
        <div className={`text-[10px] font-semibold mt-1.5 ${trendUp ? 'text-green-700' : 'text-danger-700'}`}>
          {trend}
        </div>
      )}
    </div>
  )
}
