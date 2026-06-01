import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)
from app.core.security import hash_password, verify_password, create_access_token
from app.services.email_service import send_password_reset_email, send_verification_email

router = APIRouter(prefix="/auth", tags=["Authentication"])
RESET_PASSWORD_TOKEN_EXPIRE_HOURS = 1

def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)

@router.post("/register", response_model=UserResponse)
def register(payload: RegisterRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        token = str(uuid.uuid4())
        new_user = User(
            email=payload.email,
            nama=payload.nama,
            hashed_password=hash_password(payload.password),
            role=UserRole.mahasiswa,
            is_verified=False,
            verification_token=token
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        background_tasks.add_task(send_verification_email, new_user.email, new_user.nama, token)
        
        return new_user
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == payload.email).first()
        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account not verified. Please verify your email first."
            )

        access_token = create_access_token(data={"sub": str(user.id)})
        return TokenResponse(
            access_token=access_token,
            id=user.id,
            nama=user.nama,
            email=user.email,
            nim_or_nip=user.nim_or_nip,
            role=user.role.value
        )
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.verification_token == token).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification token"
            )
        
        user.is_verified = True
        user.verification_token = None
        db.commit()
        
        return {"status": "success", "message": "Email verified successfully. You can now login."}
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == payload.email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email tidak terdaftar di dalam sistem kami."
            )

        token = str(uuid.uuid4())
        user.reset_token = token
        user.reset_token_expiry = datetime.now(timezone.utc) + timedelta(hours=RESET_PASSWORD_TOKEN_EXPIRE_HOURS)
        db.commit()

        background_tasks.add_task(send_password_reset_email, user.email, user.nama, token)
        return {
            "status": "success",
            "message": "Tautan reset kata sandi telah dikirim ke email Anda."
        }
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.reset_token == payload.token).first()
        if not user or not user.reset_token_expiry:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token reset kata sandi tidak valid atau sudah kedaluwarsa"
            )

        if _as_utc(user.reset_token_expiry) < datetime.now(timezone.utc):
            user.reset_token = None
            user.reset_token_expiry = None
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token reset kata sandi tidak valid atau sudah kedaluwarsa"
            )

        user.hashed_password = hash_password(payload.password)
        user.reset_token = None
        user.reset_token_expiry = None
        db.commit()

        return {"status": "success", "message": "Kata sandi berhasil diperbarui. Silakan login kembali."}
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
