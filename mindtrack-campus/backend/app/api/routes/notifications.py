from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.profile import Profile
from app.schemas.notification import NotificationResponse
from app.security.rbac import require_authenticated_user
from app.services.notification_repository import list_notifications_for_user, mark_notification_read

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationResponse])
def list_notifications(
    unread_only: bool = False,
    profile: Profile = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return list_notifications_for_user(db, profile.id, unread_only=unread_only)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def read_notification(
    notification_id: UUID,
    profile: Profile = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return mark_notification_read(db, notification_id, profile.id)