import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import { api } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import logoIpb from '@/assets/logo-ipb.png'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setErrorMsg('')

    try {
      const response = await api.post('/auth/forgot-password', { email })
      setMessage(response.data.message || 'Jika email terdaftar, tautan reset kata sandi akan dikirim.')
    } catch (error) {
      setErrorMsg(error.response?.data?.detail || 'Permintaan reset kata sandi belum berhasil diproses.')
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
            Reset Kata Sandi
          </h1>
          <p className="text-slate-600 text-[13px]">
            Masukkan email akun IPB Anda
          </p>
        </div>

        <div className="px-7">
          {message && (
            <div className="mb-4 p-2.5 bg-emerald-50 text-emerald-700 text-[12px] rounded-md font-medium text-center border border-emerald-100">
              {message}
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-2.5 bg-red-50 text-red-600 text-[12px] rounded-md font-medium text-center border border-red-100">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-[13px] font-semibold text-slate-800 mb-1">
                E-mail
              </label>
              <input
                type="email"
                className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 box-border"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@apps.ipb.ac.id"
                required
              />
            </div>

            <Button
              className="w-full h-11 text-sm bg-blue-900 hover:bg-blue-950 text-white font-semibold rounded-lg"
              type="submit"
              disabled={loading}
              icon={<Mail className="w-4 h-4" />}
            >
              {loading ? 'Mengirim...' : 'Kirim Tautan Reset'}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full mt-4 text-[12px] text-blue-900 cursor-pointer font-semibold hover:underline bg-transparent border-none inline-flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Login
          </button>
        </div>
      </div>
    </div>
  )
}
