import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import PanelHeader from '@/components/layout/PanelHeader'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'
import ToastContainer from '@/components/ui/Toast'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { api } from '@/contexts/AuthContext'

export default function StaffRequests() {
  const [tickets, setTickets] = useState([])
  const [tab, setTab] = useState('open')
  const [sel, setSel] = useState(null)
  const [panel, setPanel] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  
  // Status and uploads state
  const [statusVal, setStatusVal] = useState('open')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadedFileId, setUploadedFileId] = useState(null)
  const [internalNote, setInternalNote] = useState("")

  const { toasts, toast, removeToast } = useToast()
  const { confirmState, confirm, closeConfirm } = useConfirm()

  const fetchAllTickets = async () => {
    try {
      setLoadingList(true)
      const res = await api.get('/tickets/all')
      // Sort newest first
      const sorted = res.data.sort((a, b) => b.id - a.id)
      setTickets(sorted)
    } catch (err) {
      console.error(err)
      toast('❌ Gagal memuat daftar permohonan', 'error')
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    fetchAllTickets()
  }, [])

  const openDetail = async (ticket) => {
    setPanel(true)
    setLoadingDetail(true)
    setUploadedFile(null)
    setUploadedFileId(null)
    setInternalNote("")
    
    try {
      const res = await api.get(`/tickets/${ticket.id}`)
      setSel(res.data)
      setStatusVal(res.data.status)
    } catch (err) {
      console.error(err)
      toast('❌ Gagal memuat detail permohonan', 'error')
      setPanel(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const formData = new FormData()
      formData.append('file', file)
      
      try {
        toast(`⏳ Sedang mengunggah ${file.name}...`, 'info')
        const response = await api.post('/uploads', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        setUploadedFile(file.name)
        setUploadedFileId(response.data.id)
        toast(`📁 File ${file.name} berhasil diunggah!`, 'success')
      } catch (err) {
        console.error(err)
        toast(`❌ Gagal mengunggah file: ${err.response?.data?.detail || err.message}`, 'error')
      }
    }
  }

  const handleUpdateStatus = async () => {
    if (statusVal === 'resolved' && !uploadedFileId) {
      toast('⚠️ Silakan unggah dokumen surat terlebih dahulu untuk menyelesaikan permintaan!', 'error')
      return
    }

    try {
      // 1. Post note if filled
      if (internalNote.trim() !== "") {
        await api.post(`/tickets/${sel.id}/notes`, { content: internalNote })
      }

      // 2. Update status and link attachment
      const payload = {
        status: statusVal,
        attachment_ids: uploadedFileId ? [uploadedFileId] : []
      }
      
      await api.patch(`/tickets/${sel.id}/status`, payload)
      
      if (statusVal === 'resolved') {
        toast(`✅ Surat berhasil dikirim ke mahasiswa! Tiket ditandai Selesai.`, 'success')
      } else {
        toast('✅ Status tiket berhasil diperbarui!', 'success')
      }
      
      setPanel(false)
      fetchAllTickets()
    } catch (err) {
      console.error(err)
      toast(`❌ Gagal memperbarui status: ${err.response?.data?.detail || err.message}`, 'error')
    }
  }

  const handleReject = () => {
    confirm(
      'Reject Tiket?',
      'Tiket akan ditolak dan mahasiswa dinotifikasi.',
      async () => {
        try {
          if (internalNote.trim() !== "") {
            await api.post(`/tickets/${sel.id}/notes`, { content: internalNote })
          }
          await api.patch(`/tickets/${sel.id}/status`, { status: 'rejected' })
          toast('❌ Tiket ditolak', 'error')
          setPanel(false)
          fetchAllTickets()
        } catch (err) {
          console.error(err)
          toast(`❌ Gagal menolak permohonan: ${err.response?.data?.detail || err.message}`, 'error')
        }
      },
      { danger: true, okLabel: 'Reject' }
    )
  }

  const list = tickets.filter(t => {
    if (tab === 'open') return t.status === 'open' || t.status === 'progress'
    return t.status === 'resolved' || t.status === 'rejected'
  })

  const getFormattedId = (id) => `#TKT-2026-${id.toString().padStart(4, '0')}`

  const getFormatDate = (isoString) => {
    if (!isoString) return '—'
    return new Date(isoString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="flex min-h-screen bg-ipb-50">
      <Sidebar role="staff" />
      <div className="flex-1 min-w-0">
        <PanelHeader title="Daftar Permintaan Surat" role="staff" />
        
        <div className="p-6">
          <div className="flex border-b border-ipb-100 mb-5 gap-6">
            <button onClick={() => setTab('open')}
              className={`pb-2.5 text-[13px] font-bold transition-all ${tab === 'open' ? 'text-ipb-600 border-b-2 border-ipb-600' : 'text-gray-400'}`}>
              Perlu Diproses ({tickets.filter(t => t.status==='open' || t.status==='progress').length})
            </button>
            <button onClick={() => setTab('done')}
              className={`pb-2.5 text-[13px] font-bold transition-all ${tab === 'done' ? 'text-ipb-600 border-b-2 border-ipb-600' : 'text-gray-400'}`}>
              Riwayat Selesai ({tickets.filter(t => t.status==='resolved' || t.status==='rejected').length})
            </button>
          </div>

          <div className="bg-white rounded-xl border border-ipb-100 shadow-sm overflow-hidden">
            {loadingList ? (
              <div className="p-8 text-center text-gray-400 italic">Memuat seluruh permohonan...</div>
            ) : list.length === 0 ? (
              <div className="p-8 text-center text-gray-400 italic">Tidak ada permohonan.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-ipb-50/50 border-b border-ipb-100 text-[11px] font-bold text-ipb-800 uppercase tracking-wider">
                    <th className="py-3 px-4">ID Tiket</th>
                    <th className="py-3 px-4">Jenis Surat</th>
                    <th className="py-3 px-4">Pemohon</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Tgl Masuk</th>
                    <th className="py-3 px-4">Deadline</th>
                    <th className="py-3 px-4">Handler</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ipb-50 text-[12px] text-gray-700">
                  {list.map(t => (
                    <tr key={t.id} onClick={() => openDetail(t)} className="hover:bg-ipb-50/30 cursor-pointer transition-all">
                      <td className="py-3.5 px-4 font-mono font-bold text-ipb-600">{getFormattedId(t.id)}</td>
                      <td className="py-3.5 px-4 font-semibold text-ipb-900">{t.title}</td>
                      <td className="py-3.5 px-4">{t.nama || 'Mahasiswa'}</td>
                      <td className="py-3.5 px-4 text-gray-500">{t.nama_kategori || 'Umum'}</td>
                      <td className="py-3.5 px-4 text-gray-500">{getFormatDate(t.created_at)}</td>
                      <td className={`py-3.5 px-4 font-medium ${t.deadline && new Date(t.deadline) < new Date() && t.status !== 'resolved' ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                        {t.deadline ? new Date(t.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 italic">{t.staff_name || '—'}</td>
                      <td className="py-3.5 px-4"><Badge v={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className={`fixed inset-y-0 right-0 w-[420px] bg-white border-l border-ipb-100 shadow-xl transform transition-transform duration-300 z-40 flex flex-col ${panel ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-ipb-100 flex justify-between items-center bg-ipb-50/50">
          <div>
            <span className="text-[10px] font-mono font-bold text-ipb-500">{sel ? getFormattedId(sel.id) : ''}</span>
            <h3 className="text-[14px] font-bold text-ipb-900 truncate max-w-[300px]">{sel?.title}</h3>
          </div>
          <button onClick={() => setPanel(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        {loadingDetail ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 italic">Memuat detail tiket...</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-[10px] text-gray-400 font-medium uppercase tracking-wider">Nama Pemohon</label>
                <p className="text-[13px] font-bold text-gray-900">{sel?.student_name}</p>
                <p className="text-[10px] text-gray-500">Pemohon ID: {sel?.student_id}</p>
              </div>

              <div className="bg-ipb-50/50 border border-ipb-100 rounded-lg p-3.5 space-y-3">
                <h4 className="text-[11px] font-bold text-ipb-800 uppercase tracking-wider border-b border-ipb-100 pb-1">📄 Deskripsi Permohonan</h4>
                <p className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-wrap">{sel?.description}</p>
              </div>

              {sel?.attachments && sel.attachments.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-[10px] text-gray-400 font-medium uppercase tracking-wider">Lampiran Mahasiswa</label>
                  {sel.attachments.map(att => (
                    <div key={att.id} className="bg-blue-50/40 border border-blue-100 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0">📎</span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-gray-700 truncate mt-0.5">{att.filename}</p>
                        </div>
                      </div>
                      <a 
                        href={`${api.defaults.baseURL.replace('/api/v1', '')}${att.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-blue-600 hover:underline shrink-0 ml-2">
                        Unduh File
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Conversation Thread */}
            <div className="border-t border-ipb-100 pt-4 mb-4">
              <h4 className="text-[11px] font-bold text-ipb-800 uppercase tracking-wider mb-2">💬 Riwayat Percakapan</h4>
              <div className="space-y-2 max-h-[160px] overflow-y-auto mb-3 bg-gray-50 p-2.5 rounded border border-gray-100">
                {(!sel?.notes || sel.notes.length === 0) ? (
                  <div className="text-[10px] text-gray-400 italic text-center p-3">Belum ada diskusi.</div>
                ) : (
                  sel.notes.map(note => {
                    const isStaff = note.author_id !== sel.student_id
                    return (
                      <div key={note.id} className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}>
                        <span className="text-[8px] text-gray-400 font-bold mb-0.5">{note.author_name || (isStaff ? 'Saya' : 'Mahasiswa')}</span>
                        <div className={`text-[10px] px-2.5 py-1.5 rounded-lg max-w-[85%] leading-relaxed ${isStaff ? 'bg-ipb-800 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                          {note.content}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="border-t border-ipb-100 pt-4">
              <h4 className="text-[12px] font-bold text-ipb-900 mb-3">⚙️ Aksi & Pembaruan Status</h4>
              
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Ubah Status</label>
                <select value={statusVal} onChange={(e) => setStatusVal(e.target.value)}
                  className="w-full border border-ipb-200 rounded-md px-2.5 py-1.5 text-[12px] outline-none focus:border-ipb-400 bg-white">
                  <option value="open">Open (Belum Diproses)</option>
                  <option value="progress">In Progress (Sedang Dibuat)</option>
                  <option value="resolved">Resolved (Selesai & Kirim Surat)</option>
                </select>
              </div>

              {statusVal === 'resolved' && (
                <div className="mb-4 bg-green-50 border border-green-100 rounded-lg p-3.5">
                  <label className="block text-[11px] font-bold text-green-800 mb-1.5">📤 Unggah Surat Hasil (.pdf)</label>
                  <input type="file" id="upload-surat" accept=".pdf" className="hidden" onChange={handleFileChange} />
                  <label htmlFor="upload-surat"
                    className="border-2 border-dashed border-green-300 rounded-lg p-3 block text-center bg-white cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all">
                    <div className="text-md mb-1">📄</div>
                    <div className="text-[11px] font-semibold text-green-700">
                      {uploadedFile ? 'Ganti file surat' : 'Pilih atau Drop File Surat'}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {uploadedFile ? uploadedFile : 'Format PDF — Maks. 10MB'}
                    </div>
                  </label>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Pesan / Balasan Diskusi</label>
                <textarea 
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  className="w-full border border-ipb-200 rounded-md px-2.5 py-2 text-[11px] outline-none focus:border-ipb-400 resize-none" 
                  rows={3} 
                  placeholder="Kirim tanggapan atau catatan tambahan ke mahasiswa..." 
                />
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" size="sm" onClick={handleUpdateStatus}>Simpan Update</Button>
                <Button size="sm" variant="danger" onClick={handleReject}>Reject</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <ConfirmModal state={confirmState} onClose={closeConfirm} />
    </div>
  )
}