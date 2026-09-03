from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.profile import Profile
from app.schemas.wellness import WellnessPriorityResponse
from app.security.rbac import require_student
from app.services.wellness_prioritization import (
    SENTIMENT_TREND_WINDOW,
    compute_wellness_priority,
)
from app.services.wellness_repository import get_latest_snapshot, get_recent_sentiment_labels

router = APIRouter(prefix="/api/v1/wellness", tags=["wellness"])


@router.get("/priority", response_model=WellnessPriorityResponse)
def get_wellness_priority(
    profile: Profile = Depends(require_student),
    db: Session = Depends(get_db),
):
    phq9_snapshot = get_latest_snapshot(db, profile.id, "phq9")
    gad7_snapshot = get_latest_snapshot(db, profile.id, "gad7")
    recent_sentiments = get_recent_sentiment_labels(db, profile.id, SENTIMENT_TREND_WINDOW)

    result = compute_wellness_priority(phq9_snapshot, gad7_snapshot, recent_sentiments)
    return WellnessPriorityResponse(
        priority=result.priority.value,
        contributing_factors=result.contributing_factors,
        rule_version=result.rule_version,
        clinical_validation_status=result.clinical_validation_status,
    )