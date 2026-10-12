from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.course import Course
from app.models.module import Module
from app.schemas.course import ModuleCreate, ModuleUpdate, ModuleResponse
from app.api.deps import require_instructor

router = APIRouter(prefix="/modules", tags=["Modules"])


@router.post("/courses/{course_id}", response_model=ModuleResponse, status_code=status.HTTP_201_CREATED)
def add_module_to_course(
    course_id: int,
    module_in: ModuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """Add a new module to a course. Instructor must own the course."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if current_user.role != UserRole.ADMIN.value and course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this course")

    new_module = Module(
        course_id=course_id,
        title=module_in.title.strip(),
        description=module_in.description,
        order_index=module_in.order_index,
    )
    db.add(new_module)
    db.commit()
    db.refresh(new_module)
    return new_module


@router.put("/{module_id}", response_model=ModuleResponse)
def update_module(
    module_id: int,
    module_in: ModuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """Update module details."""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    if current_user.role != UserRole.ADMIN.value and module.course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this module")

    if module_in.title is not None:
        module.title = module_in.title.strip()
    if module_in.description is not None:
        module.description = module_in.description
    if module_in.order_index is not None:
        module.order_index = module_in.order_index

    db.commit()
    db.refresh(module)
    return module


@router.delete("/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """Delete a module and its lessons."""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    if current_user.role != UserRole.ADMIN.value and module.course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this module")

    db.delete(module)
    db.commit()
    return None
