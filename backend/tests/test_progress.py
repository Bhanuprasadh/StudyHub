import pytest


def test_student_progress_tracking(client, student_token):
    # Check initial progress for Course 1
    prog_res = client.get(
        "/api/v1/progress/courses/1",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert prog_res.status_code == 200
    data = prog_res.json()
    assert "total_lessons" in data
    assert "completed_lessons" in data
    assert "progress_percentage" in data

    # Toggle Lesson 3 to completed
    toggle_res = client.post(
        "/api/v1/progress/lessons/3",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"is_completed": True}
    )
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_completed"] is True

    # Verify that updated progress percentage increased
    updated_prog = client.get(
        "/api/v1/progress/courses/1",
        headers={"Authorization": f"Bearer {student_token}"}
    ).json()
    assert 3 in updated_prog["completed_lesson_ids"]
