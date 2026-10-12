from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User, UserRole
from app.models.course import Course
from app.models.discussion import DiscussionThread, DiscussionReply
from app.schemas.discussion import ThreadCreate, ThreadResponse, ReplyCreate, ReplyResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/discussions", tags=["Discussions"])


@router.get("/courses/{course_id}", response_model=List[ThreadResponse])
def get_course_threads(
    course_id: int,
    db: Session = Depends(get_db)
):
    """List discussion threads for a course with author and replies."""
    threads = (
        db.query(DiscussionThread)
        .filter(DiscussionThread.course_id == course_id)
        .order_by(DiscussionThread.created_at.desc())
        .all()
    )
    return threads


@router.post("/courses/{course_id}", response_model=ThreadResponse, status_code=status.HTTP_201_CREATED)
def create_thread(
    course_id: int,
    thread_in: ThreadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new course discussion thread."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    thread = DiscussionThread(
        course_id=course_id,
        user_id=current_user.id,
        title=thread_in.title.strip(),
        content=thread_in.content.strip(),
    )
    db.add(thread)
    db.commit()
    db.refresh(thread)
    return thread


@router.get("/threads/{thread_id}", response_model=ThreadResponse)
def get_thread(
    thread_id: int,
    db: Session = Depends(get_db)
):
    """Get single discussion thread with its replies."""
    thread = db.query(DiscussionThread).filter(DiscussionThread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Discussion thread not found")
    return thread


@router.post("/threads/{thread_id}/replies", response_model=ReplyResponse, status_code=status.HTTP_201_CREATED)
def reply_to_thread(
    thread_id: int,
    reply_in: ReplyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a reply to a discussion thread."""
    thread = db.query(DiscussionThread).filter(DiscussionThread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Discussion thread not found")

    reply = DiscussionReply(
        thread_id=thread_id,
        user_id=current_user.id,
        content=reply_in.content.strip(),
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)
    return reply


@router.delete("/threads/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_thread(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a thread. Allowed for thread author, course instructor, or admin."""
    thread = db.query(DiscussionThread).filter(DiscussionThread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    course_instructor_id = thread.course.instructor_id
    is_authorized = (
        current_user.role == UserRole.ADMIN.value
        or current_user.id == thread.user_id
        or current_user.id == course_instructor_id
    )
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized to delete this thread")

    db.delete(thread)
    db.commit()
    return None


@router.delete("/replies/{reply_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reply(
    reply_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a reply. Allowed for reply author, course instructor, or admin."""
    reply = db.query(DiscussionReply).filter(DiscussionReply.id == reply_id).first()
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")

    course_instructor_id = reply.thread.course.instructor_id
    is_authorized = (
        current_user.role == UserRole.ADMIN.value
        or current_user.id == reply.user_id
        or current_user.id == course_instructor_id
    )
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized to delete this reply")

    db.delete(reply)
    db.commit()
    return None
