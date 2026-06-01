import { Link, useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import logoIpb from '@/assets/logo-ipb.png'

const NAV_LINKS = [
  { to: '/faq',            label: 'FAQ'           },
  { to: '/generate-surat', label: 'Generate Surat' },
  { to: '/submit',         label: 'Ajukan'        },
  { to: '/track',          label: 'Lacak'         },
  { to: '/diskusi',        label: 'Diskusi'       },
  { to: '/notifikasi',     label: 'Notifikasi'    },
]

export default function StudentTopbar() {
  const { pathname } = useLocation()
  const { user, unreadCount } = useAuth()

  return (
    <div className="bg-ipb-900 h-[52px] flex items-center px-5 gap-2.5 sticky top-0 z-50 shadow-nav">
      <div className="w-[30px] h-[30px] bg-white/10 rounded-full flex items-center justify-center p-0.5 backdrop-blur-sm shrink-0">
        <img 
          src={logoIpb} 
          alt="Logo IPB" 
          className="w-full h-full object-contain"
        />
      </div>
      <span className="text-white text-sm font-bold ml-1">IPB Academic Help</span>

      <nav className="flex gap-0.5 mx-3">
        {NAV_LINKS.map(l => {
          const active = pathname.startsWith(l.to)
          return (
            <Link key={l.to} to={l.to}
              className={`text-[11px] px-2.5 py-1.5 rounded-md font-medium transition-all
                ${active
                  ? 'bg-white/[.12] text-white font-semibold'
                  : 'text-white/55 hover:text-white hover:bg-white/[.08]'
                }`}>
              {l.label}
            </Link>
          )
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <Link to="/notifikasi"
          className="w-[30px] h-[30px] rounded-md bg-white/[.08] flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[.14] transition-all relative">
          <Bell size={14} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-extrabold px-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center border border-ipb-900">
              {unreadCount}
            </span>
          )}
        </Link>
        <Link to="/profil"
          className="flex items-center gap-1.5 bg-white/[.08] border border-white/[.12] rounded-full py-1 pl-1 pr-2.5 hover:bg-white/[.14] transition-all">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
            style={{ background: user?.color || '#3B6D11' }}>
            {user?.initials || 'QR'}
          </div>
          <div>
            <div className="text-white text-[10px] font-semibold leading-none">
              {user?.nama?.split(' ').slice(0,2).join(' ')}
            </div>
            <div className="text-ipb-200 text-[8px] leading-none mt-0.5">Mahasiswa</div>
          </div>
        </Link>
      </div>
    </div>
  )
}