from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.models.profile import Profile
from app.schemas.assessment import (
    Phq9HistoryItem,
    Phq9QuestionsResponse,
    Phq9ResultResponse,
    Phq9SubmitRequest,
)
from app.security.rbac import require_student
from app.services.assessment_repository import (
    create_phq9_submission,
    get_phq9_history_for_user,
    get_phq9_result_for_user,
)
from app.services.phq9_service import (
    PHQ9_ITEMS,
    RESPONSE_SCALE,
    InvalidPhq9ResponsesError,
    score_phq9,
)

router = APIRouter(prefix="/api/v1/assessments/phq9", tags=["assessments"])


@router.get("", response_model=Phq9QuestionsResponse)
def get_phq9_questions():
    """Public-shape data (no PII) but still requires login at the
    frontend level, since it's only relevant inside the app."""
    return Phq9QuestionsResponse(scale=RESPONSE_SCALE, items=PHQ9_ITEMS)


@router.post("", response_model=Phq9ResultResponse, status_code=status.HTTP_201_CREATED)
def submit_phq9(
    payload: Phq9SubmitRequest,
    profile: Profile = Depends(require_student),
    db: Session = Depends(get_db),
):
    try:
        scoring = score_phq9(payload.responses)
    except InvalidPhq9ResponsesError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    result = create_phq9_submission(db, profile.id, payload.responses, scoring)
    return Phq9ResultResponse.model_validate(result)


@router.get("/history", response_model=list[Phq9HistoryItem])
def get_phq9_history(
    profile: Profile = Depends(require_student),
    db: Session = Depends(get_db),
):
    results = get_phq9_history_for_user(db, profile.id)
    return [Phq9HistoryItem.model_validate(r) for r in results]


@router.get("/{result_id}", response_model=Phq9ResultResponse)
def get_phq9_result(
    result_id: UUID,
    profile: Profile = Depends(require_student),
    db: Session = Depends(get_db),
):
    result = get_phq9_result_for_user(db, profile.id, result_id)
    return Phq9ResultResponse.model_validate(result)