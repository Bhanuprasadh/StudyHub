from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.module import Module
from app.models.lesson import Lesson
from app.models.resource import Resource
from app.models.enrollment import Enrollment
from app.schemas.course import LessonCreate, LessonUpdate, LessonResponse, ResourceCreate, ResourceResponse
from app.api.deps import get_current_user, require_instructor

router = APIRouter(prefix="/lessons", tags=["Lessons"])


@router.post("/modules/{module_id}", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
def add_lesson(
    module_id: int,
    lesson_in: LessonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """Add a lesson to a module. Course owner instructor or admin only."""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    if current_user.role != UserRole.ADMIN.value and module.course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this course")

    new_lesson = Lesson(
        module_id=module_id,
        title=lesson_in.title.strip(),
        content_type=lesson_in.content_type,
        content_text=lesson_in.content_text,
        duration_minutes=lesson_in.duration_minutes,
        order_index=lesson_in.order_index,
    )
    db.add(new_lesson)
    db.commit()
    db.refresh(new_lesson)
    return new_lesson


@router.get("/{lesson_id}", response_model=LessonResponse)
def get_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch lesson details. Must be enrolled student, course instructor, or admin."""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    course_id = lesson.module.course_id

    # Check access permission
    if current_user.role != UserRole.ADMIN.value and lesson.module.course.instructor_id != current_user.id:
        is_enrolled = db.query(Enrollment).filter(
            Enrollment.course_id == course_id,
            Enrollment.user_id == current_user.id
        ).first()
        if not is_enrolled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must enroll in this course to view lesson contents"
            )

    return lesson


@router.put("/{lesson_id}", response_model=LessonResponse)
def update_lesson(
    lesson_id: int,
    lesson_in: LessonUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """Update lesson details."""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    if current_user.role != UserRole.ADMIN.value and lesson.module.course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this lesson")

    if lesson_in.title is not None:
        lesson.title = lesson_in.title.strip()
    if lesson_in.content_type is not None:
        lesson.content_type = lesson_in.content_type
    if lesson_in.content_text is not None:
        lesson.content_text = lesson_in.content_text
    if lesson_in.duration_minutes is not None:
        lesson.duration_minutes = lesson_in.duration_minutes
    if lesson_in.order_index is not None:
        lesson.order_index = lesson_in.order_index

    db.commit()
    db.refresh(lesson)
    return lesson


@router.delete("/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """Delete a lesson."""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    if current_user.role != UserRole.ADMIN.value and lesson.module.course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this lesson")

    db.delete(lesson)
    db.commit()
    return None


@router.post("/{lesson_id}/resources", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
def add_lesson_resource(
    lesson_id: int,
    resource_in: ResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """Attach a learning resource (PDF, reference notes, or code link) to a lesson."""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    if current_user.role != UserRole.ADMIN.value and lesson.module.course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this lesson")

    resource = Resource(
        lesson_id=lesson_id,
        title=resource_in.title.strip(),
        resource_type=resource_in.resource_type,
        file_path_or_url=resource_in.file_path_or_url.strip(),
        file_size_bytes=resource_in.file_size_bytes or 0,
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource
