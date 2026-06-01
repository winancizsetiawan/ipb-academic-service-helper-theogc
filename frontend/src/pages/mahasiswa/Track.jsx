import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentTopbar from '@/components/layout/StudentTopbar'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ProgressBar from '@/components/ui/ProgressBar'
import Timeline from '@/components/ui/Timeline'
import { useToast } from '@/hooks/useToast'
import ToastContainer from '@/components/ui/Toast'
import { api } from '@/contexts/AuthContext'

const STATUS_LABEL = { open: 'Open', progress: 'In Progress', resolved: 'Resolved', rejected: 'Rejected' }
const STATUS_BADGE  = { open: 'open', progress: 'progress', resolved: 'resolved', rejected: 'rejected' }
const FILTERS = ['Semua', 'Open', 'In Progress', 'Resolved']

export default function Track() {
  const navigate = useNavigate()
  const { toasts, toast, removeToast } = useToast()

  const [tickets, setTickets] = useState([])
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [ticketDetail, setTicketDetail] = useState(null)
  
  const [filter, setFilter] = useState('Semua')
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Fetch all my tickets
  const fetchMyTickets = async (selectFirst = false) => {
    try {
      setLoadingList(true)
      const res = await api.get('/tickets/my')
      // Order newest first
      const sorted = res.data.sort((a, b) => b.id - a.id)
      setTickets(sorted)
      if (selectFirst && sorted.length > 0) {
        setSelectedTicketId(sorted[0].id)
      }
    } catch (err) {
      console.error(err)
      toast('❌ Gagal memuat daftar permohonan', 'error')
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    fetchMyTickets(true)
  }, [])

  // Fetch full details of the selected ticket
  useEffect(() => {
    if (!selectedTicketId) {
      setTicketDetail(null)
      return
    }

    const fetchDetail = async () => {
      try {
        setLoadingDetail(true)
        const res = await api.get(`/tickets/${selectedTicketId}`)
        setTicketDetail(res.data)
      } catch (err) {
        console.error(err)
        toast('❌ Gagal memuat detail permohonan', 'error')
      } finally {
        setLoadingDetail(false)
      }
    }
    
    fetchDetail()
    // Poll for updates on the selected ticket every 15s to keep conversational UI real-time
    const interval = setInterval(fetchDetail, 15000)
    return () => clearInterval(interval)
  }, [selectedTicketId])

  const handlePostNote = async () => {
    if (!msg.trim()) return
    try {
      const res = await api.post(`/tickets/${selectedTicketId}/notes`, { content: msg })
      // Instantly append to locally loaded notes
      setTicketDetail(prev => ({
        ...prev,
        notes: [...(prev?.notes || []), res.data]
      }))
      setMsg('')
      toast('💬 Tanggapan terkirim!', 'success')
    } catch (err) {
      console.error(err)
      toast('❌ Gagal mengirim tanggapan', 'error')
    }
  }

  const getStatusProgress = (status) => {
    switch (status) {
      case 'open': return 15
      case 'progress': return 60
      case 'resolved': return 100
      case 'rejected': return 100
      default: return 0
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#BA7517'
      case 'progress': return '#378ADD'
      case 'resolved': return '#3B6D11'
      case 'rejected': return '#DC2626'
      default: return '#888780'
    }
  }

  // Generate dynamic timeline based on status
  const buildTimeline = (ticket) => {
    if (!ticket) return []
    const createdStr = ticket.created_at ? new Date(ticket.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Baru saja'
    
    const steps = [
      { title: 'Permohonan Dibuat', time: createdStr, status: 'done', note: 'Permohonan berhasil disubmit oleh mahasiswa.' }
    ]

    if (ticket.status === 'open') {
      steps.push({ title: 'Verifikasi Dokumen', time: 'Dalam Antrean', status: 'current', note: 'Menunggu penugasan staff akademik.' })
      steps.push({ title: 'Sedang Diproses', time: '—', status: 'pending' })
      steps.push({ title: 'Selesai / Terbit', time: '—', status: 'pending' })
    } else if (ticket.status === 'progress') {
      steps.push({ title: 'Verifikasi Dokumen', time: 'Selesai', status: 'done', note: 'Dokumen terverifikasi lengkap.' })
      steps.push({ title: 'Sedang Diproses', time: 'Proses Staff', status: 'current', note: `${ticket.staff_name || 'Staff'} sedang memproses dokumen Anda.` })
      steps.push({ title: 'Selesai / Terbit', time: 'Estimasi 1-2 hari', status: 'pending' })
    } else if (ticket.status === 'resolved') {
      steps.push({ title: 'Verifikasi Dokumen', time: 'Selesai', status: 'done' })
      steps.push({ title: 'Sedang Diproses', time: 'Selesai', status: 'done' })
      steps.push({ title: 'Selesai / Terbit', time: 'Sukses', status: 'done', note: 'Dokumen selesai dibuat dan siap diunduh / diambil.' })
    } else if (ticket.status === 'rejected') {
      steps.push({ title: 'Verifikasi Dokumen', time: 'Ditolak', status: 'current', note: 'Permohonan ditolak oleh bagian akademik.' })
    }

    return steps
  }

  const filteredTickets = tickets.filter(t => {
    // Filter status
    if (filter !== 'Semua' && t.status !== filter.toLowerCase().replace('in progress', 'progress')) return false
    // Search
    if (search.trim() !== '') {
      const q = search.toLowerCase()
      const matchesId = `#tkt-2026-${t.id.toString().padStart(4, '0')}`.includes(q)
      const matchesTitle = t.title.toLowerCase().includes(q)
      return matchesId || matchesTitle
    }
    return true
  })

  const getTicketFormattedId = (id) => `#TKT-2026-${id.toString().padStart(4, '0')}`

  return (
    <div>
      <StudentTopbar />
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-[18px] font-bold text-ipb-900">Lacak Permohonan</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">Pantau semua tiket layanan Anda</p>
          </div>
          <Button size="sm" onClick={() => navigate('/submit')}>+ Ajukan Baru</Button>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-lg border border-ipb-50 shadow-sm mb-4">
          <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-ipb-50 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300 text-xs">🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 border border-ipb-200 rounded-md pl-7 pr-3 text-[11px] outline-none focus:border-ipb-400"
                placeholder="Cari ID tiket atau judul..."
              />
            </div>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-[10px] px-2.5 py-1 rounded-full border font-medium transition-all cursor-pointer
                  ${filter === f ? 'bg-ipb-500 text-white border-ipb-500' : 'bg-white text-gray-600 border-ipb-200 hover:border-ipb-300'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_360px] gap-4">
          {/* Ticket list */}
          <div>
            {loadingList ? (
              <div className="p-8 text-center text-gray-400 italic">Memuat permohonan...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-gray-400 italic">Tidak ada permohonan ditemukan.</div>
            ) : (
              filteredTickets.map((t) => (
                <div key={t.id} onClick={() => setSelectedTicketId(t.id)}
                  className={`bg-white rounded-lg border shadow-sm p-3.5 mb-2.5 cursor-pointer transition-all hover:shadow-md
                    ${selectedTicketId === t.id ? 'border-ipb-300 bg-ipb-25' : 'border-ipb-50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-[10px] font-mono font-bold text-ipb-500">{getTicketFormattedId(t.id)}</div>
                      <div className="text-[13px] font-bold text-ipb-900 my-0.5">{t.title}</div>
                      <div className="text-[10px] text-gray-400">
                        Kategori: {t.nama_kategori || 'Umum'} · {t.created_at ? new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Baru saja'}
                      </div>
                    </div>
                    <Badge v={STATUS_BADGE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                  </div>
                  <ProgressBar pct={getStatusProgress(t.status)} color={getStatusColor(t.status)} />
                  
                  {t.status === 'open' && (
                    <p className="text-[10px] text-amber-700 mt-1.5 font-medium">⏳ Menunggu penugasan staff akademik...</p>
                  )}
                  {t.status === 'progress' && (
                    <div className="flex gap-2 mt-2.5">
                      <p className="text-[10px] text-ipb-600 font-medium">⚙️ Sedang dikerjakan oleh: {t.nama || 'Staff Akademik'}</p>
                    </div>
                  )}
                  {t.status === 'resolved' && (
                    <p className="text-[10px] text-green-700 mt-1.5 font-semibold">✅ Selesai! Silakan unduh dokumen hasil di panel detail.</p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Detail panel */}
          <div className="bg-white rounded-lg border border-ipb-50 shadow-sm p-5 flex flex-col max-h-[80vh] overflow-y-auto">
            {loadingDetail && !ticketDetail ? (
              <div className="p-8 text-center text-gray-400 italic">Memuat detail permohonan...</div>
            ) : !ticketDetail ? (
              <div className="p-8 text-center text-gray-400 italic">Pilih salah satu permohonan untuk melihat detail.</div>
            ) : (
              <>
                <h3 className="text-[13px] font-bold text-ipb-900 mb-3">
                  📍 Detail — {getTicketFormattedId(ticketDetail.id)}
                </h3>

                {/* Status + progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] font-semibold">Status Layanan</span>
                    <Badge v={STATUS_BADGE[ticketDetail.status]}>
                      {STATUS_LABEL[ticketDetail.status]}
                    </Badge>
                  </div>
                  <ProgressBar pct={getStatusProgress(ticketDetail.status)} color={getStatusColor(ticketDetail.status)} showLabel />
                  <p className="text-[10px] text-gray-400 mt-1">
                    {ticketDetail.status === 'progress' ? `Estimasi selesai: ${ticketDetail.deadline ? new Date(ticketDetail.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '1-2 hari kerja'}`
                     : ticketDetail.status === 'resolved' ? 'Surat permohonan selesai diproses'
                     : ticketDetail.status === 'rejected' ? 'Permohonan ditolak oleh staff'
                     : 'Menunggu review dokumen awal'}
                  </p>
                </div>

                <div className="h-px bg-ipb-100 my-3" />

                {/* Description info */}
                <div className="mb-4">
                  <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">Deskripsi Permohonan</h4>
                  <p className="text-[11px] text-gray-600 bg-gray-50/50 border border-gray-100 rounded p-2.5 leading-relaxed">{ticketDetail.description}</p>
                </div>

                {/* File attachments */}
                <div className="mb-4">
                  <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">📎 Dokumen Lampiran</h4>
                  {ticketDetail.attachments && ticketDetail.attachments.length > 0 ? (
                    <div className="space-y-1.5">
                      {ticketDetail.attachments.map(att => (
                        <div key={att.id} className="flex items-center justify-between bg-blue-50/20 border border-blue-100 rounded px-2.5 py-1.5">
                          <span className="text-[10px] text-gray-700 font-medium truncate max-w-[200px]">📄 {att.filename}</span>
                          <a
                            href={`${api.defaults.baseURL.replace('/api/v1', '')}${att.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="text-[10px] font-bold text-ipb-600 hover:text-ipb-800 hover:underline">
                            Unduh
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-400 italic">Tidak ada dokumen pendukung dilampirkan.</div>
                  )}
                </div>

                <div className="h-px bg-ipb-100 my-3" />

                {/* Timeline */}
                <Timeline items={buildTimeline(ticketDetail)} />

                <div className="h-px bg-ipb-100 my-3" />

                {/* Conversation Thread */}
                <div className="mb-4 flex-1">
                  <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">💬 Percakapan & Catatan Staff</h4>
                  
                  <div className="space-y-2 max-h-[220px] overflow-y-auto mb-3 bg-gray-50 p-2.5 rounded border border-gray-100">
                    {(!ticketDetail.notes || ticketDetail.notes.length === 0) ? (
                      <div className="text-[10px] text-gray-400 italic text-center p-3">Belum ada diskusi atau catatan dari staff.</div>
                    ) : (
                      ticketDetail.notes.map(note => {
                        const isMhs = note.author_id === ticketDetail.student_id
                        return (
                          <div key={note.id} className={`flex flex-col ${isMhs ? 'items-end' : 'items-start'}`}>
                            <span className="text-[8px] text-gray-400 font-bold mb-0.5">{note.author_name || (isMhs ? 'Saya' : 'Staff')}</span>
                            <div className={`text-[10px] px-2.5 py-1.5 rounded-lg max-w-[85%] leading-relaxed ${isMhs ? 'bg-ipb-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                              {note.content}
                            </div>
                            <span className="text-[7px] text-gray-400 mt-0.5">{note.created_at ? new Date(note.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {ticketDetail.status !== 'resolved' && ticketDetail.status !== 'rejected' && (
                    <div>
                      <textarea
                        value={msg}
                        onChange={e => setMsg(e.target.value)}
                        className="w-full border border-ipb-200 rounded-md px-2.5 py-2 text-[11px] outline-none focus:border-ipb-400 resize-none"
                        rows={2}
                        placeholder="Tulis balasan untuk staff akademik..."
                      />
                      <Button size="sm" className="w-full mt-1.5" onClick={handlePostNote}>
                        Kirim Balasan
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
