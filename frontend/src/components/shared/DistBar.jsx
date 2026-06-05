export default function DistBar({ items = [] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((it, i) => (
        <div key={i} className="flex items-center justify-between text-[11px]">
          <span className="flex-1 text-gray-700">{it.label}</span>
          <div className="flex items-center gap-1.5">
            <div className="w-20 h-1.5 rounded-full overflow-hidden bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${it.pct}%`, background: it.color }}
              />
            </div>
            <strong className="text-[10px] min-w-[28px] text-right text-gray-600">
              {it.pct}%
            </strong>
          </div>
        </div>
      ))}
    </div>
  )
}
