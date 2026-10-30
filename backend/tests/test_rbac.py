import pytest


def test_student_forbidden_from_admin_routes(client, student_token):
    headers = {"Authorization": f"Bearer {student_token}"}
    endpoints = [
        "/api/v1/admin/stats",
        "/api/v1/admin/users",
        "/api/v1/admin/courses",
    ]
    for ep in endpoints:
        res = client.get(ep, headers=headers)
        assert res.status_code == 403, f"Expected 403 for student at {ep}, got {res.status_code}"


def test_instructor_forbidden_from_admin_routes(client, instructor_token):
    headers = {"Authorization": f"Bearer {instructor_token}"}
    endpoints = [
        "/api/v1/admin/stats",
        "/api/v1/admin/users",
    ]
    for ep in endpoints:
        res = client.get(ep, headers=headers)
        assert res.status_code == 403, f"Expected 403 for instructor at {ep}, got {res.status_code}"


def test_student_forbidden_from_course_creation(client, student_token):
    res = client.post(
        "/api/v1/courses",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "title": "Unauthorized Test Course",
            "description": "Students cannot publish courses.",
            "level": "beginner"
        }
    )
    assert res.status_code == 403


def test_admin_has_full_management_access(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res_stats = client.get("/api/v1/admin/stats", headers=headers)
    assert res_stats.status_code == 200

    res_users = client.get("/api/v1/admin/users", headers=headers)
    assert res_users.status_code == 200
    assert len(res_users.json()) >= 1
