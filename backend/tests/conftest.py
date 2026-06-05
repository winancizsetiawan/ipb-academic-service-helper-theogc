"""
Pytest fixtures for the IPB Academic Help Center backend.

Uses an in-process SQLite database so tests run without a live PostgreSQL
instance.  Override DATABASE_URL in CI to use the real engine.
"""
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_ipb.db")
os.environ.setdefault("JWT_SECRET", "test-secret-do-not-use")
os.environ.setdefault("ENABLE_DEMO_SEEDING", "false")

from app.database.session import Base, get_db
from app.main import app

TEST_DB_URL = os.environ["DATABASE_URL"]
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False} if "sqlite" in TEST_DB_URL else {})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("test_ipb.db"):
        os.remove("test_ipb.db")


@pytest.fixture()
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
