from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.profile import Profile
from app.schemas.wellness_checkin import WellnessCheckInCreateRequest, WellnessCheckInResponse
from app.security.consent_gate import require_consent
from app.services.wellness_checkin_repository import (
    create_checkin,
    list_checkins_for_user,
    to_response_dict,
)

router = APIRouter(prefix="/api/v1/wellness/checkins", tags=["wellness-checkins"])


@router.post("", response_model=WellnessCheckInResponse, status_code=status.HTTP_201_CREATED)
def submit_checkin(
    payload: WellnessCheckInCreateRequest,
    profile: Profile = Depends(require_consent),
    db: Session = Depends(get_db),
):
    checkin = create_checkin(db, profile.id, payload.mood_score, payload.note)
    return WellnessCheckInResponse(**to_response_dict(checkin))


@router.get("", response_model=list[WellnessCheckInResponse])
def get_checkin_history(
    profile: Profile = Depends(require_consent),
    db: Session = Depends(get_db),
):
    checkins = list_checkins_for_user(db, profile.id)
    return [WellnessCheckInResponse(**to_response_dict(c)) for c in checkins]