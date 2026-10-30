import os
import pytest

# ── MUST be set before any app module is imported ─────────────────────────────
# This disables rate limiting in the test environment so that fixture logins
# (multiple requests from the same 'testclient' IP) don't trip the 5/min limit.
os.environ.setdefault("TESTING", "true")

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
import app.models as _models  # Ensure all models are registered with Base.metadata
from app.seed import seed_database

TEST_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "test_studyhub.db"))
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """
    Session-level fixture that ensures an isolated test database with fresh schema
    and seed data is established before any tests run.
    """
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except OSError:
            pass

    # Create all tables in isolated test database
    Base.metadata.create_all(bind=test_engine)

    # Seed the test database with standard academic demo users and courses
    db = TestingSessionLocal()
    try:
        seed_database(custom_db=db)
    finally:
        db.close()

    # Override get_db dependency in FastAPI app
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db

    yield

    # Teardown
    app.dependency_overrides.clear()
    test_engine.dispose()
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except OSError:
            pass


@pytest.fixture(scope="session")
def client(setup_test_database):
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def admin_token(client):
    res = client.post("/api/v1/auth/login", json={"email": "admin@studyhub.edu", "password": "Admin@123"})
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    return res.json()["access_token"]


@pytest.fixture(scope="session")
def instructor_token(client):
    res = client.post("/api/v1/auth/login", json={"email": "instructor@studyhub.edu", "password": "Instructor@123"})
    assert res.status_code == 200, f"Instructor login failed: {res.text}"
    return res.json()["access_token"]


@pytest.fixture(scope="session")
def student_token(client):
    res = client.post("/api/v1/auth/login", json={"email": "student@studyhub.edu", "password": "Student@123"})
    assert res.status_code == 200, f"Student login failed: {res.text}"
    return res.json()["access_token"]


@pytest.fixture(scope="session")
def student2_token(client):
    res = client.post("/api/v1/auth/login", json={"email": "student2@studyhub.edu", "password": "Student@123"})
    assert res.status_code == 200, f"Student2 login failed: {res.text}"
    return res.json()["access_token"]
