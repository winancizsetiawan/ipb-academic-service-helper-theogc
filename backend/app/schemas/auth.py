from pydantic import BaseModel, EmailStr, Field
from app.models.enums import UserRole

class RegisterRequest(BaseModel):
    email: EmailStr
    nama: str
    password: str

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
