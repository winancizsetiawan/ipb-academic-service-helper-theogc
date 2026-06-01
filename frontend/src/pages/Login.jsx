import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import logoIpb from '@/assets/logo-ipb.png'

const ROLES = ['mahasiswa', 'staff', 'admin']
const DEMO_ACCOUNTS = {
  mahasiswa: {
    email: 'lontongsagu05@gmail.com',
    password: 'Password123!',
  },
  staff: {
    email: 'mardybeom@gmail.com',
    password: 'Password123!',
  },
  admin: {
    email: 'ghaniandaw@gmail.com',
    password: 'Password123!',
  },
}

export default function Login() {
  const [role, setRole] = useState('mahasiswa')
  const [email, setEmail] = useState(DEMO_ACCOUNTS.mahasiswa.email)
  const [password, setPassword] = useState(DEMO_ACCOUNTS.mahasiswa.password)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const activeDemoAccount = DEMO_ACCOUNTS[role]
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole)
    setErrorMsg('')
    setEmail(DEMO_ACCOUNTS[selectedRole].email)
    setPassword(DEMO_ACCOUNTS[selectedRole].password)
  }

  const handleLogin = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      if (login) {
        const user = await login(email, password)
        const userRole = user.role
        
        if (userRole === 'staff') navigate('/staff/dashboard')
        else if (userRole === 'admin') navigate('/admin/dashboard')
        else navigate('/faq')
      }
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || e.message || 'Terjadi kesalahan pada sistem login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'linear-gradient(135deg,#021A34,#0C447C 50%,#2478C8)' }}>
      <div className="bg-white rounded-2xl w-full max-w-[400px] overflow-hidden shadow-lg pt-7 pb-6">
        <div className="bg-white px-7 pb-5 text-center">
          <div className="flex justify-center mb-3">
            <img 
              src={logoIpb} 
              alt="Logo IPB" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-slate-900 text-[20px] font-bold mb-1">
            IPB Academic Help Center
          </h1>
          <p className="text-slate-600 text-[13px]">
            Masuk sesuai peran Anda
          </p>
        </div>

        <div className="px-7">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
            {ROLES.map(r => (
              <button key={r} type="button" onClick={() => handleRoleChange(r)}
                className={`flex-1 text-center py-[7px] rounded-lg text-[13px] font-semibold cursor-pointer border-none transition-all
                  ${role === r ? 'bg-white text-slate-900 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}>
                {r}
              </button>
            ))}
          </div>

          {errorMsg && (
            <div className="mb-4 p-2.5 bg-red-50 text-red-600 text-[11px] rounded-md font-medium text-center border border-red-100">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-3.5">
              <label className="block text-[13px] font-semibold text-slate-800 mb-1">IPB Username / E-mail</label>
              <input
                type="email"
                className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 box-border"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@apps.ipb.ac.id"
                required
              />
            </div>
            <div className="mb-1.5">
              <label className="block text-[13px] font-semibold text-slate-800 mb-1">Kata Sandi</label>
              <input 
                type="password"
                className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 box-border"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="text-right mb-4">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-[12px] text-blue-900 cursor-pointer font-semibold hover:underline bg-transparent border-none"
              >
                Lupa kata sandi?
              </button>
            </div>

            <Button className="w-full h-11 text-sm bg-blue-900 hover:bg-blue-950 text-white font-semibold rounded-lg" type="submit" disabled={loading}>
              {loading ? 'Memproses...' : 'Masuk ke Sistem'}
            </Button>
          </form>

          <div className="text-center text-[11px] text-slate-500 pt-4 font-normal bg-slate-50 rounded-lg mt-3 py-2 border border-dashed border-slate-200">
            <div>Akun Demo Aktif:</div>
            <div className="text-slate-700 mt-0.5">
              <span className="font-bold">{activeDemoAccount.email}</span> / <span className="font-bold">{activeDemoAccount.password}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
