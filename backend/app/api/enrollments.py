from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from app.database import get_db
from app.models.user import User
from app.models.course import Course
from app.models.module import Module
from app.models.lesson import Lesson
from app.models.enrollment import Enrollment
from app.models.progress import LessonProgress
from app.models.notification import Notification
from app.services.email import send_enrollment_email
from app.api.deps import get_current_user

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])


@router.post("/courses/{course_id}", status_code=status.HTTP_201_CREATED)
def enroll_in_course(
    course_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enroll the current user in a course."""
    course = db.query(Course).filter(Course.id == course_id, Course.status == "published").first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or not currently published")

    existing_enrollment = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.user_id == current_user.id
    ).first()
    if existing_enrollment:
        raise HTTPException(status_code=400, detail="You are already enrolled in this course")

    enrollment = Enrollment(
        user_id=current_user.id,
        course_id=course_id,
        status="active"
    )
    db.add(enrollment)

    # Create enrollment notification
    notif = Notification(
        user_id=current_user.id,
        title="Course Enrolled",
        message=f"You successfully enrolled in '{course.title}'. Happy learning!",
    )
    db.add(notif)

    db.commit()
    db.refresh(enrollment)

    # Dispatch enrollment confirmation email
    background_tasks.add_task(
        send_enrollment_email,
        to_email=current_user.email,
        full_name=current_user.full_name,
        course_title=course.title,
        course_id=course.id,
        payment_info=None
    )

    return {
        "message": "Enrolled successfully",
        "enrollment_id": enrollment.id,
        "course_id": course.id,
        "enrolled_at": enrollment.enrolled_at,
    }


@router.get("/me")
def get_my_enrollments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """List all courses enrolled by the current user with progress stats."""
    enrollments = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id
    ).order_by(Enrollment.enrolled_at.desc()).all()

    output = []
    for enr in enrollments:
        course = enr.course
        total_lessons = (
            db.query(func.count(Lesson.id))
            .join(Module, Lesson.module_id == Module.id)
            .filter(Module.course_id == course.id)
            .scalar() or 0
        )
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
        pct = round((completed_lessons / total_lessons * 100), 1) if total_lessons > 0 else 0.0

        output.append({
            "enrollment_id": enr.id,
            "enrolled_at": enr.enrolled_at,
            "status": enr.status,
            "course": {
                "id": course.id,
                "title": course.title,
                "slug": course.slug,
                "short_description": course.short_description,
                "thumbnail_url": course.thumbnail_url,
                "level": course.level,
                "instructor_name": course.instructor.full_name if course.instructor else "Instructor",
            },
            "progress": {
                "total_lessons": total_lessons,
                "completed_lessons": completed_lessons,
                "progress_percentage": pct,
            }
        })
    return output


@router.delete("/courses/{course_id}", status_code=status.HTTP_200_OK)
def unenroll_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Unenroll the current user from a course."""
    enrollment = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.user_id == current_user.id
    ).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    db.delete(enrollment)
    db.commit()
    return {"message": "Unenrolled successfully"}
