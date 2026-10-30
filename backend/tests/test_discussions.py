import pytest
from unittest.mock import patch


def test_discussion_reply_and_author_notification(client, student_token, student2_token):
    headers_student = {"Authorization": f"Bearer {student_token}"}
    headers_student2 = {"Authorization": f"Bearer {student2_token}"}

    # 1. Student 1 creates a discussion thread in Course 1
    thread_res = client.post(
        "/api/v1/discussions/courses/1",
        headers=headers_student,
        json={
            "title": "Question on PyTorch 2.x Distributed Training",
            "content": "How do we configure Slurm with torchrun for 4 GPUs per node?"
        }
    )
    assert thread_res.status_code == 201
    thread_data = thread_res.json()
    thread_id = thread_data["id"]

    # 2. Student 2 posts a reply to Student 1's thread, with email dispatch mocked
    with patch("app.api.discussions.send_discussion_reply_email") as mock_email:
        reply_res = client.post(
            f"/api/v1/discussions/threads/{thread_id}/replies",
            headers=headers_student2,
            json={
                "content": "Use `#SBATCH --gres=gpu:4` and `torchrun --nproc_per_node=4 train.py`!"
            }
        )
        assert reply_res.status_code == 201
        assert mock_email.called
        # Verify email was targeted to Student 1's registered email
        call_kwargs = mock_email.call_args.kwargs
        assert call_kwargs["to_email"] == "student@studyhub.edu"
        assert "Question on PyTorch" in call_kwargs["thread_title"]

    # 3. Student 1 checks their notifications
    notif_res = client.get("/api/v1/notifications", headers=headers_student)
    assert notif_res.status_code == 200
    notifs = notif_res.json()
    assert len(notifs) > 0
    latest = notifs[0]
    assert "New reply to" in latest["title"]
