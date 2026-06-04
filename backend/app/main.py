import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv 
load_dotenv() 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from fastapi.staticfiles import StaticFiles
from app.database.session import engine, Base, SessionLocal
from app.models.user import User
from app.models.enums import UserRole
from app.core.security import hash_password
from app.models.faq import FAQ
from app.models.category import Category
from app.models.ticket import Ticket
from app.models.ticket_note import TicketNote
from app.models.attachment import Attachment
from app.models.discussion import Discussion, DiscussionReply
from app.models.notification import Notification
from app.controllers import auth_controller, ticket_controller, faq_controller, category_controller, upload_controller, notification_controller, letter_controller

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[STARTUP] Connecting to the PostgreSQL Database...")
    Base.metadata.create_all(bind=engine)
    print("[STARTUP] Tables created successfully. Server is ready!")

    print("[STARTUP] Seeding demo accounts...")
    print(f"[DEBUG ENV] Email Mahasiswa yang terbaca: {os.getenv('EMAIL_TEST_MAHASISWA')}")
    db = SessionLocal()
    try:
        demo_accounts = [
            {
                "email": os.getenv("EMAIL_TEST_MAHASISWA", "quina@apps.ipb.ac.id"), 
                "nama": "Quina (Mhs)", 
                "nim_or_nip": "G6401231013", 
                "password": "Password123!", 
                "role": UserRole.mahasiswa
            },
            {
                "email": os.getenv("EMAIL_TEST_STAFF", "staff@apps.ipb.ac.id"), 
                "nama": "Budi (Staff)", 
                "nim_or_nip": "NIP198512101987031002", 
                "password": "Password123!", 
                "role": UserRole.staff
            },
            {
                "email": os.getenv("EMAIL_TEST_ADMIN", "admin@apps.ipb.ac.id"), 
                "nama": "Ghanianda W.", 
                "nim_or_nip": "NIP196803101993021001", 
                "password": "Password123!", 
                "role": UserRole.admin
            }
        ]
        for account in demo_accounts:
            existing = db.query(User).filter(User.email == account["email"]).first()
            if not existing:
                new_user = User(
                    email=account["email"],
                    nama=account["nama"],
                    nim_or_nip=account["nim_or_nip"],
                    hashed_password=hash_password(account["password"]),
                    role=account["role"],
                    is_verified=True
                )
                db.add(new_user)
            elif not existing.is_verified:
                existing.is_verified = True
                db.add(existing)

        db.commit()
        print("[STARTUP] Demo accounts seeded successfully.")

        demo_categories = [
            {"nama_kategori": "Transkip & Legalisir", "deskripsi": "Permintaan transkip nilai dan legalisir ijazah", "icon": "📜", "bg_color": "#FFF8DC"},
            {"nama_kategori": "Surat Keterangan", "deskripsi": "Surat keterangan akademik dan status mahasiswa", "icon": "📋", "bg_color": "#E6F2FF"},
            {"nama_kategori": "Beasiswa & KRS", "deskripsi": "Pengurusan berkas beasiswa dan kartu rencana studi", "icon": "🎓", "bg_color": "#F0FFF4"},
            {"nama_kategori": "Legalisir Ijazah", "deskripsi": "Layanan legalisir dokumen ijazah", "icon": "📜", "bg_color": "#FFF5E6"},
            {"nama_kategori": "Lainnya", "deskripsi": "Layanan akademik lainnya", "icon": "📎", "bg_color": "#F5F5F5"},
        ]

        for cat in demo_categories:
            existing = db.query(Category).filter(Category.nama_kategori == cat["nama_kategori"]).first()
            if not existing:
                new_cat = Category(
                    nama_kategori=cat["nama_kategori"],
                    deskripsi=cat["deskripsi"],
                    icon=cat["icon"],
                    bg_color=cat["bg_color"]
                )
                db.add(new_cat)

        db.commit()
        print("[STARTUP] Demo categories seeded successfully.")

        demo_faqs = [
            {"question": "Berapa lama waktu pembuatan surat keterangan?", "answer": "Waktu pembuatan surat keterangan biasanya 1-3 hari kerja tergantung pada jenis surat dan beban kerja staff akademik.", "category_id": 2, "status": "published"},
            {"question": "Apa saja dokumen yang diperlukan untuk transkip?", "answer": "Untuk membuat transkip, Anda hanya perlu menyertakan KTM aktif dan mengisi formulir permohonan. Dokumen lain akan diproses oleh bagian akademik.", "category_id": 1, "status": "published"},
            {"question": "Bagaimana cara mengurus legalisir ijazah?", "answer": "Legalisir ijazah dapat dilakukan dengan datang langsung ke bagian akademik membawa ijazah asli dan fotokopi identitas. Biaya legalisir adalah Rp 10.000 per lembar.", "category_id": 4, "status": "published"},
            {"question": "Apakah ada biaya untuk pembuatan surat keterangan?", "answer": "Surat keterangan statusstudi gratis untuk mahasiswa IPB. Namun, untuk surat keterangan khusus atau lebih dari 5 lembar, ada biaya admin Rp 5.000 per lembar tambahan.", "category_id": 2, "status": "published"},
            {"question": "Bagaimana jika deadline saya mendesak?", "answer": "Anda dapat menandai permohonan sebagai mendesak saat membuat tiket. Tim staff akan mempriorraskan layanan Anda berdasarkan urgensi dan ketersediaan.", "category_id": 5, "status": "published"},
        ]

        for faq in demo_faqs:
            existing = db.query(FAQ).filter(FAQ.question == faq["question"]).first()
            if not existing:
                new_faq = FAQ(
                    question=faq["question"],
                    answer=faq["answer"],
                    category_id=faq.get("category_id"),
                    status=faq["status"]
                )
                db.add(new_faq)

        db.commit()
        print("[STARTUP] Demo FAQs seeded successfully.")

    except Exception as e:
        print(f"[STARTUP] Seeding error: {e}")
        db.rollback()
    finally:
        db.close()

    yield

    print("[SHUTDOWN] Shutting down server...")

app = FastAPI(
    title="IPB Academic Help Center API",
    description="Backend IPB Academic Help Center API",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()
if isinstance(settings.CORS_ORIGINS, str) and settings.CORS_ORIGINS.strip() not in ("", "*"):
    origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
else:
    origins = ["*"]

allow_credentials = False
if origins != ["*"]:
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials = False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/files", StaticFiles(directory=UPLOAD_DIR), name="files")

@app.get("/")
def read_root():
    return {"message": "Backend IPB Academic Help Center Berhasil Menyala!"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected"}

API = "/api/v1"
app.include_router(auth_controller.router,       prefix=API)
app.include_router(faq_controller.router,        prefix=API)
app.include_router(category_controller.router,   prefix=API)
app.include_router(ticket_controller.router,     prefix=API)
app.include_router(upload_controller.router,     prefix=API)
app.include_router(notification_controller.router, prefix=API)
app.include_router(letter_controller.router,     prefix=API)
