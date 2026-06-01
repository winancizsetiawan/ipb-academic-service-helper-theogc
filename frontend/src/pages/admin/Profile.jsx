import { useNavigate } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import PanelHeader from '@/components/layout/PanelHeader'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { FormGroup, Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import ToastContainer from '@/components/ui/Toast'

const ACCESS = [
  'Kelola semua tiket',
  'Kelola pengguna & role',
  'Kelola kategori layanan',
  'Kelola FAQ & konten',
  'Statistik penuh',
  'Export laporan',
  'Pengaturan sistem',
]

const SECURITY = [
  ['Auth 2 Faktor',   true,  'Aktif'],
  ['Session Timeout', null,  '8 jam'],
  ['Log Aktivitas',   true,  'Aktif'],
  ['IP Whitelist',    false, 'Nonaktif'],
]

const LOGS = [
  ['Login sistem',           '15 Mar, 07:30'],
  ['Tambah pengguna baru',   '14 Mar, 16:12'],
  ['Export laporan Maret',   '14 Mar, 10:45'],
  ['Update kategori layanan','13 Mar, 14:20'],
  ['Reset password staff',   '12 Mar, 09:05'],
]

export default function AdminProfile() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { toasts, toast, removeToast } = useToast()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex">
      <Sidebar type="admin" />
      <div className="flex-1 min-w-0 bg-[#EEF3F9]">
        <PanelHeader title="Profil Admin" type="admin" />
        <div className="p-5">
          <div className="grid grid-cols-[1fr_280px] gap-4">
            {/* Left */}
            <div>
              {/* Profile card */}
              <div className="bg-white rounded-lg border border-ipb-50 shadow-sm overflow-hidden mb-3.5">
                <div className="h-[90px]" style={{ background:'linear-gradient(135deg,#021A34,#BA7517)' }} />
                <div className="px-5 pb-5">
                  <div className="-mt-7 mb-2.5">
                    <div className="w-14 h-14 rounded-full border-[3px] border-white flex items-center justify-center text-[19px] font-bold text-white"
                      style={{ background:'#BA7517' }}>
                      WZ
                    </div>
                  </div>
                  <h2 className="text-[16px] font-bold text-ipb-900">Winanci Zahrawaini Setiawan</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge v="admin">System Administrator</Badge>
                    <span className="text-[10px] text-gray-400">Super Admin</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {[['NIP/ID','ADMIN-001'],['Unit','Direktorat TIK IPB'],['Email','winanci@ipb.ac.id'],['Level',<Badge v="admin">Super Admin</Badge>]].map(([k,v],i) => (
                      <div key={i}>
                        <div className="text-[10px] text-gray-400 font-medium mb-0.5">{k}</div>
                        <div className="text-[12px] text-gray-900 font-medium">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Access rights */}
              <div className="bg-white rounded-lg border border-ipb-50 shadow-sm p-5 mb-3.5">
                <h3 className="text-[13px] font-bold text-ipb-900 mb-3">🔑 Hak Akses Penuh</h3>
                <div className="grid grid-cols-2 gap-2">
                  {ACCESS.map((l, i) => (
                    <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-green-100 rounded-md text-[11px] text-green-700">
                      <span>✓</span><span>{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edit form */}
              <div className="bg-white rounded-lg border border-ipb-50 shadow-sm p-5">
                <h3 className="text-[13px] font-bold text-ipb-900 mb-3.5">⚙️ Edit Profil Admin</h3>
                <div className="grid grid-cols-2 gap-3">
                  <FormGroup label="Nama Lengkap">
                    <Input defaultValue="Winanci Zahrawaini Setiawan" />
                  </FormGroup>
                  <FormGroup label="Email">
                    <Input defaultValue="winanci@ipb.ac.id" />
                  </FormGroup>
                </div>
                <div className="flex gap-2 items-center">
                  <Button size="sm" onClick={() => toast('✅ Profil berhasil disimpan', 'success')}>Simpan</Button>
                  <Button size="sm" variant="ghost" onClick={() => toast('📧 Cek email untuk reset password', 'info')}>Ubah Password</Button>
                  <Button size="sm" variant="danger" className="ml-auto" onClick={handleLogout}>🚪 Logout</Button>
                </div>
              </div>
            </div>

            {/* Right */}
            <div>
              {/* Security */}
              <div className="bg-white rounded-lg border border-ipb-50 shadow-sm p-5 mb-3">
                <h3 className="text-[13px] font-bold text-ipb-900 mb-2.5">🔒 Keamanan Akun</h3>
                {SECURITY.map(([l, on, v], i) => (
                  <div key={i} className={`flex justify-between items-center py-1.5 text-[11px] ${i < SECURITY.length - 1 ? 'border-b border-ipb-50' : ''}`}>
                    <span>{l}</span>
                    {on === null
                      ? <span className="font-semibold text-ipb-500">{v}</span>
                      : <button
                          onClick={() => toast(`${l}: diubah`, 'info')}
                          className={`text-[9px] font-semibold px-2 py-1 rounded-full border-none cursor-pointer transition-all
                            ${on ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {v}
                        </button>
                    }
                  </div>
                ))}
                <Button size="sm" variant="secondary" className="w-full mt-3"
                  onClick={() => toast('📧 Email reset password dikirim', 'info')}>
                  Ubah Password Admin
                </Button>
              </div>

              {/* Activity log */}
              <div className="bg-white rounded-lg border border-ipb-50 shadow-sm p-5">
                <h3 className="text-[13px] font-bold text-ipb-900 mb-2.5">📋 Log Aktivitas Terakhir</h3>
                {LOGS.map(([l, t], i) => (
                  <div key={i} className={`flex justify-between items-center py-1.5 text-[10px] ${i < LOGS.length - 1 ? 'border-b border-ipb-50' : ''}`}>
                    <span className="text-gray-600">{l}</span>
                    <span className="text-gray-300">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
