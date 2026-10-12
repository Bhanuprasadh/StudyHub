from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.api.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Retrieve notifications for the current user."""
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at,
        }
        for n in notifs
    ]


@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}


@router.put("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications for current user as read."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read.is_(False)
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read"}
