import pytest
from app.services.auth import hash_password, verify_password


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
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
    # Ensure refresh cookie was set
    assert "studyhub_refresh" in response.cookies


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


def test_password_strength_rejection(client):
    weak_passwords = [
        "short",              # too short
        "nouppercase123!",    # missing uppercase
        "NOLOWERCASE123!",    # missing lowercase
        "NoSpecialChar123",   # missing special character
    ]
    for weak_pwd in weak_passwords:
        res = client.post("/api/v1/auth/register", json={
            "email": f"weak_{weak_pwd[:5]}@example.com",
            "password": weak_pwd,
            "full_name": "Weak Password Tester"
        })
        assert res.status_code == 422, f"Expected 422 for weak password '{weak_pwd}', got {res.status_code}"


def test_register_duplicate_email(client):
    response = client.post("/api/v1/auth/register", json={
        "email": "student@studyhub.edu",
        "password": "NewPassword@123",
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


def test_refresh_token_rotation_flow(client):
    # 1. Login to get initial refresh token in cookie
    login_res = client.post("/api/v1/auth/login", json={
        "email": "student2@studyhub.edu",
        "password": "Student@123"
    })
    assert login_res.status_code == 200
    assert "studyhub_refresh" in login_res.cookies
    initial_cookie = login_res.cookies["studyhub_refresh"]

    # 2. Call /auth/refresh with cookie
    refresh_res = client.post("/api/v1/auth/refresh", cookies={"studyhub_refresh": initial_cookie})
    assert refresh_res.status_code == 200
    data = refresh_res.json()
    assert "access_token" in data
    assert "studyhub_refresh" in refresh_res.cookies
    rotated_cookie = refresh_res.cookies["studyhub_refresh"]
    assert rotated_cookie != initial_cookie, "Refresh token must rotate upon renewal"


def test_logout_revokes_refresh_token(client):
    # Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": "instructor@studyhub.edu",
        "password": "Instructor@123"
    })
    assert login_res.status_code == 200
    refresh_cookie = login_res.cookies.get("studyhub_refresh")

    # Logout
    logout_res = client.post("/api/v1/auth/logout", cookies={"studyhub_refresh": refresh_cookie})
    assert logout_res.status_code == 200

    # Attempt to refresh with revoked token -> must fail
    refresh_attempt = client.post("/api/v1/auth/refresh", cookies={"studyhub_refresh": refresh_cookie})
    assert refresh_attempt.status_code == 401
