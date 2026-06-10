import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentTopbar from '@/components/layout/StudentTopbar'
import Button from '@/components/ui/Button'
import { FormGroup, Input, Select, Textarea } from '@/components/ui/Input'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'
import ConfirmModal from '@/components/ui/ConfirmModal'
import ToastContainer from '@/components/ui/Toast'
import { api } from '@/contexts/AuthContext'

const STEPS = [
  { n: 1, label: 'Cek FAQ',      status: 'done'   },
  { n: 2, label: 'Isi Formulir', status: 'active'  },
  { n: 3, label: 'Dokumen',      status: 'pending' },
  { n: 4, label: 'Konfirmasi',   status: 'pending' },
]

export default function Submit() {
  const navigate = useNavigate()
  const { toasts, toast, removeToast } = useToast()
  const { confirmState, confirm, closeConfirm } = useConfirm()
  
  const [categoriesList, setCategoriesList] = useState([])
  const [historyList, setHistoryList] = useState([])
  const [files, setFiles] = useState([])
  
  // Form fields
  const [title, setTitle] = useState("Permohonan Transkip Nilai Resmi untuk LPDP")
  const [categoryId, setCategoryId] = useState("")
  const [priority, setPriority] = useState("medium")
  const [description, setDescription] = useState("Saya membutuhkan transkip nilai resmi yang sudah dilegalisir untuk keperluan beasiswa LPDP 2026. Diperlukan dalam format bahasa Indonesia dan Inggris. Mohon diproses sebelum 25 Maret 2026.")
  const [deadline, setDeadline] = useState("2026-03-25")
  
  // Fetch categories and student ticket history on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const catRes = await api.get('/categories')
        setCategoriesList(catRes.data)
        if (catRes.data.length > 0) {
          setCategoryId(catRes.data[0].id)
        }
      } catch (err) {
        console.error("Gagal mengambil daftar kategori:", err)
      }

      try {
        const histRes = await api.get('/tickets/my')
        const formatted = histRes.data.slice(0, 3).map(t => ({
          id: `#TKT-2026-${t.id.toString().padStart(4, '0')}`,
          title: t.title,
          date: t.created_at ? new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Baru saja',
          status: t.status
        }))
        setHistoryList(formatted)
      } catch (err) {
        console.error("Gagal mengambil riwayat tiket:", err)
      }
    }
    loadInitialData()
  }, [])

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files)
    console.log('selected file names', selectedFiles.map(file => file.name))
    if (selectedFiles.length === 0) return

    for (const file of selectedFiles) {
      const tempId = Math.random().toString(36).substring(7)
      const newFileObj = {
        id: tempId,
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        loading: true,
        error: null
      }
      setFiles(prev => [...prev, newFileObj])

      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await api.post('/uploads', formData)
        console.log('upload response', response.data)
        
        setFiles(prev => prev.map(f => f.id === tempId ? {
          ...f,
          id: response.data.id,
          loading: false,
          url: response.data.url
        } : f))
        toast(`🎉 File ${file.name} berhasil diunggah!`, 'success')
      } catch (err) {
        console.error(err)
        const errMsg =
          err.response?.data?.detail ||
          (err.response?.status >= 500
            ? "Upload gagal karena gangguan server. Coba lagi sebentar lagi."
            : "Upload gagal. Periksa format file (PDF/PNG/JPG) dan ukuran maksimal 10MB.")
        setFiles(prev => prev.map(f => f.id === tempId ? {
          ...f,
          loading: false,
          error: errMsg
        } : f))
        toast(`❌ Gagal mengunggah ${file.name}: ${errMsg}`, 'error')
      }
    }
    // Reset file input value to allow uploading the same file again
    e.target.value = ""
  }

  const handleDeleteFile = (idToDelete) => {
    setFiles(prev => prev.filter(f => f.id !== idToDelete))
    toast('🗑️ Lampiran dihapus', 'info')
  }

  const handleSubmit = () => {
    if (!title || !description || !categoryId) {
      toast('⚠️ Mohon lengkapi seluruh kolom yang bertanda bintang (*)!', 'error')
      return
    }

    if (files.some(f => f.loading)) {
      toast('⏳ Tunggu sampai semua dokumen selesai diunggah sebelum submit.', 'info')
      return
    }

    const attachmentIds = files.filter(f => !f.loading && !f.error).map(f => f.id)

    confirm(
      'Kirim Permohonan?',
      'Pastikan semua data sudah benar. Permohonan tidak bisa diubah setelah dikirim.',
      async () => {
        try {
          const payload = {
            title,
            description,
            category_id: parseInt(categoryId),
            priority,
            deadline: deadline || null,
            attachment_ids: attachmentIds,
            form_data: {}
          }
          const res = await api.post('/tickets', payload)
          toast(`🎉 Permohonan berhasil dikirim! ID: #TKT-2026-${res.data.id.toString().padStart(4, '0')}`, 'success')
          setTimeout(() => navigate('/track'), 1200)
        } catch (err) {
          console.error(err)
          toast(`❌ Gagal mengirim: ${err.response?.data?.detail || err.message}`, 'error')
        }
      }
    )
  }

  return (
    <div>
      <StudentTopbar />
      <div className="p-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-3">
          <span className="cursor-pointer hover:text-ipb-500" onClick={() => navigate('/faq')}>FAQ</span>
          <span className="text-gray-200">›</span>
          <span className="text-ipb-600 font-semibold">Ajukan Layanan</span>
        </div>

        <h1 className="text-[18px] font-bold text-ipb-900 mb-1">Ajukan Layanan Akademik</h1>
        <p className="text-[11px] text-gray-400 mb-4">Lengkapi formulir. Pastikan sudah membaca FAQ.</p>

        {/* Step bar */}
        <div className="flex items-center mb-5">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div className="flex items-center gap-1.5">
                <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0
                  ${s.status === 'done'   ? 'bg-ipb-400 text-white'
                  : s.status === 'active' ? 'bg-ipb-800 text-white shadow-[0_0_0_3px_#D6E9FA]'
                  :                        'bg-gray-200 text-gray-400'}`}>
                  {s.status === 'done' ? '✓' : s.n}
                </div>
                <span className={`text-[10px] font-medium
                  ${s.status === 'active' ? 'text-ipb-800 font-bold'
                  : s.status === 'done'   ? 'text-ipb-500'
                  :                        'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1.5 ${s.status === 'done' ? 'bg-ipb-300' : 'bg-ipb-100'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[1fr_260px] gap-4">
          {/* Left: Form */}
          <div>
            <div className="bg-white rounded-lg border border-ipb-50 shadow-sm p-5 mb-3.5">
              <h2 className="text-[13px] font-bold text-ipb-900 mb-3.5">📝 Detail Permohonan</h2>
              <FormGroup label="Judul" required>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </FormGroup>
              <div className="grid grid-cols-2 gap-3">
                <FormGroup label="Kategori" required>
                  <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    {categoriesList.map(c => (
                      <option key={c.id} value={c.id}>{c.nama_kategori}</option>
                    ))}
                  </Select>
                </FormGroup>
                <FormGroup label="Prioritas">
                  <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="low">Normal</option>
                    <option value="medium">Mendesak</option>
                    <option value="high">Sangat Mendesak</option>
                  </Select>
                </FormGroup>
              </div>
              <FormGroup label="Deskripsi" required>
                <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
              </FormGroup>
              <FormGroup label="Tenggat Waktu (opsional)">
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </FormGroup>
            </div>

            {/* Upload */}
            <div className="bg-white rounded-lg border border-ipb-50 shadow-sm p-5 mb-3.5">
              <h2 className="text-[13px] font-bold text-ipb-900 mb-3">📎 Dokumen Pendukung</h2>
              <label
                htmlFor="student-file-picker"
                className="relative block border-2 border-dashed border-ipb-300 rounded-lg p-5 text-center bg-ipb-50 cursor-pointer hover:border-ipb-400 hover:bg-ipb-100 transition-all">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  onClick={() => console.log('file picker clicked')}
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="student-file-picker"
                />
                <div className="text-2xl mb-1.5">📂</div>
                <div className="text-[12px] font-semibold text-ipb-600 mb-0.5">Klik untuk memilih file pendukung</div>
                <div className="text-[10px] text-gray-400">PDF, PNG, JPG — Maks. 10MB per file</div>
              </label>
              {files.map((f) => (
                <div key={f.id} className={`flex items-center gap-2 bg-white border rounded-md px-2.5 py-2 mt-2 ${f.error ? 'border-red-200 bg-red-50/10' : 'border-ipb-200'}`}>
                  <div className="w-[26px] h-[26px] bg-ipb-50 rounded flex items-center justify-center text-xs shrink-0">
                    {f.loading ? '⏳' : '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium truncate">{f.name}</div>
                    <div className="text-[9px] text-gray-400">
                      {f.loading ? 'Mengunggah...' : f.error ? <span className="text-red-500">{f.error}</span> : f.size}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(f.id)}
                    className="text-gray-300 hover:text-danger-500 text-sm px-1 border-none bg-transparent cursor-pointer">
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <Button variant="ghost" onClick={() => navigate('/faq')}>← Kembali</Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => toast('💾 Fitur draft akan segera hadir!', 'info')}>💾 Simpan Draft</Button>
                <Button onClick={handleSubmit} disabled={files.some(f => f.loading)}>
                  {files.some(f => f.loading) ? 'Menunggu Upload...' : 'Submit Permohonan →'}
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Sidebar */}
          <div>
            <div className="bg-white rounded-lg border border-ipb-50 shadow-sm p-5 mb-3">
              <h3 className="text-[13px] font-bold text-ipb-900 mb-2.5">ℹ️ Info Layanan</h3>
              <div className="text-[11px] text-gray-600 leading-relaxed">
                <strong className="text-ipb-800">Syarat Ketentuan</strong>
                <br /><br />
                ⏱ Estimasi: <strong>1–3 hari kerja</strong>
                <br /><br />
                📋 Dokumen wajib:
                <ul className="ml-3.5 mt-1 mb-2.5 space-y-0.5 list-disc">
                  <li>KTM aktif (format PDF/JPG)</li>
                  <li>Bukti pendukung (jika ada)</li>
                </ul>
                <div className="bg-amber-100 text-amber-700 text-[10px] rounded-md px-2.5 py-2">
                  ⚠️ Pastikan semua info benar sebelum submit.
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-ipb-50 shadow-sm p-5">
              <h3 className="text-[13px] font-bold text-ipb-900 mb-2.5">📊 Riwayat Saya</h3>
              {historyList.length === 0 ? (
                <div className="text-[10px] text-gray-400 italic">Belum ada riwayat permohonan.</div>
              ) : (
                historyList.map((t, i) => (
                  <div key={i}
                    onClick={() => navigate('/track')}
                    className="bg-white border border-ipb-100 rounded-lg p-2.5 mb-2 cursor-pointer hover:border-ipb-300 hover:shadow-sm transition-all">
                    <div className="text-[10px] font-mono font-bold text-ipb-500">{t.id}</div>
                    <div className="text-[11px] font-semibold text-ipb-900 my-0.5 truncate">{t.title}</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[9px] text-gray-400">{t.date}</span>
                      <span className={`inline-flex items-center text-[9px] font-semibold px-1.5 py-px rounded-full
                        ${t.status === 'resolved' ? 'bg-green-100 text-green-700' : t.status === 'progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <ConfirmModal state={confirmState} onClose={closeConfirm} />
    </div>
  )
}
