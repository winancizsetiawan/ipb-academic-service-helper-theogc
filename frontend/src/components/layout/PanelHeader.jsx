import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function PanelHeader({ title, subtitle, type = 'staff', actions }) {
  const { user } = useAuth()
  const isAdmin  = type === 'admin'
  const accent   = isAdmin ? '#BA7517' : '#378ADD'
  const profLink = isAdmin ? '/admin/profil' : '/staff/profil'

  return (
    <div
      className="flex items-center justify-between px-5 py-3 sticky top-0 z-40"
      style={{
        background: isAdmin ? '#021A34' : '#0C447C',
        borderBottom: isAdmin ? `2px solid #BA7517` : 'none',
      }}
    >
      <div>
        <div className="text-white text-[13px] font-bold">{title}</div>
        {subtitle && <div className="text-ipb-200 text-[10px] mt-px">{subtitle}</div>}
      </div>

      <div className="flex items-center gap-2">
        {actions}
        <Link to={profLink}
          className="flex items-center gap-1.5 bg-white/[.08] border border-white/[.12] rounded-full py-1 pl-1 pr-2.5 hover:bg-white/[.14] transition-all">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
            style={{ background: accent }}>
            {user?.initials || (isAdmin ? 'WZ' : 'GW')}
          </div>
          <div className="text-white text-[10px] font-semibold">
            {user?.name?.split(' ').slice(0,2).join(' ')} · {isAdmin ? 'Admin' : 'Staff'}
          </div>
        </Link>
      </div>
    </div>
  )
}
