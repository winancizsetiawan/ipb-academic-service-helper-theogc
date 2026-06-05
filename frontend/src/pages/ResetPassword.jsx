import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LockKeyhole, CheckCircle2, XCircle } from 'lucide-react'
import { api } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import logoIpb from '@/assets/logo-ipb.png'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('')
    setMessage('')

    if (!token) {
      setStatus('error')
      setMessage('Token reset kata sandi tidak ditemukan.')
      return
    }

    if (password.length < 8) {
      setStatus('error')
      setMessage('Kata sandi minimal 8 karakter.')
      return
    }

    if (password !== confirmPassword) {
      setStatus('error')
      setMessage('Konfirmasi kata sandi tidak sama.')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/auth/reset-password', { token, password })
      setStatus('success')
      setMessage(response.data.message || 'Kata sandi berhasil diperbarui.')
      setPassword('')
      setConfirmPassword('')
    } catch (error) {
      setStatus('error')
      setMessage(error.response?.data?.detail || 'Token reset kata sandi tidak valid atau sudah kedaluwarsa.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'linear-gradient(135deg,#021A34,#0C447C 50%,#2478C8)' }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[400px] overflow-hidden shadow-lg pt-7 pb-6">
        <div className="bg-white px-7 pb-5 text-center">
          <div className="flex justify-center mb-3">
            <img src={logoIpb} alt="Logo IPB" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-slate-900 text-[20px] font-bold mb-1">
            Buat Kata Sandi Baru
          </h1>
          <p className="text-slate-600 text-[13px]">
            Gunakan kata sandi yang aman untuk akun Anda
          </p>
        </div>

        <div className="px-7">
          {status === 'success' && (
            <div className="mb-4 p-2.5 bg-emerald-50 text-emerald-700 text-[12px] rounded-md font-medium text-center border border-emerald-100 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {status === 'error' && (
            <div className="mb-4 p-2.5 bg-red-50 text-red-600 text-[12px] rounded-md font-medium text-center border border-red-100 flex items-center justify-center gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3.5">
              <label className="block text-[13px] font-semibold text-slate-800 mb-1">
                Kata Sandi Baru
              </label>
              <input
                type="password"
                className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 box-border"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-[13px] font-semibold text-slate-800 mb-1">
                Konfirmasi Kata Sandi
              </label>
              <input
                type="password"
                className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 box-border"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                required
              />
            </div>

            <Button
              className="w-full h-11 text-sm bg-blue-900 hover:bg-blue-950 text-white font-semibold rounded-lg"
              type="submit"
              disabled={loading || status === 'success'}
              icon={<LockKeyhole className="w-4 h-4" />}
            >
              {loading ? 'Menyimpan...' : 'Simpan Kata Sandi'}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full mt-4 text-[12px] text-blue-900 cursor-pointer font-semibold hover:underline bg-transparent border-none"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    </div>
  )
}
