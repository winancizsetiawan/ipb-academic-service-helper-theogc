import { useNavigate } from 'react-router-dom'
import StudentTopbar from '@/components/layout/StudentTopbar'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import { Input, FormGroup } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import ToastContainer from '@/components/ui/Toast'

const INFO = [
  ['NIM',        'G6401231013'],
  ['Fakultas',   'FMIPA'],
  ['Departemen', 'Ilmu Komputer'],
  ['Angkatan',   '2023'],
  ['Email',      'quina.siregar@apps.ipb.ac.id'],
]

const NOTIF_PREFS = [
  ['Email saat status berubah', true ],
  ['Email saat resolved',       true ],
  ['Diskusi dibalas',           true ],
  ['Pengumuman sistem',         false],
]

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { toasts, toast, removeToast } = useToast()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div>
      <StudentTopbar />
      <div className="p-5">
        <div className="grid grid-cols-[1fr_280px] gap-4">
          {/* Left */}
          <div>
            {/* Profile card */}
            <div className="bg-white rounded-lg border border-ipb-50 shadow-sm overflow-hidden mb-3.5">
              <div className="h-[90px] rounded-t-lg"
                style={{ background: 'linear-gradient(135deg,#042C53,#378ADD)' }} />
              <div className="px-5 pb-5">
                <div className="-mt-7 mb-2.5">
                  <div
                    className="w-14 h-14 rounded-full border-[3px] border-white flex items-center justify-center text-[19px] font-bold text-white"
                    style={{ background: user?.color || '#3B6D11' }}>
                    {user?.initials || 'QR'}
                  </div>
                </div>
                <h2 className="text-[16px] font-bold text-ipb-900">{user?.name || 'Quina Rizky Dae Yuena Siregar'}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge v="student">Mahasiswa</Badge>
                  <span className="text-[10px] text-gray-400">Aktif sejak 2023</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {INFO.map(([k, v], i) => (
                    <div key={i}>
                      <div className="text-[10px] text-gray-400 font-medium mb-0.5">{k}</div>
                      <div className="text-[12px] text-gray-900 font-medium">{v}</div>
                    </div>
                  ))}
                  <div>
                    <div className="text-[10px] text-gray-400 font-medium mb-0.5">Status</div>
                    <Badge v="resolved">Aktif</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit form */}
            <div className="bg-white rounded-lg border border-ipb-50 shadow-sm p-5">
              <h3 className="text-[13px] font-bold text-ipb-900 mb-3.5">⚙️ Pengaturan Akun</h3>
              <FormGroup label="Nama Lengkap">
                <Input defaultValue={user?.name || 'Quina Rizky Dae Yuena Siregar'} />
              </FormGroup>
              <div className="grid grid-cols-2 gap-3">
                <FormGroup label="Email">
                  <Input defaultValue="quina.siregar@apps.ipb.ac.id" />
                </FormGroup>
                <FormGroup label="No. WhatsApp">
                  <Input placeholder="+62..." />
                </FormGroup>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => toast('✅ Perubahan disimpan', 'success')}>Simpan</Button>
                <Button size="sm" variant="ghost" onClick={() => toast('📧 Cek email untuk reset password', 'info')}>
                  Ubah Password
                </Button>
                <Button size="sm" variant="danger" className="ml-auto" onClick={handleLogout}>
                  🚪 Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Right */}
          <div>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2.5 mb-3.5">
              <StatCard val={4} label="Total Tiket" />
              <StatCard val={2} label="Resolved"    color="text-green-700" />
              <StatCard val={1} label="In Progress" color="text-ipb-500"   />
              <StatCard val={1} label="Open"         color="text-amber-700" />
            </div>

            {/* Notif prefs */}
            <div className="bg-white rounded-lg border border-ipb-50 shadow-sm p-5">
              <h3 className="text-[13px] font-bold text-ipb-900 mb-2.5">🔔 Preferensi Notifikasi</h3>
              {NOTIF_PREFS.map(([label, on], i) => (
                <div key={i}
                  className={`flex justify-between items-center py-1.5 text-[11px] ${i < NOTIF_PREFS.length - 1 ? 'border-b border-ipb-50' : ''}`}>
                  <span>{label}</span>
                  <button
                    onClick={() => toast(`${label}: ${on ? 'Dinonaktifkan' : 'Diaktifkan'}`, 'info')}
                    className={`text-[9px] font-semibold px-2.5 py-1 rounded-full border-none cursor-pointer transition-all
                      ${on ? 'bg-ipb-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {on ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
