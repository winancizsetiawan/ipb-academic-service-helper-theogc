import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.database.session import get_db
from app.api.deps import require_roles
from app.models.enums import UserRole
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryResponse
from typing import List

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    try:
        categories = db.query(Category).all()
        return categories
    except SQLAlchemyError as exc:
        logger.error("DB error fetching categories: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Database error fetching categories.")


@router.post("", response_model=CategoryResponse)
def create_category(
    payload: CategoryCreate,
    _=Depends(require_roles(UserRole.admin)),
    db: Session = Depends(get_db)
):
    try:
        new_category = Category(
            nama_kategori=payload.nama_kategori,
            deskripsi=payload.deskripsi,
            icon=payload.icon,
            bg_color=payload.bg_color,
            type=payload.type,
            template=payload.template,
            ttd=payload.ttd
        )
        db.add(new_category)
        db.commit()
        db.refresh(new_category)
        return new_category
    except SQLAlchemyError as exc:
        db.rollback()
        logger.error("DB error creating category: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Database error creating category.")