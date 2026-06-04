from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import get_settings
import os

settings = get_settings()

# Build engine with production-safe connect args (enforce SSL for remote Postgres hosts)
DATABASE_URL = settings.DATABASE_URL
connect_args = {}
if DATABASE_URL.startswith(("postgres://", "postgresql://")):
    if "localhost" not in DATABASE_URL and "127.0.0.1" not in DATABASE_URL:
        # Use environment override if provided, otherwise require SSL
        connect_args["sslmode"] = os.environ.get("PGSSLMODE", "require")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args=connect_args if connect_args else {},
)
SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()