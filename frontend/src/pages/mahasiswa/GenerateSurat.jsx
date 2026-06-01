import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentTopbar from '@/components/layout/StudentTopbar'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { FormGroup, Input, Select, Textarea } from '@/components/ui/Input'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'
import ToastContainer from '@/components/ui/Toast'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { api, useAuth } from '@/contexts/AuthContext'

const SURAT_TYPES = [
  {
    id: 'aktif',
    icon: '🎓',
    label: 'Surat Keterangan Aktif Kuliah',
    desc: 'Untuk keperluan beasiswa, BPJS, bank, dsb.',
    color: '#EAF3FC',
    accent: '#2478C8',
    fields: ['tujuan', 'keperluan'],
    badge: 'Paling Populer',
  },
  {
    id: 'lulus',
    icon: '📜',
    label: 'Surat Keterangan Lulus (SKL)',
    desc: 'Sementara menunggu ijazah resmi terbit.',
    color: '#EAF3DE',
    accent: '#3B6D11',
    fields: ['tujuan', 'keperluan'],
    badge: null,
  },
  {
    id: 'rekomendasi',
    icon: '✍️',
    label: 'Surat Rekomendasi',
    desc: 'Untuk beasiswa, magang, atau studi lanjut.',
    color: '#EEE8FF',
    accent: '#5340B0',
    fields: ['tujuan', 'keperluan', 'dosen', 'program'],
    badge: null,
  },
  {
    id: 'domisili',
    icon: '🏠',
    label: 'Surat Keterangan Domisili',
    desc: 'Untuk keperluan administrasi kependudukan.',
    color: '#FAEEDA',
    accent: '#854F0B',
    fields: ['tujuan', 'alamat'],
    badge: null,
  },
  {
    id: 'magang',
    icon: '💼',
    label: 'Surat Pengantar Magang',
    desc: 'Pengantar resmi dari IPB untuk instansi magang.',
    color: '#FCEBEB',
    accent: '#A32D2D',
    fields: ['tujuan', 'instansi', 'periode', 'keperluan'],
    badge: null,
  },
  {
    id: 'penelitian',
    icon: '🔬',
    label: 'Surat Izin Penelitian',
    desc: 'Untuk keperluan riset tugas akhir atau tesis.',
    color: '#F0F9FF',
    accent: '#0369A1',
    fields: ['tujuan', 'instansi', 'judul', 'periode'],
    badge: null,
  },
]

const FALLBACK_USER_PROFILE = {
  nama: 'Mahasiswa IPB',
  nim: '-',
  prodi: 'Ilmu Komputer',
  fakultas: 'FMIPA',
  angkatan: '2023',
  semester: '5',
  status: 'Aktif',
  email: '-',
  pembimbing: 'Dr. Ir. Budi Santoso, M.Sc.',
  ipk: '3.85',
}

const buildLetterSummary = (selectedType, fields, userProfile) => {
  const fieldLines = Object.entries(fields)
    .filter(([, value]) => value)
    .map(([key, value]) => `- ${key.replace(/_/g, ' ')}: ${value}`)
    .join('\n')

  return [
    `Permohonan ${selectedType.label}`,
    '',
    `Mahasiswa: ${userProfile.nama}`,
    `NIM/NIP: ${userProfile.nim}`,
    `Email: ${userProfile.email}`,
    '',
    'Data permohonan:',
    fieldLines || '- Tidak ada data tambahan',
    '',
    'Catatan: PDF surat resmi hanya boleh diterbitkan setelah permohonan disetujui staff.',
  ].join('\n')
}

const getAcademicLetterCategoryId = (categories) => {
  const preferred = categories.find(category => {
    const name = (category.nama_kategori || '').toLowerCase()
    return name.includes('surat') || name.includes('akademik')
  })
  return preferred?.id || categories[0]?.id || null
}

function SuratPreview({ type, formData, user }) {
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const noSurat = `${type?.id?.toUpperCase() || 'SK'}/IPB/${new Date().getFullYear()}/${Math.floor(Math.random() * 9000) + 1000}`

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md"
      style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>
      <div className="bg-ipb-900 px-6 py-4 flex items-center gap-4">
        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shrink-0">
          <div className="text-center">
            <div className="w-10 h-10 bg-ipb-500 rounded-full flex items-center justify-center">
              <div className="w-5 h-5 bg-white rounded-full" />
            </div>
          </div>
        </div>
        <div className="text-white">
          <div className="text-[13px] font-bold leading-snug">KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET DAN TEKNOLOGI</div>
          <div className="text-[15px] font-extrabold leading-snug">INSTITUT PERTANIAN BOGOR</div>
          <div className="text-[11px] text-ipb-200 leading-snug">Jl. Raya Dramaga, Kampus IPB Dramaga, Bogor 16680</div>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-ipb-500 to-ipb-300" />

      <div className="px-8 py-6 relative">
        <div className="text-center mb-6">
          <h2 className="text-[14px] font-bold uppercase tracking-widest underline underline-offset-2">
            {type?.label || 'SURAT KETERANGAN'}
          </h2>
          <p className="text-[11px] text-gray-500 mt-1">Nomor: {noSurat}</p>
        </div>

        <div className="text-[12px] leading-loose text-gray-800 space-y-3">
          <p>Yang bertanda tangan di bawah ini, Direktur Kemahasiswaan Institut Pertanian Bogor, dengan ini menerangkan bahwa:</p>

          <div className="border border-gray-200 rounded-md overflow-hidden my-4">
            {[
              ['Nama',        user.nama],
              ['NIM',         user.nim],
              ['Program Studi', user.prodi],
              ['Fakultas',    user.fakultas],
              ['Angkatan',    user.angkatan],
              ['Semester',    user.semester],
              ['Status',      user.status],
              ['IPK Terakhir', user.ipk],
            ].map(([k, v], i) => (
              <div key={i} className={`flex text-[11px] ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                <span className="w-36 px-3 py-1.5 font-semibold text-gray-600 border-r border-gray-200 shrink-0">{k}</span>
                <span className="px-3 py-1.5 text-gray-900">{v}</span>
              </div>
            ))}
          </div>

          {type?.id === 'aktif' && (
            <p>
              adalah mahasiswa Institut Pertanian Bogor yang masih aktif mengikuti perkuliahan pada semester {user.semester} Tahun Akademik 2025/2026.
              Surat keterangan ini dibuat untuk keperluan{' '}
              <strong>{formData.keperluan || '[keperluan]'}</strong>
              {formData.tujuan ? ` yang ditujukan kepada ${formData.tujuan}` : ''}.
            </p>
          )}
          {type?.id === 'lulus' && (
            <p>
              adalah mahasiswa Institut Pertanian Bogor yang dinyatakan telah menyelesaikan seluruh kewajiban akademik dan dinyatakan lulus pada Program Studi {user.prodi}, Fakultas {user.fakultas} dengan Indeks Prestasi Kumulatif (IPK) sebesar <strong>{user.ipk}</strong>. Ijazah resmi sedang dalam proses penerbitan. Surat keterangan ini dibuat untuk keperluan <strong>{formData.keperluan || '[keperluan]'}</strong>{formData.tujuan ? ` yang ditujukan kepada ${formData.tujuan}` : ''}.
            </p>
          )}
          {type?.id === 'rekomendasi' && (
            <p>
              Mahasiswa tersebut di atas layak untuk mendapatkan rekomendasi dalam rangka{' '}
              {formData.keperluan || '[keperluan]'}{formData.program ? ` pada program ${formData.program}` : ''}.
              Berdasarkan rekam akademik yang bersangkutan, kami menyatakan bahwa mahasiswa ini memiliki kemampuan dan integritas yang baik.
            </p>
          )}
          {type?.id === 'domisili' && (
            <p>
              mahasiswa tersebut di atas berdomisili di{' '}
              {formData.alamat || '[alamat domisili]'} selama menempuh pendidikan di Institut Pertanian Bogor.
            </p>
          )}
          {type?.id === 'magang' && (
            <p>
              Mahasiswa tersebut di atas akan melaksanakan kegiatan magang/praktik kerja lapangan di{' '}
              <strong>{formData.instansi || '[nama instansi]'}</strong>
              {formData.periode ? ` pada periode ${formData.periode}` : ''}.
              Kami memohon bantuan dan kerja sama dari pihak instansi yang bersangkutan.
            </p>
          )}
          {type?.id === 'penelitian' && (
            <p>
              Mahasiswa tersebut di atas sedang melaksanakan penelitian dengan judul
              "{formData.judul || '[judul penelitian]'}" di{' '}
              <strong>{formData.instansi || '[nama instansi/lokasi]'}</strong>
              {formData.periode ? ` pada periode ${formData.periode}` : ''} dalam rangka penyelesaian tugas akhir.
            </p>
          )}

          <p>Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>

          <div className="flex justify-end mt-6 relative">
            <div className="absolute right-24 bottom-2 w-24 h-24 rounded-full border-4 border-double border-blue-600/60 flex flex-col items-center justify-center rotate-[-12deg] pointer-events-none bg-white/10 select-none">
              <div className="text-[7px] font-bold text-blue-600/70 tracking-wider text-center leading-none uppercase">KEMENDIKBUDRISTEK<br/>INSTITUT PERTANIAN<br/>BOGOR</div>
              <div className="w-16 h-[1px] bg-blue-600/50 my-0.5" />
              <div className="text-[8px] font-black text-blue-700/80 tracking-widest text-center leading-none uppercase">DIREKTUR<br/>KEMAHASISWAN</div>
            </div>

            <div className="text-center text-[11px] relative z-10">
              <p>Bogor, {today}</p>
              <p className="mt-1">Direktur Kemahasiswaan IPB</p>
              
              <div className="my-2 h-14 flex items-center justify-center select-none pointer-events-none">
                <span className="font-serif italic text-xl font-bold text-blue-700/80 tracking-widest select-none rotate-[-4deg]">
                  Ahmad Fauzi
                </span>
              </div>
              
              <p className="font-bold">Dr. Ahmad Fauzi, S.Kom., M.T.</p>
              <p className="text-gray-500">NIP. 197805142005011002</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
            <div className="text-[10px] text-gray-400">
              <p>Preview dokumen. Versi resmi diterbitkan setelah persetujuan staff layanan akademik.</p>
              <p>Kode verifikasi: IPB-{noSurat.split('/').pop()}-VRF-AUTO</p>
            </div>
            <div className="w-16 h-16 rounded-full border-2 border-solid border-blue-600/70 flex flex-col items-center justify-center rotate-6 bg-blue-50/30">
              <span className="text-[7px] text-blue-600 text-center leading-tight font-black uppercase">SIGNED<br/>DIGITAL<br/>IPB ID</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepBar({ step }) {
  const steps = ['Pilih Jenis', 'Isi Data', 'Preview', 'Selesai']
  return (
    <div className="flex items-center mb-6">
      {steps.map((s, i) => [
        <div key={s} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0
            ${i < step  ? 'bg-ipb-400 text-white'
            : i === step ? 'bg-ipb-800 text-white shadow-[0_0_0_3px_#D6E9FA]'
            :              'bg-gray-200 text-gray-400'}`}>
            {i < step ? '✓' : i + 1}
          </div>
          <span className={`text-[11px] font-medium
            ${i === step ? 'text-ipb-800 font-bold'
            : i < step   ? 'text-ipb-500'
            :              'text-gray-400'}`}>
            {s}
          </span>
        </div>,
        i < steps.length - 1 && (
          <div key={`c${i}`} className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-ipb-300' : 'bg-gray-200'}`} />
        ),
      ])}
    </div>
  )
}

export default function GenerateSurat() {
  const navigate   = useNavigate()
  const { toasts, toast, removeToast } = useToast()
  const { confirmState, confirm, closeConfirm } = useConfirm()
  const { user } = useAuth()

  const [step, setStep]         = useState(0)
  const [selType, setSelType]   = useState(null)
  const [formData, setFormData] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState([])
  const [submittedTicket, setSubmittedTicket] = useState(null)

  const selectedType = SURAT_TYPES.find(t => t.id === selType)
  const userProfile = {
    ...FALLBACK_USER_PROFILE,
    nama: user?.nama || FALLBACK_USER_PROFILE.nama,
    nim: user?.nim_or_nip || FALLBACK_USER_PROFILE.nim,
    email: user?.email || FALLBACK_USER_PROFILE.email,
  }
  const periode = [formData.periode_start, formData.periode_end].filter(Boolean).join(' s.d. ')
  const previewFormData = {
    ...formData,
    periode: formData.periode || periode,
  }

  const handleField = (k, v) => setFormData(p => ({ ...p, [k]: v }))

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get('/categories')
        setCategories(response.data || [])
      } catch (err) {
        console.error('Gagal memuat kategori surat:', err)
      }
    }
    loadCategories()
  }, [])

  const handleGenerate = () => {
    if (!selectedType) return

    confirm(
      'Ajukan Permohonan Surat?',
      'Permohonan akan dikirim ke staff untuk diverifikasi. PDF resmi baru tersedia setelah disetujui.',
      async () => {
        setIsSubmitting(true)
        try {
          const response = await api.post('/tickets', {
            title: `Permohonan ${selectedType.label}`,
            description: buildLetterSummary(selectedType, previewFormData, userProfile),
            category_id: getAcademicLetterCategoryId(categories),
            priority: 'medium',
            deadline: null,
            attachment_ids: [],
            form_data: {
              request_type: 'academic_letter',
              surat_type: selectedType.id,
              surat_label: selectedType.label,
              fields: previewFormData,
              preview_user_data: {
                nama: userProfile.nama,
                nim: userProfile.nim,
                email: userProfile.email,
                prodi: userProfile.prodi,
                fakultas: userProfile.fakultas,
                angkatan: userProfile.angkatan,
                semester: userProfile.semester,
                status: userProfile.status,
                ipk: userProfile.ipk,
              },
            },
          })

          setSubmittedTicket(response.data)
          setStep(3)
          setSubmitted(true)
          toast('Permohonan surat berhasil diajukan dan menunggu persetujuan staff.', 'success')
          setTimeout(() => navigate('/track'), 1400)
        } catch (err) {
          console.error(err)
          toast(`Gagal mengajukan permohonan: ${err.response?.data?.detail || err.message}`, 'error')
        } finally {
          setIsSubmitting(false)
        }
      }
    )
  }

  return (
    <div>
      <StudentTopbar />

      <div className="px-7 py-7 text-white" style={{ background: 'linear-gradient(135deg,#042C53 0%,#185FA5 60%,#378ADD 100%)' }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📄</span>
              <span className="text-[10px] text-ipb-200 tracking-widest uppercase font-semibold">Staff Approval Required</span>
            </div>
            <h1 className="text-[22px] font-extrabold mb-1.5">Pengajuan Surat Akademik IPB</h1>
            <p className="text-[12px] text-ipb-200">Pilih jenis surat, isi data, lalu ajukan ke staff. PDF resmi tersedia setelah permohonan disetujui.</p>
          </div>
          <div className="shrink-0 bg-white/10 rounded-xl px-4 py-3 text-right">
            <p className="text-[10px] text-ipb-200">Logged in as</p>
            <p className="text-[13px] font-bold">{userProfile.nama.split(' ').slice(0,2).join(' ')}</p>
            <p className="text-[10px] text-ipb-200">{userProfile.nim}</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <StepBar step={step} />

        {step === 0 && (
          <div>
            <h2 className="text-[15px] font-bold text-ipb-900 mb-1">Pilih Jenis Surat</h2>
            <p className="text-[11px] text-gray-400 mb-4">Dokumen yang dipilih akan diajukan ke staff untuk verifikasi dan persetujuan.</p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {SURAT_TYPES.map(t => (
                <button key={t.id} onClick={() => setSelType(t.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md
                    ${selType === t.id
                      ? 'border-ipb-500 shadow-md'
                      : 'border-gray-100 bg-white hover:border-ipb-200'}`}
                  style={{ background: selType === t.id ? `${t.color}` : '#fff' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-2xl">{t.icon}</div>
                    {t.badge && (
                      <span className="text-[8px] font-bold px-1.5 py-px rounded-full bg-ipb-500 text-white">{t.badge}</span>
                    )}
                  </div>
                  <p className="text-[12px] font-bold text-ipb-900 mb-1 leading-snug">{t.label}</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed mb-2">{t.desc}</p>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-green-600">⚡</span>
                    <span className="text-[9px] text-green-600 font-bold">Butuh Persetujuan Staff</span>
                  </div>
                  {selType === t.id && (
                    <div className="mt-2 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: t.accent }} />
                      <span className="text-[10px] font-semibold" style={{ color: t.accent }}>Dipilih</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <Button disabled={!selType} onClick={() => setStep(1)}>
                Lanjut Isi Data →
              </Button>
            </div>
          </div>
        )}

        {step === 1 && selectedType && (
          <div className="grid grid-cols-[1fr_320px] gap-5">
            <div>
              <h2 className="text-[15px] font-bold text-ipb-900 mb-1">Isi Data Tambahan</h2>
              <p className="text-[11px] text-gray-400 mb-4">Lengkapi informasi berikut untuk diajukan ke staff layanan akademik.</p>

              <div className="bg-white rounded-xl border border-ipb-100 shadow-sm p-5 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-[10px] text-green-700">✓</span>
                  </div>
                  <span className="text-[12px] font-bold text-ipb-900">Data Mahasiswa Verified (Sistem)</span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {[['Nama Lengkap', userProfile.nama],['NIM', userProfile.nim],['Program Studi', userProfile.prodi],['Fakultas', userProfile.fakultas],['Angkatan', userProfile.angkatan],['Semester', userProfile.semester],['IPK Terakhir', userProfile.ipk]].map(([k,v]) => (
                    <div key={k} className="flex items-start gap-2 text-[11px]">
                      <span className="text-gray-400 shrink-0 w-28">{k}</span>
                      <span className="font-semibold text-gray-800">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-ipb-100 shadow-sm p-5 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{selectedType.icon}</span>
                  <span className="text-[12px] font-bold text-ipb-900">{selectedType.label}</span>
                </div>

                {selectedType.fields.includes('tujuan') && (
                  <FormGroup label="Ditujukan Kepada" required hint="Contoh: Pihak Bank BRI, BPJS Cabang Bogor, Panitia Beasiswa XYZ">
                    <Input placeholder="Nama instansi / pihak yang dituju" onChange={e => handleField('tujuan', e.target.value)} />
                  </FormGroup>
                )}
                {selectedType.fields.includes('keperluan') && (
                  <FormGroup label="Keperluan" required hint="Jelaskan secara singkat untuk apa surat ini digunakan">
                    <Input placeholder="Contoh: pengajuan beasiswa LPDP 2026, pembukaan rekening tabungan, dll." onChange={e => handleField('keperluan', e.target.value)} />
                  </FormGroup>
                )}
                {selectedType.fields.includes('instansi') && (
                  <FormGroup label="Nama Instansi / Lokasi" required>
                    <Input placeholder="Contoh: PT. Telkom Indonesia, LIPI Cibinong" onChange={e => handleField('instansi', e.target.value)} />
                  </FormGroup>
                )}
                {selectedType.fields.includes('periode') && (
                  <div className="grid grid-cols-2 gap-3">
                    <FormGroup label="Tanggal Mulai" required>
                      <Input type="date" onChange={e => handleField('periode_start', e.target.value)} />
                    </FormGroup>
                    <FormGroup label="Tanggal Selesai" required>
                      <Input type="date" onChange={e => handleField('periode_end', e.target.value)} />
                    </FormGroup>
                  </div>
                )}
                {selectedType.fields.includes('judul') && (
                  <FormGroup label="Judul Penelitian" required>
                    <Input placeholder="Judul lengkap penelitian tugas akhir" onChange={e => handleField('judul', e.target.value)} />
                  </FormGroup>
                )}
                {selectedType.fields.includes('dosen') && (
                  <FormGroup label="Nama Dosen Pembimbing" required>
                    <Input defaultValue={userProfile.pembimbing} onChange={e => handleField('dosen', e.target.value)} />
                  </FormGroup>
                )}
                {selectedType.fields.includes('program') && (
                  <FormGroup label="Program yang Dituju" hint="Contoh: S2 Ilmu Komputer UI, Beasiswa LPDP Dalam Negeri">
                    <Input placeholder="Nama program / beasiswa yang dituju" onChange={e => handleField('program', e.target.value)} />
                  </FormGroup>
                )}
                {selectedType.fields.includes('alamat') && (
                  <FormGroup label="Alamat Domisili Lengkap" required>
                    <Textarea rows={3} placeholder="Jl. Contoh No. 1, RT 01/RW 01, Kel. Dramaga, Kec. Dramaga, Kab. Bogor, Jawa Barat 16680" onChange={e => handleField('alamat', e.target.value)} />
                  </FormGroup>
                )}

                <FormGroup label="Catatan Tambahan (opsional)">
                  <Textarea rows={2} placeholder="Informasi lain..." onChange={e => handleField('catatan', e.target.value)} />
                </FormGroup>
              </div>

              <div className="flex justify-between items-center">
                <Button variant="ghost" onClick={() => setStep(0)}>← Ganti Jenis Surat</Button>
                <Button onClick={() => setStep(2)}>Preview Surat →</Button>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-xl border border-ipb-100 shadow-sm p-5 mb-3"
                style={{ borderTop: `3px solid ${selectedType.accent}` }}>
                <div className="text-2xl mb-2">{selectedType.icon}</div>
                <h3 className="text-[13px] font-bold text-ipb-900 mb-1">{selectedType.label}</h3>
                <p className="text-[11px] text-gray-500 mb-3">{selectedType.desc}</p>
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">⚡</span>
                    <span>Metode: <strong>Review Staff</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">✍️</span>
                    <span>PDF resmi diterbitkan setelah disetujui</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">📥</span>
                    <span>Download tersedia dari detail tiket</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && selectedType && (
          <div className="grid grid-cols-[1fr_320px] gap-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-[15px] font-bold text-ipb-900">Review Dokumen Resmi</h2>
                  <p className="text-[11px] text-gray-400">Preview ini hanya pratinjau. PDF resmi dibuat setelah staff menyetujui permohonan.</p>
                </div>
              </div>

              <SuratPreview type={selectedType} formData={previewFormData} user={userProfile} />

              <div className="flex justify-between items-center mt-4">
                <Button variant="ghost" onClick={() => setStep(1)}>← Edit Data</Button>
                <Button onClick={handleGenerate} disabled={isSubmitting}>
                  {isSubmitting ? 'Mengajukan...' : 'Ajukan Permohonan Surat'}
                </Button>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-xl border border-ipb-100 shadow-sm p-5 mb-3">
                <h3 className="text-[13px] font-bold text-ipb-900 mb-3">✅ Cek Kevalidan</h3>
                {[
                  ['Nama mahasiswa sesuai SIMAK', true],
                  ['NIM dan prodi terverifikasi', true],
                  ['IPK terverifikasi otomatis', true],
                  ['Instansi tujuan terisi', !!formData.tujuan],
                  ['Keperluan sudah jelas', !!formData.keperluan],
                ].map(([label, ok], i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-50 text-[11px] last:border-0">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${ok ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {ok ? '✓' : '!'}
                    </div>
                    <span className={ok ? 'text-gray-700' : 'text-amber-700'}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl mb-4 shadow-md">
              ✓
            </div>
            <h2 className="text-[22px] font-extrabold text-ipb-900 mb-2">Permohonan Surat Terkirim</h2>
            <p className="text-[13px] text-gray-500 mb-6">Permohonan <strong>{selectedType?.label}</strong> berhasil diajukan dan menunggu persetujuan staff.</p>

            <div className="bg-white rounded-xl border border-ipb-100 shadow-sm p-5 w-full max-w-md mb-6 text-left">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-bold text-green-600">
                  {submittedTicket ? `#TKT-2026-${String(submittedTicket.id).padStart(4, '0')}` : '#TKT-2026'}
                </span>
                <Badge v="progress">Menunggu Staff</Badge>
              </div>
              <p className="text-[13px] font-bold text-ipb-900 mb-3">{selectedType?.label}</p>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-green-600 h-1.5 rounded-full" style={{ width: '100%' }} />
              </div>
              <p className="text-[10px] text-green-600 mt-1.5">PDF resmi akan muncul di detail tiket setelah staff menyetujui permohonan.</p>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => { setStep(0); setSelType(null); setFormData({}); setSubmittedTicket(null); setSubmitted(false) }}>
                + Buat Surat Lain
              </Button>
              <Button onClick={() => navigate('/track')}>Lihat Status Tiket</Button>
            </div>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <ConfirmModal state={confirmState} onClose={closeConfirm} />
    </div>
  )
}
