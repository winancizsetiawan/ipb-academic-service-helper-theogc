import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import get_settings
from app.core.security import hash_password
from app.database.session import SessionLocal, engine
from app.models.category import Category
from app.models.enums import UserRole
from app.models.faq import FAQ
from app.models.user import User
from app.controllers import (
    auth_controller,
    category_controller,
    faq_controller,
    letter_controller,
    notification_controller,
    ticket_controller,
    upload_controller,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()
UPLOAD_DIR = settings.UPLOAD_DIR

# ---------------------------------------------------------------------------
# Rate limiter (shared instance — individual routes opt-in via @limiter.limit)
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address)


# ---------------------------------------------------------------------------
# Demo data seeding (only when ENABLE_DEMO_SEEDING=true)
# ---------------------------------------------------------------------------
def _seed_demo_data(db) -> None:
    demo_accounts = [
        {
            "email": os.getenv("EMAIL_TEST_MAHASISWA", "quina@apps.ipb.ac.id"),
            "nama": "Quina (Mhs)",
            "nim_or_nip": "G6401231013",
            "password": "Password123!",
            "role": UserRole.mahasiswa,
        },
        {
            "email": os.getenv("EMAIL_TEST_STAFF", "staff@apps.ipb.ac.id"),
            "nama": "Budi (Staff)",
            "nim_or_nip": "NIP198512101987031002",
            "password": "Password123!",
            "role": UserRole.staff,
        },
        {
            "email": os.getenv("EMAIL_TEST_ADMIN", "admin@apps.ipb.ac.id"),
            "nama": "Ghanianda W.",
            "nim_or_nip": "NIP196803101993021001",
            "password": "Password123!",
            "role": UserRole.admin,
        },
    ]
    for account in demo_accounts:
        existing = db.query(User).filter(User.email == account["email"]).first()
        if not existing:
            db.add(
                User(
                    email=account["email"],
                    nama=account["nama"],
                    nim_or_nip=account["nim_or_nip"],
                    hashed_password=hash_password(account["password"]),
                    role=account["role"],
                    is_verified=True,
                )
            )
        elif not existing.is_verified:
            existing.is_verified = True
    db.commit()
    logger.info("[SEED] Demo accounts ready.")

    demo_categories = [
        {"nama_kategori": "Transkip & Legalisir", "deskripsi": "Permintaan transkip nilai dan legalisir ijazah", "icon": "📜", "bg_color": "#FFF8DC"},
        {"nama_kategori": "Surat Keterangan", "deskripsi": "Surat keterangan akademik dan status mahasiswa", "icon": "📋", "bg_color": "#E6F2FF"},
        {"nama_kategori": "Beasiswa & KRS", "deskripsi": "Pengurusan berkas beasiswa dan kartu rencana studi", "icon": "🎓", "bg_color": "#F0FFF4"},
        {"nama_kategori": "Legalisir Ijazah", "deskripsi": "Layanan legalisir dokumen ijazah", "icon": "📜", "bg_color": "#FFF5E6"},
        {"nama_kategori": "Lainnya", "deskripsi": "Layanan akademik lainnya", "icon": "📎", "bg_color": "#F5F5F5"},
    ]
    for cat in demo_categories:
        if not db.query(Category).filter(Category.nama_kategori == cat["nama_kategori"]).first():
            db.add(Category(**cat))
    db.commit()
    logger.info("[SEED] Demo categories ready.")

    demo_faqs = [
        {"question": "Berapa lama waktu pembuatan surat keterangan?", "answer": "Waktu pembuatan surat keterangan biasanya 1-3 hari kerja tergantung pada jenis surat dan beban kerja staff akademik.", "category_id": 2, "status": "published"},
        {"question": "Apa saja dokumen yang diperlukan untuk transkip?", "answer": "Untuk membuat transkip, Anda hanya perlu menyertakan KTM aktif dan mengisi formulir permohonan.", "category_id": 1, "status": "published"},
        {"question": "Bagaimana cara mengurus legalisir ijazah?", "answer": "Legalisir ijazah dapat dilakukan dengan datang langsung ke bagian akademik membawa ijazah asli dan fotokopi identitas.", "category_id": 4, "status": "published"},
        {"question": "Apakah ada biaya untuk pembuatan surat keterangan?", "answer": "Surat keterangan status studi gratis untuk mahasiswa IPB.", "category_id": 2, "status": "published"},
        {"question": "Bagaimana jika deadline saya mendesak?", "answer": "Anda dapat menandai permohonan sebagai mendesak saat membuat tiket.", "category_id": 5, "status": "published"},
    ]
    for faq in demo_faqs:
        if not db.query(FAQ).filter(FAQ.question == faq["question"]).first():
            db.add(FAQ(question=faq["question"], answer=faq["answer"], category_id=faq.get("category_id"), status=faq["status"]))
    db.commit()
    logger.info("[SEED] Demo FAQs ready.")


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("[STARTUP] Server is starting...")
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    if settings.ENABLE_DEMO_SEEDING:
        logger.info("[STARTUP] ENABLE_DEMO_SEEDING=true — seeding demo data.")
        db = SessionLocal()
        try:
            _seed_demo_data(db)
        except Exception as exc:
            logger.error(f"[STARTUP] Demo seeding failed: {exc}", exc_info=True)
            db.rollback()
        finally:
            db.close()

    logger.info("[STARTUP] Server ready.")
    yield
    logger.info("[SHUTDOWN] Server shutting down.")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="IPB Academic Help Center API",
    description="Backend IPB Academic Help Center API",
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ---------------------------------------------------------------------------
# Global exception handlers — never leak raw DB errors to clients
# ---------------------------------------------------------------------------
@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    logger.error("Database error on %s: %s", request.url, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "A database error occurred. Please try again later."},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    from fastapi import HTTPException as FastAPIHTTPException
    from fastapi.exception_handlers import http_exception_handler

    # HTTPException is handled by FastAPI's own handler; delegate to it so that
    # normal 401/403/404 responses are returned as-is.
    if isinstance(exc, FastAPIHTTPException):
        return await http_exception_handler(request, exc)
    logger.error("Unexpected error on %s: %s", request.url, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred."},
    )


# ---------------------------------------------------------------------------
# Security headers middleware
# ---------------------------------------------------------------------------
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    # WebSocket upgrade requests must not be intercepted by HTTP middleware
    if request.scope.get("type") != "http":
        return await call_next(request)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


# ---------------------------------------------------------------------------
# CORS — use the configured CORS_ORIGINS, not a wildcard regex
# ---------------------------------------------------------------------------
_raw_origins = settings.CORS_ORIGINS.strip()
if _raw_origins == "*":
    # Wildcard + credentials is rejected by browsers; only use in local dev
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    _origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
API = "/api/v1"
app.include_router(auth_controller.router, prefix=API)
app.include_router(faq_controller.router, prefix=API)
app.include_router(category_controller.router, prefix=API)
app.include_router(ticket_controller.router, prefix=API)
app.include_router(upload_controller.router, prefix=API)
app.include_router(notification_controller.router, prefix=API)
app.include_router(letter_controller.router, prefix=API)


@app.get("/")
def read_root():
    return {"message": "Backend IPB Academic Help Center Berhasil Menyala!"}


@app.get("/health")
def health_check():
    """Liveness probe — verifies database connectivity."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as exc:
        logger.error("Health check DB probe failed: %s", exc)
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "error"},
        )
