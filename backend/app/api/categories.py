from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryResponse
from app.api.deps import require_admin

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    """List all course categories."""
    return db.query(Category).order_by(Category.name.asc()).all()


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """Create a new category (Admin only)."""
    existing = db.query(Category).filter(Category.slug == category_in.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="A category with this slug already exists.")

    new_cat = Category(
        name=category_in.name.strip(),
        slug=category_in.slug.strip().lower(),
        description=category_in.description,
        icon=category_in.icon or "BookOpen",
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat
