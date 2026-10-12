import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.course import Course
from app.models.module import Module
from app.models.lesson import Lesson
from app.models.enrollment import Enrollment
from app.models.progress import LessonProgress
from app.schemas.progress import LessonProgressToggle, LessonProgressResponse, CourseProgressSummary
from app.api.deps import get_current_user

router = APIRouter(prefix="/progress", tags=["Progress"])


@router.post("/lessons/{lesson_id}", response_model=LessonProgressResponse)
def toggle_lesson_progress(
    lesson_id: int,
    progress_in: LessonProgressToggle,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a lesson complete or incomplete for the current student."""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    course_id = lesson.module.course_id

    # Verify user is enrolled
    enrollment = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.user_id == current_user.id
    ).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be enrolled in the course to track progress"
        )

    progress = db.query(LessonProgress).filter(
        LessonProgress.lesson_id == lesson_id,
        LessonProgress.user_id == current_user.id
    ).first()

    now = datetime.datetime.utcnow()
    if not progress:
        progress = LessonProgress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            is_completed=progress_in.is_completed,
            completed_at=now if progress_in.is_completed else None
        )
        db.add(progress)
    else:
        progress.is_completed = progress_in.is_completed
        progress.completed_at = now if progress_in.is_completed else None

    # Check if all lessons are now complete to mark enrollment as completed
    total_lessons = (
        db.query(func.count(Lesson.id))
        .join(Module, Lesson.module_id == Module.id)
        .filter(Module.course_id == course_id)
        .scalar() or 0
    )

    db.flush()  # Flush progress change before querying count

    completed_lessons = (
        db.query(func.count(LessonProgress.id))
        .join(Lesson, LessonProgress.lesson_id == Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .filter(
            Module.course_id == course_id,
            LessonProgress.user_id == current_user.id,
            LessonProgress.is_completed.is_(True)
        )
        .scalar() or 0
    )

    if total_lessons > 0 and completed_lessons >= total_lessons:
        enrollment.status = "completed"
        enrollment.completed_at = now
    else:
        enrollment.status = "active"
        enrollment.completed_at = None

    db.commit()
    db.refresh(progress)
    return progress


@router.get("/courses/{course_id}", response_model=CourseProgressSummary)
def get_course_progress(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve detailed completion status for all lessons in a course."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    total_lessons = (
        db.query(func.count(Lesson.id))
        .join(Module, Lesson.module_id == Module.id)
        .filter(Module.course_id == course_id)
        .scalar() or 0
    )

    completed_records = (
        db.query(LessonProgress.lesson_id)
        .join(Lesson, LessonProgress.lesson_id == Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .filter(
            Module.course_id == course_id,
            LessonProgress.user_id == current_user.id,
            LessonProgress.is_completed.is_(True)
        )
        .all()
    )

    completed_ids = [r[0] for r in completed_records]
    completed_count = len(completed_ids)
    pct = round((completed_count / total_lessons * 100), 1) if total_lessons > 0 else 0.0

    return {
        "course_id": course_id,
        "total_lessons": total_lessons,
        "completed_lessons": completed_count,
        "progress_percentage": pct,
        "completed_lesson_ids": completed_ids,
    }
