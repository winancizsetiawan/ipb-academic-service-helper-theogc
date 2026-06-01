from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.database.session import get_db
from app.api.deps import require_roles
from app.models.enums import UserRole
from app.models.faq import FAQ
from app.schemas.faq import FaqCreate, FaqUpdate, FaqResponse
from typing import List

router = APIRouter(prefix="/faqs", tags=["FAQs"])

@router.get("", response_model=List[FaqResponse])
def get_faqs(keyword: str | None = Query(default=None), db: Session = Depends(get_db)):
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
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.post("", response_model=FaqResponse)
def create_faq(
    payload: FaqCreate,
    _=Depends(require_roles(UserRole.staff, UserRole.admin)),
    db: Session = Depends(get_db)
):
    try:
        new_faq = FAQ(
            question=payload.question,
            answer=payload.answer,
            category_id=payload.category_id,
            status=payload.status
        )
        db.add(new_faq)
        db.commit()
        db.refresh(new_faq)
        return new_faq
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.put("/{faq_id}", response_model=FaqResponse)
def update_faq(
    faq_id: int,
    payload: FaqUpdate,
    _=Depends(require_roles(UserRole.staff, UserRole.admin)),
    db: Session = Depends(get_db)
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
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/{faq_id}")
def delete_faq(
    faq_id: int,
    _=Depends(require_roles(UserRole.staff, UserRole.admin)),
    db: Session = Depends(get_db)
):
    try:
        faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
        if not faq:
            raise HTTPException(status_code=404, detail="FAQ not found")
        
        db.delete(faq)
        db.commit()
        return {"detail": "FAQ deleted successfully"}
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
