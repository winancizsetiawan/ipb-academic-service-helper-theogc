import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import aiosmtplib
from app.core.config import get_settings

logger = logging.getLogger(__name__)

async def send_email(to_email: str, subject: str, content: str) -> None:
    """
    Asynchronously sends an email using SMTP configurations from config.py.
    Falls back to console print mock if SMTP settings are missing.
    """
    settings = get_settings()
    
    if not settings.smtp_host:
        logger.warning("⚠️ SMTP_HOST is not configured. Real email delivery will be skipped. Falling back to local console mock email.")
        # Pretty-print email mock representation for easy visual local testing
        print("\n" + "=" * 60)
        print(f"📧 [MOCK EMAIL SENT]")
        print(f"➡️ TO:      {to_email}")
        print(f"➡️ FROM:    {settings.smtp_from or 'noreply@apps.ipb.ac.id'}")
        print(f"➡️ SUBJECT: {subject}")
        print(f"➡️ CONTENT:")
        print(f"{content}")
        print("=" * 60 + "\n")
        return

    message = MIMEMultipart()
    message["From"] = settings.smtp_from or settings.smtp_user or "noreply@apps.ipb.ac.id"
    message["To"] = to_email
    message["Subject"] = subject
    message.attach(MIMEText(content, "plain"))

    try:
        # Determine port options: standard TLS on 465, STARTTLS on 587
        use_tls = settings.smtp_port == 465
        start_tls = settings.smtp_port == 587
        
        # Credentials
        username = settings.smtp_user
        password = settings.smtp_password
        
        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=username if username else None,
            password=password if password else None,
            use_tls=use_tls,
            start_tls=start_tls,
        )
        logger.info(f"Real email successfully sent via SMTP to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email} via SMTP: {str(e)}")
        # Output mock email to console anyway if SMTP fails during dev, preventing crashes
        print("\n" + "⚠️" * 30)
        print(f"⚠️ [SMTP DELIVERY FAILED: {str(e)}]")
        print(f"⚠️ Falling back to mock console output:")
        print(f"➡️ TO:      {to_email}")
        print(f"➡️ SUBJECT: {subject}")
        print(f"➡️ CONTENT:")
        print(f"{content}")
        print("⚠️" * 30 + "\n")

async def send_verification_email(to_email: str, name: str, token: str) -> None:
    """
    Sends a verification email containing the verification link to the user.
    """
    settings = get_settings()
    verification_url = f"{settings.base_url}/verify-email?token={token}"
    subject = "Verifikasi Email Akun IPB Academic Help Center"
    content = f"""Halo {name},

Terima kasih telah mendaftar di IPB Academic Help Center.
Silakan lakukan verifikasi email Anda dengan menekan tautan di bawah ini:

{verification_url}

Tautan ini diperlukan untuk mengaktifkan akun Anda sebelum dapat masuk ke sistem.

Jika Anda tidak merasa melakukan pendaftaran ini, abaikan email ini.

Salam,
Tim Akademik IPB
"""
    await send_email(to_email, subject, content)

async def send_password_reset_email(to_email: str, name: str, token: str) -> None:
    """
    Sends a password reset email containing a one-time reset link.
    """
    settings = get_settings()
    reset_url = f"{settings.base_url}/reset-password?token={token}"
    subject = "Reset Kata Sandi Akun IPB Academic Help Center"
    content = f"""Halo {name},

Kami menerima permintaan reset kata sandi untuk akun IPB Academic Help Center Anda.
Silakan buat kata sandi baru melalui tautan di bawah ini:

{reset_url}

Tautan ini berlaku selama 1 jam. Jika Anda tidak meminta reset kata sandi, abaikan email ini.

Salam,
Tim Akademik IPB
"""
    await send_email(to_email, subject, content)
