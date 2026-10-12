import pytest


def test_get_courses_catalog(client):
    res = client.get("/api/v1/courses")
    assert res.status_code == 200
    courses = res.json()
    assert isinstance(courses, list)
    assert len(courses) >= 1
    assert "title" in courses[0]
    assert "slug" in courses[0]


def test_search_courses(client):
    res = client.get("/api/v1/courses?q=FastAPI")
    assert res.status_code == 200
    results = res.json()
    assert len(results) >= 1
    assert "FastAPI" in results[0]["title"]


def test_student_cannot_create_course(client, student_token):
    res = client.post(
        "/api/v1/courses",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "title": "Unauthorized Course Creation",
            "description": "This should fail because students cannot create courses.",
            "level": "beginner",
        }
    )
    assert res.status_code == 403


def test_instructor_can_create_course(client, instructor_token):
    res = client.post(
        "/api/v1/courses",
        headers={"Authorization": f"Bearer {instructor_token}"},
        json={
            "title": "Automated Testing Masterclass",
            "description": "Learn test automation with Pytest and React Testing Library in modern full-stack workflows.",
            "level": "intermediate",
            "status": "published",
        }
    )
    assert res.status_code == 201
    course_data = res.json()
    assert course_data["title"] == "Automated Testing Masterclass"
    assert "slug" in course_data


def test_duplicate_enrollment_prevention(client, student_token):
    # Student 1 is already enrolled in Course 1 from seed script
    res = client.post(
        "/api/v1/enrollments/courses/1",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 400
    assert "already enrolled" in res.json()["detail"]


def test_new_enrollment_and_unenrollment(client, student2_token):
    # Student 2 enrolls in Course 2
    enroll_res = client.post(
        "/api/v1/enrollments/courses/2",
        headers={"Authorization": f"Bearer {student2_token}"}
    )
    assert enroll_res.status_code == 201
    assert enroll_res.json()["message"] == "Enrolled successfully"

    # Now unenroll
    unenroll_res = client.delete(
        "/api/v1/enrollments/courses/2",
        headers={"Authorization": f"Bearer {student2_token}"}
    )
    assert unenroll_res.status_code == 200
    assert unenroll_res.json()["message"] == "Unenrolled successfully"
