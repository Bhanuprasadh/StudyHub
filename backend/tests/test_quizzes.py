import pytest


def test_quiz_answers_confidentiality(client, student_token):
    """
    CRITICAL SECURITY TEST:
    Verify that GET /quizzes/{quiz_id} for student attempt NEVER exposes 'is_correct' field
    in the question options before or during quiz taking.
    """
    res = client.get(
        "/api/v1/quizzes/1",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 200
    quiz_data = res.json()
    assert len(quiz_data["questions"]) > 0

    for question in quiz_data["questions"]:
        assert len(question["options"]) > 0
        for option in question["options"]:
            assert "is_correct" not in option, "CRITICAL: is_correct leaked to student in quiz taking API!"


def test_quiz_submission_and_server_side_grading(client, student_token, instructor_token):
    # Fetch quiz with admin/instructor view to know the correct options
    manage_res = client.get(
        "/api/v1/quizzes/1/manage",
        headers={"Authorization": f"Bearer {instructor_token}"}
    )
    assert manage_res.status_code == 200
    quiz_full = manage_res.json()

    # Build answers: answer all correctly
    answers = []
    for q in quiz_full["questions"]:
        correct_opt = next((opt for opt in q["options"] if opt["is_correct"]), None)
        assert correct_opt is not None
        answers.append({
            "question_id": q["id"],
            "selected_option_id": correct_opt["id"]
        })

    # Submit as student
    submit_res = client.post(
        "/api/v1/quizzes/1/submit",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"answers": answers}
    )
    assert submit_res.status_code == 200
    result = submit_res.json()
    assert result["score"] == 100.0
    assert result["passed"] is True
    assert len(result["breakdown"]) == len(quiz_full["questions"])
