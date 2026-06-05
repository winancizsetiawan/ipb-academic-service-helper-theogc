import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.database.session import get_db
from app.api.deps import get_current_user, require_roles
from app.models.enums import FaqStatus, UserRole
from app.models.user import User
from app.models.faq import FAQ
from app.schemas.faq import FaqCreate, FaqUpdate, FaqResponse
from typing import List, Optional

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/faqs", tags=["FAQs"])


@router.get("", response_model=List[FaqResponse])
def get_faqs(
    keyword: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    """Public FAQ listing — returns only published FAQs."""
    try:
        query = db.query(FAQ).filter(FAQ.status == FaqStatus.published)
        if keyword and keyword.strip():
            like_keyword = f"%{keyword.strip()}%"
            query = query.filter(
                or_(
                    FAQ.question.ilike(like_keyword),
                    FAQ.answer.ilike(like_keyword),
                )
            )
        return query.all()
    except SQLAlchemyError as exc:
        logger.error("DB error fetching FAQs: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Database error fetching FAQs.")


@router.get("/all", response_model=List[FaqResponse])
def get_all_faqs(
    keyword: Optional[str] = Query(default=None),
    _: User = Depends(require_roles(UserRole.staff, UserRole.admin)),
    db: Session = Depends(get_db),
):
    """Staff/admin listing — returns FAQs in all statuses."""
    try:
        query = db.query(FAQ)
        if keyword and keyword.strip():
            like_keyword = f"%{keyword.strip()}%"
            query = query.filter(
                or_(
                    FAQ.question.ilike(like_keyword),
                    FAQ.answer.ilike(like_keyword),
                )
            )
        return query.all()
    except SQLAlchemyError as exc:
        logger.error("DB error fetching all FAQs: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Database error fetching FAQs.")


@router.post("", response_model=FaqResponse)
def create_faq(
    payload: FaqCreate,
    _=Depends(require_roles(UserRole.staff, UserRole.admin)),
    db: Session = Depends(get_db),
):
    try:
        new_faq = FAQ(
            question=payload.question,
            answer=payload.answer,
            category_id=payload.category_id,
            status=payload.status,
        )
        db.add(new_faq)
        db.commit()
        db.refresh(new_faq)
        return new_faq
    except SQLAlchemyError as exc:
        db.rollback()
        logger.error("DB error creating FAQ: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Database error creating FAQ.")


@router.put("/{faq_id}", response_model=FaqResponse)
def update_faq(
    faq_id: int,
    payload: FaqUpdate,
    _=Depends(require_roles(UserRole.staff, UserRole.admin)),
    db: Session = Depends(get_db),
):
    try:
        faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
        if not faq:
            raise HTTPException(status_code=404, detail="FAQ not found")

        if payload.question is not None:
            faq.question = payload.question
        if payload.answer is not None:
            faq.answer = payload.answer
        if payload.status is not None:
            faq.status = payload.status
        if payload.category_id is not None:
            faq.category_id = payload.category_id

        db.commit()
        db.refresh(faq)
        return faq
    except SQLAlchemyError as exc:
        db.rollback()
        logger.error("DB error updating FAQ %s: %s", faq_id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Database error updating FAQ.")


@router.delete("/{faq_id}")
def delete_faq(
    faq_id: int,
    _=Depends(require_roles(UserRole.staff, UserRole.admin)),
    db: Session = Depends(get_db),
):
    try:
        faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
        if not faq:
            raise HTTPException(status_code=404, detail="FAQ not found")

        db.delete(faq)
        db.commit()
        return {"detail": "FAQ deleted successfully"}
    except SQLAlchemyError as exc:
        db.rollback()
        logger.error("DB error deleting FAQ %s: %s", faq_id, exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Database error deleting FAQ.")
