export default function Timeline({ items = [] }) {
  return (
    <div className="relative pl-5">
      {/* vertical line */}
      <div className="absolute left-[7px] top-1 bottom-1 w-px bg-ipb-100" />
      {items.map((it, i) => (
        <div key={i} className={`relative ${i < items.length - 1 ? 'mb-4' : ''}`}>
          {/* dot */}
          <div
            className={`absolute -left-[18px] top-[3px] w-2.5 h-2.5 rounded-full border-2 transition-all
              ${it.status === 'done'
                ? 'bg-ipb-400 border-ipb-400'
                : it.status === 'current'
                  ? 'bg-white border-ipb-500 shadow-[0_0_0_3px_#D6E9FA]'
                  : 'bg-gray-50 border-gray-100'
              }`}
          />
          {/* title + time */}
          <div className="flex items-center justify-between mb-0.5">
            <span className={`text-[12px] font-semibold
              ${it.status === 'done'    ? 'text-ipb-900'
              : it.status === 'current' ? 'text-ipb-600'
              : 'text-gray-300'}`}>
              {it.title}
            </span>
            <span className="text-[9px] text-gray-400 ml-2 shrink-0">{it.time}</span>
          </div>
          {/* note */}
          {it.note && (
            <div className="text-[11px] text-gray-600 bg-ipb-50 border border-ipb-100 rounded px-2 py-1.5 mt-1 leading-relaxed">
              {it.note}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
