import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.deps import require_roles
from app.core.config import get_settings
from app.models.enums import UserRole
from app.models.user import User
from app.services.pdf_service import generate_academic_letter_pdf

logger = logging.getLogger(__name__)
_settings = get_settings()

router = APIRouter(prefix="/letters", tags=["Letters"])


class LetterGenerateRequest(BaseModel):
    surat_type: str = Field(min_length=1)
    surat_label: str = Field(min_length=1)
    form_data: Dict[str, Any] = Field(default_factory=dict)


class LetterGenerateResponse(BaseModel):
    filename: str
    url: str


@router.post("/generate", response_model=LetterGenerateResponse)
def generate_letter(
    payload: LetterGenerateRequest,
    current_user: User = Depends(require_roles(UserRole.staff, UserRole.admin)),
):
    try:
        return generate_academic_letter_pdf(
            user=current_user,
            surat_type={
                "id": payload.surat_type,
                "label": payload.surat_label,
            },
            form_data=payload.form_data,
            output_dir=_settings.UPLOAD_DIR,
        )
    except Exception as exc:
        logger.error("PDF generation failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal membuat PDF surat.",
        )
