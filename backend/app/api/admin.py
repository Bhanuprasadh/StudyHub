from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import List, Optional
from app.database import get_db
from app.models.user import User, UserRole
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.quiz import Quiz
from app.models.discussion import DiscussionThread
from app.schemas.user import UserResponse
from app.schemas.admin import AdminStats, UserRoleUpdate
from app.api.deps import require_admin

router = APIRouter(prefix="/admin", tags=["Administration"])


@router.get("/stats", response_model=AdminStats)
def get_admin_stats(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """Retrieve platform-wide statistics for administrators."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_students = db.query(func.count(User.id)).filter(User.role == UserRole.STUDENT.value).scalar() or 0
    total_instructors = db.query(func.count(User.id)).filter(User.role == UserRole.INSTRUCTOR.value).scalar() or 0
    total_courses = db.query(func.count(Course.id)).scalar() or 0
    total_enrollments = db.query(func.count(Enrollment.id)).scalar() or 0
    total_quizzes = db.query(func.count(Quiz.id)).scalar() or 0
    total_discussions = db.query(func.count(DiscussionThread.id)).scalar() or 0

    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_instructors": total_instructors,
        "total_courses": total_courses,
        "total_enrollments": total_enrollments,
        "total_quizzes": total_quizzes,
        "total_discussions": total_discussions,
    }


@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    q: Optional[str] = None,
    role: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """List and search all users with role filtering and pagination."""
    query = db.query(User)
    if q:
        search = f"%{q.strip()}%"
        query = query.filter(or_(User.email.ilike(search), User.full_name.ilike(search)))
    if role:
        query = query.filter(User.role == role)

    offset = (page - 1) * limit
    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    return users


@router.put("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int,
    status_in: UserRoleUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """Update user role and active state (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if status_in.role:
        if status_in.role not in [UserRole.STUDENT.value, UserRole.INSTRUCTOR.value, UserRole.ADMIN.value]:
            raise HTTPException(status_code=400, detail="Invalid role specified")
        user.role = status_in.role

    if status_in.is_active is not None:
        user.is_active = status_in.is_active

    db.commit()
    db.refresh(user)
    return user


@router.get("/courses")
def get_all_courses_for_admin(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """List all courses including draft, published, and archived."""
    offset = (page - 1) * limit
    # Eager-load instructor + category to avoid N+1 lazy loads
    courses = (
        db.query(Course)
        .options(joinedload(Course.instructor), joinedload(Course.category))
        .order_by(Course.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    if not courses:
        return []

    course_ids = [c.id for c in courses]

    # Bulk enrollment count per course (eliminates N+1)
    enroll_counts = (
        db.query(Enrollment.course_id, func.count(Enrollment.id).label("cnt"))
        .filter(Enrollment.course_id.in_(course_ids))
        .group_by(Enrollment.course_id)
        .all()
    )
    enroll_map = {row.course_id: row.cnt for row in enroll_counts}

    results = []
    for c in courses:
        results.append({
            "id": c.id,
            "title": c.title,
            "slug": c.slug,
            "instructor_name": c.instructor.full_name if c.instructor else "Unknown",
            "instructor_email": c.instructor.email if c.instructor else "Unknown",
            "category_name": c.category.name if c.category else "Uncategorized",
            "status": c.status,
            "level": c.level,
            "total_students": enroll_map.get(c.id, 0),
            "created_at": c.created_at,
        })
    return results


@router.put("/courses/{course_id}/status")
def update_course_status(
    course_id: int,
    status_val: str = Query(..., pattern="^(draft|published|archived)$"),
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """Moderate a course by updating its publication status."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    course.status = status_val
    db.commit()
    return {"message": f"Course status updated to {status_val}", "course_id": course.id, "status": course.status}
