from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fpdf import FPDF


def _pdf_text(value) -> str:
    text = "-" if value is None else str(value)
    return text.encode("latin-1", "replace").decode("latin-1")


def _right_cell(pdf: FPDF, text: str, height: int = 7) -> None:
    pdf.set_x(pdf.l_margin)
    pdf.cell(0, height, _pdf_text(text), ln=True, align="R")


def _full_multi_cell(pdf: FPDF, text: str, height: int = 7) -> None:
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(pdf.epw, height, _pdf_text(text))


def _build_letter_body(user, surat_type: dict, form_data: dict) -> str:
    surat_id = surat_type.get("id")
    nama = getattr(user, "nama", "-")
    nim_or_nip = getattr(user, "nim_or_nip", "-") or "-"
    tujuan = form_data.get("tujuan")
    keperluan = form_data.get("keperluan")
    instansi = form_data.get("instansi")
    periode = form_data.get("periode")

    if surat_id == "aktif":
        return (
            f"Yang bertanda tangan di bawah ini menerangkan bahwa {nama} dengan NIM {nim_or_nip} "
            f"adalah mahasiswa Institut Pertanian Bogor yang berstatus aktif. Surat ini dibuat "
            f"untuk keperluan {keperluan or '-'}"
            f"{f' dan ditujukan kepada {tujuan}' if tujuan else ''}."
        )
    if surat_id == "lulus":
        return (
            f"Dengan ini menerangkan bahwa {nama} dengan NIM {nim_or_nip} telah menyelesaikan "
            f"kewajiban akademik di Institut Pertanian Bogor. Surat ini dibuat untuk keperluan "
            f"{keperluan or '-'}{f' dan ditujukan kepada {tujuan}' if tujuan else ''}."
        )
    if surat_id == "rekomendasi":
        return (
            f"Mahasiswa {nama} dengan NIM {nim_or_nip} layak mendapatkan rekomendasi dalam rangka "
            f"{keperluan or '-'}{(' pada program ' + form_data.get('program')) if form_data.get('program') else ''}."
        )
    if surat_id == "domisili":
        return (
            f"Dengan ini menerangkan bahwa {nama} dengan NIM {nim_or_nip} berdomisili di "
            f"{form_data.get('alamat') or '-'} selama menempuh pendidikan di Institut Pertanian Bogor."
        )
    if surat_id == "magang":
        return (
            f"Dengan ini menerangkan bahwa {nama} dengan NIM {nim_or_nip} akan melaksanakan kegiatan "
            f"magang/praktik kerja lapangan di {instansi or '-'}"
            f"{f' pada periode {periode}' if periode else ''}. Surat ini dibuat untuk keperluan "
            f"{keperluan or '-'}."
        )
    if surat_id == "penelitian":
        return (
            f"Dengan ini menerangkan bahwa {nama} dengan NIM {nim_or_nip} sedang melaksanakan penelitian "
            f"berjudul \"{form_data.get('judul') or '-'}\" di {instansi or '-'}"
            f"{f' pada periode {periode}' if periode else ''}."
        )
    return f"Dengan ini menerangkan bahwa {nama} dengan NIM/NIP {nim_or_nip} tercatat di Institut Pertanian Bogor."


def generate_academic_letter_pdf(user, surat_type: dict, form_data: dict, output_dir: str = "uploads") -> dict:
    """Generate a simple academic letter PDF with fpdf2 and return public file metadata."""
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    filename = f"surat_akademik_{getattr(user, 'id', 'user')}_{uuid4().hex}.pdf"
    output_path = Path(output_dir) / filename
    now = datetime.now()
    surat_label = surat_type.get("label") or "Surat Akademik"
    nomor_surat = f"{surat_type.get('id', 'SK').upper()}/IPB/{now.year}/{str(uuid4().int)[-4:]}"

    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, _pdf_text("INSTITUT PERTANIAN BOGOR"), ln=True, align="C")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, _pdf_text("Jl. Raya Dramaga, Kampus IPB Dramaga, Bogor 16680"), ln=True, align="C")
    pdf.line(10, 28, 200, 28)

    pdf.ln(8)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, _pdf_text(surat_label.upper()), ln=True, align="C")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, _pdf_text(f"Nomor: {nomor_surat}"), ln=True, align="C")

    pdf.ln(10)
    pdf.set_font("Helvetica", "", 11)
    _full_multi_cell(pdf, f"Nama: {getattr(user, 'nama', '-')}")
    _full_multi_cell(pdf, f"NIM/NIP: {getattr(user, 'nim_or_nip', '-') or '-'}")
    _full_multi_cell(pdf, f"Email: {getattr(user, 'email', '-') or '-'}")

    pdf.ln(8)
    _full_multi_cell(pdf, _build_letter_body(user, surat_type, form_data))
    if form_data.get("catatan"):
        pdf.ln(4)
        _full_multi_cell(pdf, f"Catatan tambahan: {form_data.get('catatan')}")

    pdf.ln(6)
    _full_multi_cell(pdf, "Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.")

    pdf.ln(15)
    _right_cell(pdf, f"Bogor, {now.strftime('%d-%m-%Y')}")
    _right_cell(pdf, "Direktur Kemahasiswaan IPB")
    pdf.ln(18)
    pdf.set_font("Helvetica", "B", 11)
    _right_cell(pdf, "Dr. Ahmad Fauzi, S.Kom., M.T.")
    pdf.set_font("Helvetica", "", 10)
    _right_cell(pdf, "NIP. 197805142005011002")

    pdf.output(str(output_path))
    return {
        "filename": filename,
        "url": f"/files/{filename}",
    }


def generate_academic_letter_pdf_from_ticket(ticket, output_dir: str = "uploads") -> dict:
    """Generate the approved academic letter PDF for a resolved ticket."""
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    now = datetime.now()
    ticket_form = ticket.form_data or {}
    fields = ticket_form.get("fields") or {}
    student = ticket.student
    surat_type = {
        "id": ticket_form.get("surat_type") or "akademik",
        "label": ticket_form.get("surat_label") or ticket.title or "Surat Akademik",
    }
    ticket_number = f"#TKT-2026-{ticket.id:04d}"
    filename = f"surat_akademik_ticket_{ticket.id}_{uuid4().hex}.pdf"
    output_path = Path(output_dir) / filename

    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, _pdf_text("INSTITUT PERTANIAN BOGOR"), ln=True, align="C")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, _pdf_text("Jl. Raya Dramaga, Kampus IPB Dramaga, Bogor 16680"), ln=True, align="C")
    pdf.line(10, 28, 200, 28)

    pdf.ln(8)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, _pdf_text("SURAT KETERANGAN AKADEMIK"), ln=True, align="C")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, _pdf_text(f"Nomor Tiket: {ticket_number}"), ln=True, align="C")

    pdf.ln(10)
    pdf.set_font("Helvetica", "", 11)
    _full_multi_cell(pdf, f"Nama Mahasiswa: {getattr(student, 'nama', '-')}")
    _full_multi_cell(pdf, f"NIM/NIP: {getattr(student, 'nim_or_nip', '-') or '-'}")
    _full_multi_cell(pdf, f"Email: {getattr(student, 'email', '-') or '-'}")
    _full_multi_cell(pdf, f"Jenis Surat: {surat_type['label']}")

    pdf.ln(6)
    pdf.set_font("Helvetica", "B", 11)
    _full_multi_cell(pdf, "Data Permohonan:")
    pdf.set_font("Helvetica", "", 10)
    if fields:
        for key, value in fields.items():
            label = str(key).replace("_", " ").title()
            _full_multi_cell(pdf, f"- {label}: {value or '-'}", height=6)
    else:
        _full_multi_cell(pdf, "- Tidak ada data tambahan.", height=6)

    pdf.ln(6)
    pdf.set_font("Helvetica", "", 11)
    _full_multi_cell(pdf, _build_letter_body(student, surat_type, fields))
    pdf.ln(6)
    _full_multi_cell(pdf, "Dokumen ini diterbitkan setelah permohonan diverifikasi dan disetujui oleh staff layanan akademik.")

    pdf.ln(15)
    _right_cell(pdf, f"Bogor, {now.strftime('%d-%m-%Y')}")
    _right_cell(pdf, "Staff Layanan Akademik")
    pdf.ln(18)
    pdf.set_font("Helvetica", "B", 11)
    _right_cell(pdf, "[Tanda Tangan / Approval Staff]")
    pdf.set_font("Helvetica", "", 10)
    _right_cell(pdf, "Disetujui melalui IPB Academic Help Center")

    pdf.output(str(output_path))
    return {
        "filename": filename,
        "url": f"/files/{filename}",
    }
