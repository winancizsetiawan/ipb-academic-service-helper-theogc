import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.attachment import Attachment

router = APIRouter(prefix="/uploads", tags=["Uploads"])

UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}

# Ensure upload directory exists
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Uploads a file securely: validates size and extension, generates a unique UUID-based name,
    saves it to the uploads folder, and creates an Attachment database record.
    """
    # 1. Validate File Extension
    original_filename = os.path.basename(file.filename)  # TODO(security): sanitize and prevent traversal
    _, ext = os.path.splitext(original_filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extension {ext} is not allowed. Supported: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # 2. Validate File Size
    # Read a portion of file to check size safely or check content_length if present
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)  # Reset pointer

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum size of 10MB (file size: {file_size / (1024*1024):.2f}MB)"
        )

    # 3. Generate Secure Unique Stored Name
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, unique_filename)

    # Double check no directory traversal occurs
    if not os.path.abspath(filepath).startswith(os.path.abspath(UPLOAD_DIR)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid path traversal detected."
        )

    # 4. Physically Write File
    try:
        with open(filepath, "wb") as buffer:
            # Read and write in chunks to be memory efficient and robust
            while chunk := await file.read(8192):
                buffer.write(chunk)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write file to disk: {str(e)}"
        )

    # 5. Create Attachment Record in Database
    try:
        new_attachment = Attachment(
            filename=original_filename,
            filepath=unique_filename,  # Stored unique filename
            ticket_id=None,            # Linked later during ticket submission
            uploaded_by_id=current_user.id
        )
        db.add(new_attachment)
        db.commit()
        db.refresh(new_attachment)
        
        # Return exact dictionary matching frontend requirements
        return {
            "id": new_attachment.id,
            "filename": new_attachment.filename,
            "url": new_attachment.url
        }
    except SQLAlchemyError as e:
        db.rollback()
        # Clean up file from disk if database fails
        if os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error saving attachment: {str(e)}"
        )
