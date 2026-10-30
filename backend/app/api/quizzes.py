from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.models.user import User, UserRole
from app.models.course import Course
from app.models.quiz import Quiz, Question, AnswerOption, QuizAttempt, AttemptAnswer
from app.models.enrollment import Enrollment
from app.schemas.quiz import (
    QuizCreate, QuizPublicResponse, QuizInstructorResponse, QuizSubmission, QuizAttemptResponse, AttemptAnswerDetail
)
from app.services.email import send_quiz_result_email
from app.api.deps import get_current_user, require_instructor

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])


@router.post("/courses/{course_id}", response_model=QuizInstructorResponse, status_code=status.HTTP_201_CREATED)
def create_quiz(
    course_id: int,
    quiz_in: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """Create a new quiz with questions and answer options. Owner instructor or admin only."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if current_user.role != UserRole.ADMIN.value and course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to add quizzes to this course")

    quiz = Quiz(
        course_id=course_id,
        lesson_id=quiz_in.lesson_id,
        title=quiz_in.title.strip(),
        description=quiz_in.description,
        time_limit_minutes=quiz_in.time_limit_minutes,
        passing_score=quiz_in.passing_score,
    )
    db.add(quiz)
    db.flush()

    for q_idx, q_data in enumerate(quiz_in.questions or []):
        question = Question(
            quiz_id=quiz.id,
            prompt=q_data.prompt.strip(),
            question_type=q_data.question_type,
            order_index=q_data.order_index or q_idx,
        )
        db.add(question)
        db.flush()

        for opt_data in q_data.options:
            opt = AnswerOption(
                question_id=question.id,
                text=opt_data.text.strip(),
                is_correct=opt_data.is_correct,
            )
            db.add(opt)

    db.commit()
    db.refresh(quiz)
    return quiz


@router.get("/courses/{course_id}")
def get_course_quizzes(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List quizzes for a given course."""
    quizzes = db.query(Quiz).filter(Quiz.course_id == course_id).all()

    if not quizzes:
        return []

    quiz_ids = [q.id for q in quizzes]

    # Bulk: question counts per quiz (eliminates N+1)
    question_counts = (
        db.query(Question.quiz_id, func.count(Question.id).label("cnt"))
        .filter(Question.quiz_id.in_(quiz_ids))
        .group_by(Question.quiz_id)
        .all()
    )
    question_map = {row.quiz_id: row.cnt for row in question_counts}

    # Bulk: latest attempt per quiz for this user (eliminates N+1)
    latest_attempts_subq = (
        db.query(
            QuizAttempt.quiz_id,
            func.max(QuizAttempt.started_at).label("latest_started_at")
        )
        .filter(QuizAttempt.quiz_id.in_(quiz_ids), QuizAttempt.user_id == current_user.id)
        .group_by(QuizAttempt.quiz_id)
        .subquery()
    )
    latest_attempts = (
        db.query(QuizAttempt)
        .join(
            latest_attempts_subq,
            (QuizAttempt.quiz_id == latest_attempts_subq.c.quiz_id) &
            (QuizAttempt.started_at == latest_attempts_subq.c.latest_started_at)
        )
        .filter(QuizAttempt.user_id == current_user.id)
        .all()
    )
    attempts_map = {att.quiz_id: att for att in latest_attempts}

    results = []
    for q in quizzes:
        latest = attempts_map.get(q.id)
        results.append({
            "id": q.id,
            "title": q.title,
            "description": q.description,
            "time_limit_minutes": q.time_limit_minutes,
            "passing_score": q.passing_score,
            "total_questions": question_map.get(q.id, 0),
            "latest_score": latest.score if latest else None,
            "passed": latest.passed if latest else None,
        })
    return results


@router.get("/{quiz_id}", response_model=QuizPublicResponse)
def get_quiz_for_taking(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get quiz questions and answer options for students to attempt.
    CRITICAL SECURITY GUARANTEE: 'is_correct' is strictly omitted from answer options.
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Verify student is enrolled or has instructor permissions
    if current_user.role != UserRole.ADMIN.value and quiz.course.instructor_id != current_user.id:
        enrollment = db.query(Enrollment).filter(
            Enrollment.course_id == quiz.course_id,
            Enrollment.user_id == current_user.id
        ).first()
        if not enrollment:
            raise HTTPException(status_code=403, detail="You must be enrolled to take this quiz")

    # Format without leaking correct answers
    questions_data = []
    for q in quiz.questions:
        options_data = [
            {"id": opt.id, "question_id": opt.question_id, "text": opt.text}
            for opt in q.options
        ]
        questions_data.append({
            "id": q.id,
            "prompt": q.prompt,
            "question_type": q.question_type,
            "order_index": q.order_index,
            "options": options_data,
        })

    return {
        "id": quiz.id,
        "course_id": quiz.course_id,
        "lesson_id": quiz.lesson_id,
        "title": quiz.title,
        "description": quiz.description,
        "time_limit_minutes": quiz.time_limit_minutes,
        "passing_score": quiz.passing_score,
        "total_questions": len(questions_data),
        "questions": questions_data,
        "created_at": quiz.created_at,
    }


@router.get("/{quiz_id}/manage", response_model=QuizInstructorResponse)
def get_quiz_for_instructor(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """Get full quiz details including correct answers for instructors and admins."""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    if current_user.role != UserRole.ADMIN.value and quiz.course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to manage this quiz")

    return quiz


@router.post("/{quiz_id}/submit", response_model=QuizAttemptResponse)
def submit_quiz_attempt(
    quiz_id: int,
    submission: QuizSubmission,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit student answers, validate and grade on server, record attempt, and return results.
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Map user answers
    submitted_map = {ans.question_id: ans.selected_option_id for ans in submission.answers}

    total_questions = len(quiz.questions)
    if total_questions == 0:
        raise HTTPException(status_code=400, detail="Cannot take an empty quiz")

    correct_count = 0
    breakdown = []

    for q in quiz.questions:
        selected_option_id = submitted_map.get(q.id)
        correct_option = next((opt for opt in q.options if opt.is_correct), None)
        correct_option_id = correct_option.id if correct_option else None
        is_correct = (selected_option_id is not None) and (selected_option_id == correct_option_id)
        if is_correct:
            correct_count += 1

        breakdown.append(AttemptAnswerDetail(
            question_id=q.id,
            selected_option_id=selected_option_id,
            correct_option_id=correct_option_id,
            is_correct=is_correct,
        ))

    score = round((correct_count / total_questions) * 100.0, 1)
    passed = score >= quiz.passing_score
    # Fixed: use timezone-aware UTC (not deprecated utcnow)
    now = datetime.now(timezone.utc)

    attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=current_user.id,
        score=score,
        passed=passed,
        started_at=now,
        completed_at=now,
    )
    db.add(attempt)
    db.flush()

    for item in breakdown:
        ans_record = AttemptAnswer(
            attempt_id=attempt.id,
            question_id=item.question_id,
            selected_option_id=item.selected_option_id,
            is_correct=item.is_correct,
        )
        db.add(ans_record)

    db.commit()
    db.refresh(attempt)

    # Dispatch quiz result email notification
    background_tasks.add_task(
        send_quiz_result_email,
        to_email=current_user.email,
        full_name=current_user.full_name,
        quiz_title=quiz.title,
        score=score,
        passed=passed,
        passing_score=quiz.passing_score,
        course_id=quiz.course_id
    )

    return {
        "id": attempt.id,
        "quiz_id": attempt.quiz_id,
        "user_id": attempt.user_id,
        "score": attempt.score,
        "passed": attempt.passed,
        "started_at": attempt.started_at,
        "completed_at": attempt.completed_at,
        "breakdown": breakdown,
    }


@router.get("/{quiz_id}/my-attempts")
def get_user_attempts(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve history of student attempts for this quiz."""
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.quiz_id == quiz_id, QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.started_at.desc())
        .all()
    )
    return attempts
