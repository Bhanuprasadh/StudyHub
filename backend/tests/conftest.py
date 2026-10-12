import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def admin_token(client):
    res = client.post("/api/v1/auth/login", json={"email": "admin@studyhub.edu", "password": "Admin@123"})
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.fixture(scope="session")
def instructor_token(client):
    res = client.post("/api/v1/auth/login", json={"email": "instructor@studyhub.edu", "password": "Instructor@123"})
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.fixture(scope="session")
def student_token(client):
    res = client.post("/api/v1/auth/login", json={"email": "student@studyhub.edu", "password": "Student@123"})
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.fixture(scope="session")
def student2_token(client):
    res = client.post("/api/v1/auth/login", json={"email": "student2@studyhub.edu", "password": "Student@123"})
    assert res.status_code == 200
    return res.json()["access_token"]
