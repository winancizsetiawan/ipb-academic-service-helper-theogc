import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import logoIpb from '@/assets/logo-ipb.png'

const ROLES = ['mahasiswa', 'staff', 'admin']

export default function Login() {
  const [role, setRole] = useState('mahasiswa')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole)
    setErrorMsg('')
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
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5" role="tablist" aria-label="Pilih peran">
            {ROLES.map(r => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={role === r}
                onClick={() => handleRoleChange(r)}
                className={`flex-1 text-center py-[7px] rounded-lg text-[13px] font-semibold cursor-pointer border-none transition-all
                  ${role === r ? 'bg-white text-slate-900 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}>
                {r}
              </button>
            ))}
          </div>

          {errorMsg && (
            <div role="alert" className="mb-4 p-2.5 bg-red-50 text-red-600 text-[11px] rounded-md font-medium text-center border border-red-100">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-3.5">
              <label htmlFor="email" className="block text-[13px] font-semibold text-slate-800 mb-1">
                IPB Username / E-mail
              </label>
              <input
                id="email"
                type="email"
                className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 box-border"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@apps.ipb.ac.id"
                required
                autoComplete="username"
              />
            </div>
            <div className="mb-1.5">
              <label htmlFor="password" className="block text-[13px] font-semibold text-slate-800 mb-1">
                Kata Sandi
              </label>
              <input
                id="password"
                type="password"
                className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 box-border"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="text-right mb-4">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-[12px] text-blue-900 cursor-pointer font-semibold hover:underline bg-transparent border-none">
                Lupa kata sandi?
              </button>
            </div>

            <Button
              className="w-full h-11 text-sm bg-blue-900 hover:bg-blue-950 text-white font-semibold rounded-lg"
              type="submit"
              disabled={loading}
              loading={loading}>
              {loading ? 'Memproses...' : 'Masuk ke Sistem'}
            </Button>
          </form>

          <p className="text-center text-[11px] text-slate-400 mt-4">
            IPB Academic Help Center &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
