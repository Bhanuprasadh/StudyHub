import pytest


def test_student_cannot_access_admin_stats(client, student_token):
    res = client.get(
        "/api/v1/admin/stats",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]


def test_instructor_cannot_access_admin_stats(client, instructor_token):
    res = client.get(
        "/api/v1/admin/stats",
        headers={"Authorization": f"Bearer {instructor_token}"}
    )
    assert res.status_code == 403


def test_admin_can_access_platform_stats(client, admin_token):
    res = client.get(
        "/api/v1/admin/stats",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    stats = res.json()
    assert stats["total_users"] >= 5
    assert stats["total_courses"] >= 3
    assert stats["total_enrollments"] >= 2


def test_admin_list_and_update_user(client, admin_token):
    users_res = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert users_res.status_code == 200
    users = users_res.json()
    assert len(users) >= 5

    # Update student 2 active state
    update_res = client.put(
        f"/api/v1/admin/users/{users[0]['id']}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"role": users[0]["role"], "is_active": True}
    )
    assert update_res.status_code == 200
    assert update_res.json()["is_active"] is True
