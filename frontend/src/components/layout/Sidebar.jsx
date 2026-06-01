import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Badge from '@/components/ui/Badge'
import logoIpb from '@/assets/logo-ipb.png'

const STAFF_NAV = [
  { section: 'Menu', items: [
    { to: '/staff/dashboard',  label: 'Dashboard' },
    { to: '/staff/requests',   label: 'Requests',      badge: 8 },
    { to: '/staff/faq',        label: 'Kelola FAQ' },
    { to: '/staff/diskusi',    label: 'Kelola Diskusi',  badge: 5 },
  ]},
  { section: 'Akun', items: [
    { to: '/staff/profil', label: 'Profil Saya' },
  ]},
]

const ADMIN_NAV = [
  { section: 'Overview', items: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/statistik', label: 'Statistik' },
  ]},
  { section: 'Manajemen', items: [
    { to: '/admin/pengguna',  label: 'Kelola Pengguna' },
    { to: '/admin/kategori',  label: 'Kelola Kategori' },
  ]},
  { section: 'Akun', items: [
    { to: '/admin/profil', label: 'Profil Admin' },
  ]},
]

export default function Sidebar({ type = 'staff' }) {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const isAdmin = type === 'admin'
  const nav     = isAdmin ? ADMIN_NAV : STAFF_NAV
  const accent  = isAdmin ? '#BA7517' : '#378ADD'

  return (
    <div
      className="w-[210px] shrink-0 flex flex-col sticky top-0 h-screen overflow-y-auto"
      style={{ background: isAdmin ? '#021A34' : '#042C53' }}
    >
      <div className="px-4 py-3.5 border-b border-white/[.07] flex items-center gap-2.5">
        <div className="w-[30px] h-[30px] flex items-center justify-center shrink-0">
          <img 
            src={logoIpb} 
            alt="Logo IPB" 
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <div className="text-white text-[12px] font-bold">IPB Help</div>
          <div className="text-[9px] mt-px" style={{ color: isAdmin ? '#f0c97a' : '#B5D4F4' }}>
            {isAdmin ? 'Admin Panel' : 'Staff Panel'}
          </div>
        </div>
      </div>

      <div className="mx-3 my-2.5 rounded-[7px] p-2.5 flex items-center gap-2"
        style={{ background: 'rgba(255,255,255,.07)', border: isAdmin ? '1px solid rgba(186,117,23,.2)' : 'none' }}>
        <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
          style={{ background: accent }}>
          {user?.initials || (isAdmin ? 'WZ' : 'GW')}
        </div>
        <div>
          <div className="text-white text-[11px] font-semibold leading-snug">
            {user?.name?.split(' ').slice(0,2).join(' ') || (isAdmin ? 'Winanci Z.S.' : 'Ghanianda W.')}
          </div>
          <div className="mt-1">
            <Badge v={isAdmin ? 'admin' : 'staff'}>{isAdmin ? 'Admin' : 'Staff'}</Badge>
          </div>
        </div>
      </div>

      <nav className="px-2 pb-2 flex-1">
        {nav.map(group => (
          <div key={group.section}>
            <div className="text-[8px] font-bold tracking-widest uppercase px-2 py-2 pt-3"
              style={{ color: 'rgba(255,255,255,.28)' }}>
              {group.section}
            </div>
            {group.items.map(it => {
              const active = pathname.startsWith(it.to)
              return (
                <Link key={it.to} to={it.to}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-md mb-px text-[11px] font-medium transition-all"
                  style={{
                    background: active ? 'rgba(255,255,255,.12)' : 'transparent',
                    color: active ? '#fff' : 'rgba(255,255,255,.5)',
                    fontWeight: active ? 600 : 500,
                  }}>
                  <div className="w-3.5 h-3.5 rounded-sm shrink-0"
                    style={{ background: active ? accent : 'rgba(255,255,255,.2)', opacity: active ? 1 : .55 }} />
                  <span className="flex-1">{it.label}</span>
                  {it.badge && (
                    <span className="text-[8px] font-bold px-1.5 py-px rounded-full text-white"
                      style={{ background: '#E24B4A' }}>
                      {it.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="px-3 pb-3 border-t border-white/[.07] pt-2.5">
        <button onClick={logout}
          className="w-full flex items-center gap-2 text-[11px] px-2.5 py-2 rounded-md transition-all text-left"
          style={{ color: 'rgba(255,255,255,.4)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fca5a5'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.4)'}>
          🚪 Keluar
        </button>
      </div>
    </div>
  )
}