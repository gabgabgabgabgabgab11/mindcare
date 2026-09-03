from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.profile import Profile
from app.schemas.privacy import PrivacySettingsResponse, PrivacySettingsUpdateRequest
from app.security.rbac import require_student
from app.services.privacy_repository import get_or_create_privacy_settings, update_privacy_settings

router = APIRouter(prefix="/api/v1/privacy", tags=["privacy"])


@router.get("/settings", response_model=PrivacySettingsResponse)
def get_privacy_settings(
    profile: Profile = Depends(require_student),
    db: Session = Depends(get_db),
):
    settings = get_or_create_privacy_settings(db, profile.id)
    return PrivacySettingsResponse(
        allow_activity_tracking=settings.allow_activity_tracking,
        anonymize_activity=settings.anonymize_activity,
        updated_at=settings.updated_at,
    )


@router.put("/settings", response_model=PrivacySettingsResponse)
def put_privacy_settings(
    payload: PrivacySettingsUpdateRequest,
    profile: Profile = Depends(require_student),
    db: Session = Depends(get_db),
):
    settings = update_privacy_settings(
        db, profile.id, payload.allow_activity_tracking, payload.anonymize_activity
    )
    return PrivacySettingsResponse(
        allow_activity_tracking=settings.allow_activity_tracking,
        anonymize_activity=settings.anonymize_activity,
        updated_at=settings.updated_at,
    )