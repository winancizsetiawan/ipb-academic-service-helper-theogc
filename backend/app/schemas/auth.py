import re

from pydantic import BaseModel, EmailStr, Field, field_validator
from app.models.enums import UserRole


class RegisterRequest(BaseModel):
    email: EmailStr
    nama: str = Field(min_length=2, max_length=200)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit.")
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1)
    password: str = Field(min_length=8)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    id: int
    nama: str
    email: str
    nim_or_nip: str | None = None
    role: str

class UserResponse(BaseModel):
    id: int
    email: str
    nama: str
    nim_or_nip: str | None = None
    role: UserRole

    class Config:
        from_attributes = True
