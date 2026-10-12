from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models.user import User
from app.models.course import Course
from app.models.bookmark import Bookmark
from app.api.deps import get_current_user

router = APIRouter(prefix="/bookmarks", tags=["Bookmarks"])


@router.get("")
def get_user_bookmarks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """List courses bookmarked by current user."""
    bookmarks = db.query(Bookmark).filter(Bookmark.user_id == current_user.id).order_by(Bookmark.created_at.desc()).all()
    return [
        {
            "bookmark_id": b.id,
            "created_at": b.created_at,
            "course": {
                "id": b.course.id,
                "title": b.course.title,
                "slug": b.course.slug,
                "short_description": b.course.short_description,
                "thumbnail_url": b.course.thumbnail_url,
                "level": b.course.level,
                "instructor_name": b.course.instructor.full_name if b.course.instructor else "Instructor",
            }
        }
        for b in bookmarks
    ]


@router.post("/courses/{course_id}")
def toggle_bookmark(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggle bookmark on a course."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    bookmark = db.query(Bookmark).filter(
        Bookmark.course_id == course_id,
        Bookmark.user_id == current_user.id
    ).first()

    if bookmark:
        db.delete(bookmark)
        db.commit()
        return {"bookmarked": False, "message": "Bookmark removed"}
    else:
        new_bookmark = Bookmark(course_id=course_id, user_id=current_user.id)
        db.add(new_bookmark)
        db.commit()
        return {"bookmarked": True, "message": "Course bookmarked"}
