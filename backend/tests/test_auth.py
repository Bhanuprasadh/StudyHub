import pytest
from app.services.auth import hash_password, verify_password


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "StudyHub API"


def test_password_hashing():
    raw_pwd = "SecurePassword@2026"
    hashed = hash_password(raw_pwd)
    assert hashed != raw_pwd
    assert verify_password(raw_pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_login_valid_credentials(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "student@studyhub.edu",
        "password": "Student@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "student@studyhub.edu"
    assert data["user"]["role"] == "student"


def test_login_invalid_password(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "student@studyhub.edu",
        "password": "IncorrectPassword"
    })
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_login_nonexistent_user(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "nonexistent@studyhub.edu",
        "password": "AnyPassword123"
    })
    assert response.status_code == 401


def test_register_duplicate_email(client):
    response = client.post("/api/v1/auth/register", json={
        "email": "student@studyhub.edu",
        "password": "NewPassword123",
        "full_name": "Duplicate Tester"
    })
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_get_current_user_profile(client, student_token):
    # Without token
    unauth_res = client.get("/api/v1/auth/me")
    assert unauth_res.status_code == 401

    # With valid token
    auth_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert auth_res.status_code == 200
    user_data = auth_res.json()
    assert user_data["email"] == "student@studyhub.edu"
    assert user_data["role"] == "student"
