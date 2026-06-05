import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, status
from fastapi.responses import FileResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import get_settings
from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.enums import UserRole
from app.models.user import User
from app.models.attachment import Attachment

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/uploads", tags=["Uploads"])

settings = get_settings()
UPLOAD_DIR = settings.UPLOAD_DIR
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}

# Magic-byte signatures for basic MIME validation (avoids native libmagic dependency)
_MAGIC = {
    b"%PDF": ".pdf",
    b"\x89PNG": ".png",
    b"\xff\xd8\xff": ".jpg",
}

os.makedirs(UPLOAD_DIR, exist_ok=True)


def _check_mime(header: bytes, ext: str) -> bool:
    """Return True when file header bytes are consistent with the declared extension."""
    for magic, expected_ext in _MAGIC.items():
        if header.startswith(magic):
            return ext in (expected_ext, ".jpeg") if expected_ext == ".jpg" else ext == expected_ext
    # JPEG variant not caught above
    if header[:3] == b"\xff\xd8\xff":
        return ext in (".jpg", ".jpeg")
    # Unknown magic — allow only if extension is in the allowed set (best-effort)
    return ext in ALLOWED_EXTENSIONS


@router.post("", status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Uploads a file securely: validates size, extension, and magic bytes;
    generates a UUID-based stored name; creates an Attachment record.
    Returns the attachment id, original filename, and relative download URL.
    """
    original_filename = os.path.basename(file.filename or "")
    _, ext = os.path.splitext(original_filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extension '{ext}' is not allowed. Supported: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # Read entire file into memory for size + MIME checks (max 10 MB is safe)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum size of 10 MB ({file_size / (1024 * 1024):.2f} MB received).",
        )

    header = await file.read(16)
    await file.seek(0)

    if not _check_mime(header, ext):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content does not match its declared extension.",
        )

    unique_filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, unique_filename)

    if not os.path.abspath(filepath).startswith(os.path.abspath(UPLOAD_DIR)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file path detected.",
        )

    try:
        with open(filepath, "wb") as buf:
            while chunk := await file.read(8192):
                buf.write(chunk)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write file: {exc}",
        )

    try:
        new_attachment = Attachment(
            filename=original_filename,
            filepath=unique_filename,
            ticket_id=None,
            uploaded_by_id=current_user.id,
        )
        db.add(new_attachment)
        db.commit()
        db.refresh(new_attachment)
        return {
            "id": new_attachment.id,
            "filename": new_attachment.filename,
            "url": new_attachment.url,
        }
    except SQLAlchemyError:
        db.rollback()
        if os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error saving attachment.",
        )


@router.get("/{filepath:path}", response_class=FileResponse)
def download_file(
    filepath: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Authenticated file download. Students can only access their own attachments;
    staff and admins can access any attachment.
    """
    safe_name = os.path.basename(filepath)
    full_path = os.path.join(UPLOAD_DIR, safe_name)

    if not os.path.abspath(full_path).startswith(os.path.abspath(UPLOAD_DIR)):
        raise HTTPException(status_code=400, detail="Invalid path.")

    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found.")

    # Staff and admins have unrestricted access
    if current_user.role in (UserRole.staff, UserRole.admin):
        attachment = db.query(Attachment).filter(Attachment.filepath == safe_name).first()
        display_name = attachment.filename if attachment else safe_name
        return FileResponse(full_path, filename=display_name)

    # Students: must own the attachment or own the ticket it belongs to
    attachment = db.query(Attachment).filter(Attachment.filepath == safe_name).first()
    if not attachment:
        raise HTTPException(status_code=403, detail="Access denied.")

    is_uploader = attachment.uploaded_by_id == current_user.id
    is_ticket_owner = (
        attachment.ticket_id is not None
        and attachment.ticket is not None
        and attachment.ticket.student_id == current_user.id
    )
    if not (is_uploader or is_ticket_owner):
        raise HTTPException(status_code=403, detail="Access denied.")

    return FileResponse(full_path, filename=attachment.filename)
