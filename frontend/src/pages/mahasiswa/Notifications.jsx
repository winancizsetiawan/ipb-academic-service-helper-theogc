import StudentTopbar from '@/components/layout/StudentTopbar'
import Button from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import ToastContainer from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'

export default function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useAuth()
  const { toasts, toast, removeToast } = useToast()

  const handleMarkAll = async () => {
    await markAllAsRead()
    toast('✅ Semua notifikasi telah ditandai sebagai dibaca', 'success')
  }

  const getNotifMeta = (title) => {
    const t = title.toLowerCase()
    if (t.includes('selesai') || t.includes('berhasil') || t.includes('sukses')) {
      return { av: '✅', color: '#10B981' } // Emerald green
    }
    if (t.includes('tiket') || t.includes('permohonan')) {
      return { av: '🎫', color: '#3B82F6' } // Blue
    }
    if (t.includes('balasan') || t.includes('diskusi') || t.includes('tanggapan')) {
      return { av: '💬', color: '#F59E0B' } // Amber
    }
    return { av: '📢', color: '#6366F1' } // Indigo
  }

  const formatTime = (isoString) => {
    if (!isoString) return 'Baru saja'
    try {
      const date = new Date(isoString)
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Baru saja'
    }
  }

  return (
    <div className="min-h-screen bg-ipb-50">
      <StudentTopbar />
      <div className="p-6 w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-[20px] font-bold text-ipb-900">Notifikasi</h1>
            <p className="text-[12px] text-gray-400 mt-1">
              {unreadCount > 0 ? `${unreadCount} pemberitahuan baru belum dibaca` : 'Semua pemberitahuan sudah dibaca'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAll} className="!text-ipb-600 font-semibold">
              Tandai semua sebagai dibaca
            </Button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-ipb-100 shadow-sm overflow-hidden w-full">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm italic">
              Belum ada notifikasi atau pemberitahuan baru.
            </div>
          ) : (
            notifications.map((n, i) => {
              const meta = getNotifMeta(n.title)
              return (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                  className={`flex items-start gap-4 px-6 py-5 cursor-pointer transition-all border-l-4
                    ${i < notifications.length - 1 ? 'border-b border-ipb-50' : ''}
                    ${!n.is_read 
                      ? 'bg-blue-50/40 border-l-ipb-400 hover:bg-blue-50/60' 
                      : 'bg-white border-l-transparent hover:bg-gray-50'
                    }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0 shadow-sm"
                    style={{ background: meta.color }}>
                    {meta.av}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-[13px] text-gray-900 ${!n.is_read ? 'font-bold' : 'font-medium'}`}>
                        {n.title}
                      </p>
                      <p className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">{formatTime(n.created_at)}</p>
                    </div>
                    <p className="text-[12px] text-gray-500 mt-1 leading-relaxed max-w-4xl">{n.message}</p>
                  </div>

                  {!n.is_read && (
                    <div className="w-2 h-2 bg-ipb-400 rounded-full shrink-0 mt-2" />
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}