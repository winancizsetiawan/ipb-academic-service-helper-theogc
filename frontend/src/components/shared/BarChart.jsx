export default function BarChart({ bars = [], height = 110 }) {
  const max = Math.max(...bars.map(b => b.value), 1)
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {bars.map((b, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[9px] font-semibold text-ipb-600">{b.value || '—'}</span>
          <div
            className="w-full rounded-t-sm min-h-[3px] transition-all duration-500"
            style={{
              background: b.color || '#378ADD',
              height: `${(b.value / max) * 85}%`,
            }}
          />
          <span className="text-[8px] text-gray-400 text-center leading-tight">{b.label}</span>
        </div>
      ))}
    </div>
  )
}
