"""Tests for authentication endpoints."""
import pytest


def test_health(client):
    response = client.get("/health")
    assert response.status_code in (200, 503)
    data = response.json()
    assert "status" in data


def test_register_and_login(client):
    payload = {
        "email": "testuser@apps.ipb.ac.id",
        "nama": "Test User",
        "password": "TestPass123",
    }

    # Register
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == payload["email"]
    assert data["nama"] == payload["nama"]

    # Account is unverified — login should fail
    login_res = client.post("/api/v1/auth/login", json={"email": payload["email"], "password": payload["password"]})
    assert login_res.status_code == 403


def test_register_weak_password(client):
    res = client.post(
        "/api/v1/auth/register",
        json={"email": "weak@apps.ipb.ac.id", "nama": "Weak", "password": "nodigits"},
    )
    assert res.status_code == 422


def test_register_duplicate_email(client):
    payload = {"email": "dup@apps.ipb.ac.id", "nama": "A", "password": "Dup123abc"}
    client.post("/api/v1/auth/register", json=payload)
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 400


def test_login_wrong_password(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "notexist@apps.ipb.ac.id", "password": "Wrong123"},
    )
    assert res.status_code == 401


def test_forgot_password_always_succeeds(client):
    """Endpoint must return 200 regardless of whether the email is registered."""
    res = client.post("/api/v1/auth/forgot-password", json={"email": "nobody@apps.ipb.ac.id"})
    assert res.status_code == 200
    assert res.json()["status"] == "success"
