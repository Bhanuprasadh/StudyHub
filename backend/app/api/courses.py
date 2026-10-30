import re
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from app.database import get_db
from app.models.user import User, UserRole
from app.models.course import Course
from app.models.module import Module
from app.models.lesson import Lesson
from app.models.enrollment import Enrollment
from app.models.progress import LessonProgress
from app.models.bookmark import Bookmark
from app.schemas.course import CourseCreate, CourseUpdate, CourseSummaryResponse, CourseDetailResponse
from app.api.deps import get_current_user, get_current_user_optional, require_instructor

router = APIRouter(prefix="/courses", tags=["Courses"])


def slugify(text: str) -> str:
    text = re.sub(r"[^\w\s-]", "", text.lower().strip())
    return re.sub(r"[-\s]+", "-", text)


@router.get("", response_model=List[CourseSummaryResponse])
def get_courses(
    q: Optional[str] = None,
    category_id: Optional[int] = None,
    level: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieve catalog of courses with search, filters, and pagination."""
    query = db.query(Course).filter(Course.status == "published")

    if q:
        search_filter = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Course.title.ilike(search_filter),
                Course.description.ilike(search_filter),
                Course.short_description.ilike(search_filter),
            )
        )

    if category_id:
        query = query.filter(Course.category_id == category_id)

    if level:
        query = query.filter(Course.level == level)

    total = query.count()
    offset = (page - 1) * limit
    courses = query.order_by(Course.id.asc()).offset(offset).limit(limit).all()

    if not courses:
        return []

    course_ids = [c.id for c in courses]

    # Bulk aggregation: total lessons per course (eliminates N+1)
    lesson_counts = (
        db.query(Module.course_id, func.count(Lesson.id).label("cnt"))
        .join(Lesson, Lesson.module_id == Module.id)
        .filter(Module.course_id.in_(course_ids))
        .group_by(Module.course_id)
        .all()
    )
    lessons_map = {row.course_id: row.cnt for row in lesson_counts}

    # Bulk aggregation: total enrollments per course (eliminates N+1)
    enroll_counts = (
        db.query(Enrollment.course_id, func.count(Enrollment.id).label("cnt"))
        .filter(Enrollment.course_id.in_(course_ids))
        .group_by(Enrollment.course_id)
        .all()
    )
    enrollments_map = {row.course_id: row.cnt for row in enroll_counts}

    results = []
    for c in courses:
        results.append({
            "id": c.id,
            "title": c.title,
            "slug": c.slug,
            "short_description": c.short_description,
            "instructor_id": c.instructor_id,
            "category_id": c.category_id,
            "level": c.level,
            "status": c.status,
            "thumbnail_url": c.thumbnail_url,
            "created_at": c.created_at,
            "instructor": c.instructor,
            "category": c.category,
            "total_lessons": lessons_map.get(c.id, 0),
            "total_enrollments": enrollments_map.get(c.id, 0),
        })

    return results


@router.post("", response_model=CourseDetailResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    course_in: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """Create a new course (Instructor or Admin)."""
    base_slug = slugify(course_in.slug or course_in.title)
    slug = base_slug
    counter = 1
    while db.query(Course).filter(Course.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    new_course = Course(
        title=course_in.title.strip(),
        slug=slug,
        short_description=course_in.short_description,
        description=course_in.description,
        instructor_id=current_user.id,
        category_id=course_in.category_id,
        level=course_in.level,
        status=course_in.status,
        thumbnail_url=course_in.thumbnail_url,
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course


@router.get("/{course_id_or_slug}", response_model=CourseDetailResponse)
def get_course_detail(
    course_id_or_slug: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Retrieve complete course details including modules, lessons, and enrollment state."""
    if course_id_or_slug.isdigit():
        course = db.query(Course).filter(Course.id == int(course_id_or_slug)).first()
    else:
        course = db.query(Course).filter(Course.slug == course_id_or_slug).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    total_lessons = (
        db.query(func.count(Lesson.id))
        .join(Module, Lesson.module_id == Module.id)
        .filter(Module.course_id == course.id)
        .scalar() or 0
    )
    total_enrollments = db.query(func.count(Enrollment.id)).filter(Enrollment.course_id == course.id).scalar() or 0

    is_enrolled = False
    is_bookmarked = False
    progress_percentage = 0.0

    if current_user:
        enrollment = db.query(Enrollment).filter(
            Enrollment.course_id == course.id,
            Enrollment.user_id == current_user.id
        ).first()
        is_enrolled = enrollment is not None

        bookmark = db.query(Bookmark).filter(
            Bookmark.course_id == course.id,
            Bookmark.user_id == current_user.id
        ).first()
        is_bookmarked = bookmark is not None

        if is_enrolled and total_lessons > 0:
            completed_count = (
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
            progress_percentage = round((completed_count / total_lessons) * 100, 1)

    return {
        "id": course.id,
        "title": course.title,
        "slug": course.slug,
        "short_description": course.short_description,
        "description": course.description,
        "instructor_id": course.instructor_id,
        "category_id": course.category_id,
        "level": course.level,
        "status": course.status,
        "thumbnail_url": course.thumbnail_url,
        "created_at": course.created_at,
        "instructor": course.instructor,
        "category": course.category,
        "modules": course.modules,
        "total_lessons": total_lessons,
        "total_enrollments": total_enrollments,
        "is_enrolled": is_enrolled,
        "is_bookmarked": is_bookmarked,
        "progress_percentage": progress_percentage,
    }


@router.put("/{course_id}", response_model=CourseDetailResponse)
def update_course(
    course_id: int,
    course_in: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """Update course attributes. Owner instructor or admin only."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if current_user.role != UserRole.ADMIN.value and course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this course")

    if course_in.title is not None:
        course.title = course_in.title.strip()
    if course_in.short_description is not None:
        course.short_description = course_in.short_description
    if course_in.description is not None:
        course.description = course_in.description
    if course_in.category_id is not None:
        course.category_id = course_in.category_id
    if course_in.level is not None:
        course.level = course_in.level
    if course_in.status is not None:
        course.status = course_in.status
    if course_in.thumbnail_url is not None:
        course.thumbnail_url = course_in.thumbnail_url

    db.commit()
    db.refresh(course)
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """Delete a course. Owner instructor or admin only."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if current_user.role != UserRole.ADMIN.value and course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this course")

    db.delete(course)
    db.commit()
    return None
