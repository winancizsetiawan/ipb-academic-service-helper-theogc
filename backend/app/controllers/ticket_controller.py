from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from app.database.session import get_db
from app.api.deps import get_current_user, require_roles
from app.models.enums import TicketStatus, UserRole
from app.models.ticket import Ticket
from app.models.user import User
from app.models.attachment import Attachment
from app.models.ticket_note import TicketNote
from app.models.notification import Notification
from app.schemas.ticket import TicketCreate, TicketUpdate, TicketBrief, TicketResponse, TicketNoteCreate, TicketNoteResponse
from app.services.email_service import send_email
from app.services.pdf_service import generate_academic_letter_pdf_from_ticket
from app.core.websocket_manager import manager
from typing import List
from datetime import datetime

router = APIRouter(prefix="/tickets", tags=["Tickets"])

async def create_and_push_notification(db: Session, user_id: int, title: str, message: str) -> None:
    """Helper to create an in-app notification in DB and stream it via active WebSocket connections."""
    try:
        new_notif = Notification(user_id=user_id, title=title, message=message, is_read=False)
        db.add(new_notif)
        db.commit()
        db.refresh(new_notif)
        
        await manager.send_personal_message(user_id, {
            "type": "notification",
            "data": {
                "id": new_notif.id,
                "user_id": new_notif.user_id,
                "title": new_notif.title,
                "message": new_notif.message,
                "is_read": new_notif.is_read,
                "created_at": new_notif.created_at.isoformat() if new_notif.created_at else None
            }
        })
    except Exception as e:
        print(f"[NOTIFICATION ERROR] Failed to create/push notification: {str(e)}")


@router.post("", response_model=TicketBrief)
async def create_ticket(
    payload: TicketCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates a new ticket, links any pre-uploaded attachments,
    triggers an in-app notification, and queues a confirmation email.
    """
    try:
        attachments = []
        normalized_title = payload.title.strip().lower()
        duplicate_ticket = db.query(Ticket).filter(
            Ticket.student_id == current_user.id,
            Ticket.status.in_([TicketStatus.open, TicketStatus.progress]),
            func.lower(Ticket.title).ilike(f"%{normalized_title}%"),
        ).first()

        if duplicate_ticket:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Anda sudah membuat permohonan dengan judul serupa. Mohon tunggu proses selesai."
            )

        requested_attachment_ids = set(payload.attachment_ids or [])
        if requested_attachment_ids:
            attachments = db.query(Attachment).filter(
                Attachment.id.in_(requested_attachment_ids),
                Attachment.ticket_id.is_(None),
                or_(
                    Attachment.uploaded_by_id == current_user.id,
                    Attachment.uploaded_by_id.is_(None),
                ),
            ).all()
            if len(attachments) != len(requested_attachment_ids):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Satu atau lebih lampiran tidak valid, sudah digunakan, atau bukan milik pengguna saat ini."
                )

        new_ticket = Ticket(
            title=payload.title,
            description=payload.description,
            category_id=payload.category_id,
            priority=payload.priority,
            deadline=payload.deadline,
            form_data=payload.form_data,
            student_id=current_user.id
        )
        db.add(new_ticket)
        db.flush()
        
        # Link pre-uploaded attachments
        for attachment in attachments:
            attachment.ticket_id = new_ticket.id

        db.commit()
        db.refresh(new_ticket)

        # Trigger Notification & Email
        ticket_number = f"#TKT-2026-{new_ticket.id:04d}"
        created_date_str = new_ticket.created_at.strftime("%d %b %Y, %H:%M") if new_ticket.created_at else datetime.now().strftime("%d %b %Y, %H:%M")
        category_name = new_ticket.category.nama_kategori if new_ticket.category else "Akademik"

        # 1. DB & WebSocket Notification
        notif_title = f"Tiket {ticket_number} berhasil dibuat"
        notif_msg = f"Permohonan '{new_ticket.title}' telah kami terima dan masuk dalam antrean pelayanan akademik."
        background_tasks.add_task(create_and_push_notification, db, current_user.id, notif_title, notif_msg)

        # 2. SMTP Transactional Email
        email_subject = "Ticket Successfully Created"
        email_content = f"""Halo {current_user.nama},

Permohonan layanan akademik Anda telah berhasil dibuat!

Detail Tiket:
- Nomor Tiket: {ticket_number}
- Judul: {new_ticket.title}
- Kategori: {category_name}
- Status: {new_ticket.status.value}
- Tanggal Dibuat: {created_date_str}

Anda akan menerima notifikasi lebih lanjut ketika staff memperbarui status tiket Anda.

Terima kasih,
IPB Academic Help Center
"""
        background_tasks.add_task(send_email, current_user.email, email_subject, email_content)

        return new_ticket
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Gagal membuat tiket: {str(e)}")


@router.get("/my", response_model=List[TicketBrief])
def get_my_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        tickets = db.query(Ticket).filter(Ticket.student_id == current_user.id).options(
            joinedload(Ticket.student),
            joinedload(Ticket.category)
        ).all()
        return tickets
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/all", response_model=List[TicketBrief])
def get_all_tickets(
    _: User = Depends(require_roles(UserRole.staff, UserRole.admin)),
    db: Session = Depends(get_db),
):
    try:
        tickets = db.query(Ticket).options(
            joinedload(Ticket.student),
            joinedload(Ticket.category)
        ).all()
        return tickets
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket_detail(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).options(
            joinedload(Ticket.student),
            joinedload(Ticket.staff),
            joinedload(Ticket.category),
            joinedload(Ticket.attachments),
            joinedload(Ticket.notes).joinedload(TicketNote.author)
        ).first()
        
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        if current_user.role == UserRole.mahasiswa and ticket.student_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this ticket")

        return TicketResponse(
            id=ticket.id,
            title=ticket.title,
            description=ticket.description,
            status=ticket.status,
            priority=ticket.priority,
            category_id=ticket.category_id,
            student_id=ticket.student_id,
            student_name=ticket.student.nama if ticket.student else None,
            staff_id=ticket.staff_id,
            staff_name=ticket.staff.nama if ticket.staff else None,
            deadline=ticket.deadline,
            form_data=ticket.form_data,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
            attachments=ticket.attachments,
            notes=ticket.notes
        )
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.patch("/{ticket_id}/status", response_model=TicketBrief)
async def update_ticket_status(
    ticket_id: int,
    payload: TicketUpdate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_roles(UserRole.staff, UserRole.admin)),
    db: Session = Depends(get_db),
):
    """
    Updates the ticket status, links any staff-uploaded attachments (such as resolved document),
    creates an in-app notification, and triggers a status email to the student.
    """
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).options(
            joinedload(Ticket.student),
            joinedload(Ticket.attachments)
        ).first()
        
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        old_status = ticket.status
        
        if payload.status:
            ticket.status = payload.status
        if payload.staff_id:
            ticket.staff_id = payload.staff_id
        if payload.priority:
            ticket.priority = payload.priority
        if payload.deadline:
            ticket.deadline = payload.deadline
        if payload.form_data:
            ticket.form_data = payload.form_data

        # Automatically assign staff if ticket state moves out of open
        if not ticket.staff_id and payload.status and payload.status != TicketStatus.open:
            ticket.staff_id = current_user.id

        # Link staff attachments (e.g., resolved document PDF)
        if payload.attachment_ids:
            requested_attachment_ids = set(payload.attachment_ids)
            attachments = db.query(Attachment).filter(
                Attachment.id.in_(requested_attachment_ids),
                Attachment.ticket_id.is_(None),
                or_(
                    Attachment.uploaded_by_id == current_user.id,
                    Attachment.uploaded_by_id.is_(None),
                ),
            ).all()
            if len(attachments) != len(requested_attachment_ids):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Satu atau lebih lampiran tidak valid, sudah digunakan, atau bukan milik pengguna saat ini."
                )
            for attachment in attachments:
                attachment.ticket_id = ticket.id

        generated_letter = None
        is_academic_letter = (ticket.form_data or {}).get("request_type") == "academic_letter"
        should_generate_letter = (
            payload.status == TicketStatus.resolved
            and is_academic_letter
        )
        if should_generate_letter:
            generated_prefix = f"surat_akademik_ticket_{ticket.id}_"
            has_generated_letter = any(
                (attachment.filepath or "").startswith(generated_prefix)
                for attachment in (ticket.attachments or [])
            )
            if not has_generated_letter:
                generated_letter = generate_academic_letter_pdf_from_ticket(ticket, output_dir="uploads")
                db.add(Attachment(
                    ticket_id=ticket.id,
                    uploaded_by_id=current_user.id,
                    filename=generated_letter["filename"],
                    filepath=generated_letter["filename"],
                ))

        db.commit()
        db.refresh(ticket)

        # Trigger Notifications & Email if status changed
        if payload.status and old_status != payload.status:
            ticket_number = f"#TKT-2026-{ticket.id:04d}"
            
            # 1. DB & WebSocket Notification
            if is_academic_letter and payload.status == TicketStatus.resolved:
                notif_title = f"Surat akademik {ticket_number} siap diunduh"
                notif_msg = f"Permohonan '{ticket.title}' telah disetujui staff. PDF surat resmi sudah tersedia di detail tiket."
            else:
                notif_title = f"Status tiket {ticket_number} diperbarui"
                notif_msg = f"Status permohonan '{ticket.title}' diubah dari '{old_status.value}' menjadi '{payload.status.value}'."
            background_tasks.add_task(create_and_push_notification, db, ticket.student_id, notif_title, notif_msg)

            # 2. SMTP Transactional Email
            email_subject = "Ticket Status Updated"
            email_content = f"""Halo {ticket.student.nama},

Status permohonan layanan akademik Anda telah diperbarui oleh staff.

Detail Pembaruan:
- Nomor Tiket: {ticket_number}
- Judul: {ticket.title}
- Status Lama: {old_status.value}
- Status Baru: {payload.status.value}
{"- Dokumen PDF: sudah tersedia di detail tiket" if generated_letter else ""}

Silakan cek detail permohonan Anda di dashboard IPB Help Center.

Terima kasih,
IPB Academic Help Center
"""
            background_tasks.add_task(send_email, ticket.student.email, email_subject, email_content)

        return ticket
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Gagal memperbarui tiket: {str(e)}")


@router.post("/{ticket_id}/notes", response_model=TicketNoteResponse)
async def create_ticket_note(
    ticket_id: int,
    payload: TicketNoteCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Adds a new note (discussion/comment) to a ticket.
    If the author is a staff member or admin, triggers an in-app notification and email to the student.
    """
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).options(
            joinedload(Ticket.student)
        ).first()
        
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        # Authorization: Students can only add notes to their own tickets
        if current_user.role == UserRole.mahasiswa and ticket.student_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to post notes on this ticket")

        new_note = TicketNote(
            ticket_id=ticket.id,
            author_id=current_user.id,
            content=payload.content
        )
        db.add(new_note)
        db.commit()
        db.refresh(new_note)

        # Trigger notifications if a staff member/admin responds
        is_staff_response = current_user.role in [UserRole.staff, UserRole.admin]
        if is_staff_response:
            ticket_number = f"#TKT-2026-{ticket.id:04d}"
            
            # 1. DB & WebSocket Notification
            notif_title = f"Balasan baru untuk tiket {ticket_number}"
            notif_msg = f"{current_user.nama} membalas permohonan '{ticket.title}': \"{payload.content[:60]}...\""
            background_tasks.add_task(create_and_push_notification, db, ticket.student_id, notif_title, notif_msg)

            # 2. SMTP Transactional Email
            email_subject = "New Response on Your Ticket"
            email_content = f"""Halo {ticket.student.nama},

Ada tanggapan/pesan baru dari staff ({current_user.nama}) untuk permohonan Anda.

Detail Tanggapan:
- Nomor Tiket: {ticket_number}
- Judul: {ticket.title}
- Pesan:
{payload.content}

Silakan masuk ke sistem untuk membalas atau membaca tanggapan lengkapnya.

Terima kasih,
IPB Academic Help Center
"""
            background_tasks.add_task(send_email, ticket.student.email, email_subject, email_content)

        return new_note
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")

        if current_user.role == UserRole.mahasiswa and ticket.student_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this ticket")

        db.delete(ticket)
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
