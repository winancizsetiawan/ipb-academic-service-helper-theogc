import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import logoIpb from '@/assets/logo-ipb.png'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [status, setStatus] = useState('loading') // 'loading', 'success', 'error'
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Token verifikasi tidak ditemukan. Silakan periksa kembali tautan di email Anda.')
        return
      }

      try {
        const response = await api.get(`/auth/verify-email?token=${token}`)
        setStatus('success')
        setMessage(response.data.message || 'Email Anda telah berhasil diverifikasi!')
      } catch (error) {
        setStatus('error')
        setMessage(
          error.response?.data?.detail || 
          'Tautan verifikasi tidak valid atau telah kedaluwarsa.'
        )
      }
    }

    verifyToken()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'linear-gradient(135deg,#021A34,#0C447C 50%,#2478C8)' }}>
      <div className="bg-white rounded-2xl w-full max-w-[400px] overflow-hidden shadow-2xl pt-7 pb-6 px-7 text-center transition-all duration-300">
        <div className="flex justify-center mb-4">
          <img 
            src={logoIpb} 
            alt="Logo IPB" 
            className="w-16 h-16 object-contain"
          />
        </div>
        <h1 className="text-slate-900 text-[20px] font-bold mb-5">
          IPB Academic Help Center
        </h1>

        {status === 'loading' && (
          <div className="flex flex-col items-center py-6 animate-fade-in">
            <Loader2 className="w-12 h-12 text-blue-900 animate-spin mb-4" />
            <p className="text-slate-600 text-sm font-medium">
              Sedang memverifikasi email Anda...
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Mohon tunggu sebentar
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center py-4 animate-fade-in">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
            <h2 className="text-slate-900 text-lg font-bold mb-2">
              Verifikasi Berhasil!
            </h2>
            <p className="text-slate-600 text-sm mb-6 px-2">
              {message}
            </p>
            <Button 
              className="w-full h-11 text-sm bg-blue-900 hover:bg-blue-950 text-white font-semibold rounded-lg" 
              onClick={() => navigate('/login')}
            >
              Masuk ke Sistem
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-4 animate-fade-in">
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-slate-900 text-lg font-bold mb-2">
              Verifikasi Gagal
            </h2>
            <p className="text-slate-600 text-sm mb-6 px-2">
              {message}
            </p>
            <Button 
              className="w-full h-11 text-sm bg-blue-900 hover:bg-blue-950 text-white font-semibold rounded-lg" 
              onClick={() => navigate('/login')}
            >
              Kembali ke Login
            </Button>
          </div>
        )}

        <div className="text-center text-[11px] text-slate-400 pt-5 mt-4 border-t border-gray-100">
          Hak Cipta &copy; {new Date().getFullYear()} IPB University
        </div>
      </div>
    </div>
  )
}
