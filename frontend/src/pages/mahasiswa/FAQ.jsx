import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentTopbar from '@/components/layout/StudentTopbar'
import Button from '@/components/ui/Button'
import { api } from '@/contexts/AuthContext'

export default function FAQ() {
  const [open, setOpen] = useState(-1)
  const [search, setSearch] = useState('')
  const [faqs, setFaqs] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const [faqRes, catRes] = await Promise.all([
          api.get('/faqs'),
          api.get('/categories'),
        ])
        setFaqs(faqRes.data)
        setCategories(catRes.data)
      } catch {
        // Keep empty arrays — UI handles gracefully
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSearch = async () => {
    try {
      const res = await api.get('/faqs', { params: { keyword: search.trim() || undefined } })
      setFaqs(res.data)
    } catch {
      // Silent
    }
  }

  const filtered = search.trim()
    ? faqs.filter(f =>
        f.question.toLowerCase().includes(search.toLowerCase()) ||
        f.answer.toLowerCase().includes(search.toLowerCase())
      )
    : faqs

  return (
    <div>
      <StudentTopbar />

      {/* Hero */}
      <div className="text-white px-7 py-8"
        style={{ background: 'linear-gradient(135deg,#042C53,#185FA5,#378ADD)' }}>
        <p className="text-[10px] text-ipb-200 tracking-widest uppercase mb-1.5">
          📚 IPB University · Layanan Akademik
        </p>
        <h1 className="text-[22px] font-extrabold mb-1">Frequently Asked Questions</h1>
        <p className="text-[12px] text-ipb-200 mb-4">
          Temukan jawaban sebelum mengajukan permintaan layanan
        </p>
        <div className="flex gap-2 max-w-[460px]">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            aria-label="Cari FAQ"
            className="flex-1 h-9 rounded-lg border-none px-3 text-[12px] bg-white/15 text-white placeholder:text-white/50 outline-none"
            placeholder="Cari FAQ: transkip, surat aktif, beasiswa..."
          />
          <Button className="!h-9 !bg-ipb-300 !text-white !rounded-lg" onClick={handleSearch}>Cari</Button>
        </div>
      </div>

      <div className="p-5">
        {/* Category quick-filter chips */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {categories.map(c => (
              <button key={c.id}
                className="bg-white border border-ipb-100 rounded-lg px-3 py-2 text-left cursor-pointer hover:shadow-md transition-all flex items-center gap-2"
                onClick={() => setSearch(c.nama_kategori.split(' ')[0])}>
                <span>{c.icon}</span>
                <span className="text-[11px] font-semibold text-ipb-900">{c.nama_kategori}</span>
              </button>
            ))}
          </div>
        )}

        {/* FAQ accordion */}
        <div className="bg-white rounded-lg border border-ipb-50 shadow-sm mb-3.5">
          <div className="px-4 py-3 border-b border-ipb-50 flex justify-between items-center">
            <span className="text-[13px] font-bold text-ipb-900">
              {search ? `Hasil pencarian: "${search}"` : 'Semua FAQ'}
            </span>
            <span className="text-[10px] text-gray-400">{filtered.length} artikel</span>
          </div>
          <div className="p-1.5">
            {loading && (
              <div className="text-center py-8 text-[12px] text-gray-400">Memuat FAQ...</div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="text-center py-8 text-[12px] text-gray-400">
                Tidak ada FAQ yang cocok dengan pencarian.<br />
                <span className="text-ipb-500 cursor-pointer font-medium"
                  onClick={() => navigate('/submit')}>
                  Ajukan tiket layanan →
                </span>
              </div>
            )}
            {filtered.map((f, i) => (
              <div key={f.id ?? i} className="bg-white border border-ipb-100 rounded-lg overflow-hidden mb-1.5">
                <button
                  onClick={() => setOpen(open === i ? -1 : i)}
                  aria-expanded={open === i}
                  className="flex items-center w-full px-3.5 py-3 gap-2.5 text-left border-none bg-transparent cursor-pointer hover:bg-ipb-25 transition-colors">
                  <div className="w-[22px] h-[22px] rounded bg-ipb-50 flex items-center justify-center text-[10px] text-ipb-500 font-bold shrink-0">
                    Q
                  </div>
                  <span className="text-[12px] font-medium text-ipb-900 flex-1">{f.question}</span>
                  <span className="text-[12px]" style={{ color: open === i ? '#378ADD' : '#B4B2A9' }}>
                    {open === i ? '▲' : '▼'}
                  </span>
                </button>
                {open === i && (
                  <div className="px-3.5 pb-3 text-[11px] text-gray-600 leading-relaxed border-t border-ipb-50">
                    <div className="pt-2.5 whitespace-pre-line">{f.answer}</div>
                    <div className="mt-2.5 pt-2.5 border-t border-ipb-50 text-[10px] text-ipb-500 cursor-pointer font-semibold"
                      onClick={() => navigate('/submit')}>
                      💬 Jawaban belum membantu? Ajukan tiket →
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-ipb-50 border border-ipb-200 rounded-md px-3 py-2.5 text-[11px] text-ipb-700 flex gap-2">
          ℹ️
          <div>
            Tidak menemukan jawaban?{' '}
            <strong className="cursor-pointer hover:underline" onClick={() => navigate('/submit')}>
              Ajukan tiket layanan →
            </strong>
          </div>
        </div>
      </div>
    </div>
  )
}
