import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv

load_dotenv()

try:
    from app.database.session import engine, Base
    # import models so their metadata is registered on Base
    from app.models.user import User
    from app.models.category import Category
    from app.models.faq import FAQ
    from app.models.ticket import Ticket
    from app.models.ticket_note import TicketNote
    from app.models.attachment import Attachment
    from app.models.discussion import Discussion, DiscussionReply
    from app.models.notification import Notification

    _ = (User, Category, FAQ, Ticket, TicketNote, Attachment, Discussion, DiscussionReply, Notification)

    print("[PROCESS] Sedang menghapus semua tabel lama di PostgreSQL...")
    Base.metadata.drop_all(bind=engine)
    print("[SUCCESS] Semua tabel dihapus.")

    print("[PROCESS] Membuat semua tabel baru di PostgreSQL...")
    Base.metadata.create_all(bind=engine)
    print("[SUCCESS] Semua tabel dibuat.")
except Exception as e:
    print(f"[ERROR] Gagal mereset database. Error: {e}")