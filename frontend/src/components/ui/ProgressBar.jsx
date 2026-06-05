export default function ProgressBar({ pct = 0, color, size = 'md', showLabel = false }) {
  const heights = { sm: 'h-1', md: 'h-1.5', lg: 'h-2.5' }
  const bg = color || 'bg-gradient-to-r from-ipb-400 to-ipb-300'
  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span>Progres</span>
          <span className="font-semibold text-ipb-500">{pct}%</span>
        </div>
      )}
      <div className={`w-full bg-ipb-100 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${heights[size]} rounded-full transition-all duration-500 ${bg}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}
