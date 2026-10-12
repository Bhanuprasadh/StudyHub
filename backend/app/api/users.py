from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Any, Dict
from app.database import get_db
from app.models.user import User, UserRole
from app.models.course import Course
from app.models.module import Module
from app.models.lesson import Lesson
from app.models.enrollment import Enrollment
from app.models.progress import LessonProgress
from app.models.quiz import QuizAttempt, Quiz
from app.schemas.user import UserResponse, UserUpdate
from app.api.deps import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.put("/me", response_model=UserResponse)
def update_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user profile info."""
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name.strip()
    if user_update.bio is not None:
        current_user.bio = user_update.bio.strip()
    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url.strip()

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/me/dashboard")
def get_student_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Fetch aggregated data for student dashboard."""
    # Enrolled courses with calculated progress
    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == current_user.id)
        .order_by(Enrollment.enrolled_at.desc())
        .all()
    )

    enrolled_courses = []
    total_completed_courses = 0

    for enr in enrollments:
        course = enr.course
        # Total lessons in course
        total_lessons = (
            db.query(func.count(Lesson.id))
            .join(Module, Lesson.module_id == Module.id)
            .filter(Module.course_id == course.id)
            .scalar() or 0
        )

        # Completed lessons by this user in this course
        completed_lessons = (
            db.query(func.count(LessonProgress.id))
            .join(Lesson, LessonProgress.lesson_id == Lesson.id)
            .join(Module, Lesson.module_id == Module.id)
            .filter(
                Module.course_id == course.id,
                LessonProgress.user_id == current_user.id,
                LessonProgress.is_completed.is_(True)
            )
            .scalar() or 0
        )

        progress_pct = round((completed_lessons / total_lessons * 100), 1) if total_lessons > 0 else 0.0
        if progress_pct >= 100.0:
            total_completed_courses += 1

        enrolled_courses.append({
            "course_id": course.id,
            "title": course.title,
            "slug": course.slug,
            "thumbnail_url": course.thumbnail_url,
            "instructor_name": course.instructor.full_name if course.instructor else "Instructor",
            "enrolled_at": enr.enrolled_at,
            "status": enr.status,
            "total_lessons": total_lessons,
            "completed_lessons": completed_lessons,
            "progress_percentage": progress_pct,
        })

    # Recent quiz attempts
    recent_attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.started_at.desc())
        .limit(5)
        .all()
    )

    quiz_stats = []
    for att in recent_attempts:
        quiz = att.quiz
        quiz_stats.append({
            "attempt_id": att.id,
            "quiz_id": quiz.id,
            "quiz_title": quiz.title,
            "course_id": quiz.course_id,
            "score": att.score,
            "passed": att.passed,
            "completed_at": att.completed_at or att.started_at,
        })

    return {
        "user": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "role": current_user.role,
        },
        "stats": {
            "enrolled_count": len(enrollments),
            "completed_courses_count": total_completed_courses,
            "total_quizzes_taken": len(recent_attempts),
        },
        "enrolled_courses": enrolled_courses,
        "recent_quizzes": quiz_stats,
    }


@router.get("/instructor/dashboard")
def get_instructor_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Fetch aggregated data for instructor dashboard."""
    if current_user.role not in [UserRole.INSTRUCTOR.value, UserRole.ADMIN.value]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Instructor access required")

    # Courses created by this instructor
    courses_query = db.query(Course)
    if current_user.role == UserRole.INSTRUCTOR.value:
        courses_query = courses_query.filter(Course.instructor_id == current_user.id)
    courses = courses_query.order_by(Course.created_at.desc()).all()

    course_items = []
    total_students = 0

    for c in courses:
        student_count = db.query(func.count(Enrollment.id)).filter(Enrollment.course_id == c.id).scalar() or 0
        total_students += student_count

        lesson_count = (
            db.query(func.count(Lesson.id))
            .join(Module, Lesson.module_id == Module.id)
            .filter(Module.course_id == c.id)
            .scalar() or 0
        )

        quiz_count = db.query(func.count(Quiz.id)).filter(Quiz.course_id == c.id).scalar() or 0

        course_items.append({
            "id": c.id,
            "title": c.title,
            "slug": c.slug,
            "level": c.level,
            "status": c.status,
            "thumbnail_url": c.thumbnail_url,
            "created_at": c.created_at,
            "total_students": student_count,
            "total_lessons": lesson_count,
            "total_quizzes": quiz_count,
        })

    return {
        "stats": {
            "total_courses": len(courses),
            "total_students_enrolled": total_students,
        },
        "courses": course_items,
    }
