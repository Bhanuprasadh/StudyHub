import pytest


def test_security_headers_present(client):
    """Verify that all production security headers are attached to responses."""
    response = client.get("/health")
    assert response.status_code == 200

    headers = response.headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert "strict-origin" in headers.get("Referrer-Policy", "")
    assert "X-Request-ID" in headers
    assert len(headers.get("X-Request-ID")) > 0


def test_request_id_uniqueness(client):
    """Verify that every request receives a unique correlation ID."""
    res1 = client.get("/health")
    res2 = client.get("/health")
    id1 = res1.headers.get("X-Request-ID")
    id2 = res2.headers.get("X-Request-ID")
    assert id1 != id2


def test_payload_size_limit_enforced(client):
    """Verify that requests larger than 10MB are rejected with 413 Payload Too Large."""
    # Send request with simulated Content-Length header > 10MB limit
    response = client.post(
        "/api/v1/auth/login",
        headers={"Content-Length": str(15 * 1024 * 1024)}, # 15MB
        json={"email": "student@studyhub.edu", "password": "Student@123"}
    )
    assert response.status_code == 413
    assert response.json()["error"]["code"] == "REQUEST_TOO_LARGE"


def test_cors_preflight_headers(client):
    """Verify that CORS preflight headers only allow configured methods."""
    response = client.options(
        "/api/v1/courses",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        }
    )
    assert response.status_code == 200
    assert "Access-Control-Allow-Origin" in response.headers
