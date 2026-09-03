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
    create_assessment_submission,
    get_assessment_history_for_user,
    get_assessment_result_for_user,
)
from app.services.phq9_service import (
    PHQ9_ITEMS,
    RESPONSE_SCALE,
    InvalidPhq9ResponsesError,
    score_phq9,
)
from app.services.qualitative_feedback import get_phq9_feedback

router = APIRouter(prefix="/api/v1/assessments/phq9", tags=["assessments"])


def _to_result_response(result) -> Phq9ResultResponse:
    return Phq9ResultResponse(
        id=result.id,
        severity_band=result.severity_band,
        qualitative_feedback=get_phq9_feedback(result.severity_band),
        escalated=result.escalated,
        created_at=result.created_at,
    )


def _to_history_item(result) -> Phq9HistoryItem:
    return Phq9HistoryItem(
        id=result.id,
        severity_band=result.severity_band,
        qualitative_feedback=get_phq9_feedback(result.severity_band),
        escalated=result.escalated,
        created_at=result.created_at,
    )


@router.get("", response_model=Phq9QuestionsResponse)
def get_phq9_questions():
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

    result = create_assessment_submission(db, profile.id, "phq9", payload.responses, scoring)
    return _to_result_response(result)


@router.get("/history", response_model=list[Phq9HistoryItem])
def get_phq9_history(
    profile: Profile = Depends(require_student),
    db: Session = Depends(get_db),
):
    results = get_assessment_history_for_user(db, profile.id, "phq9")
    return [_to_history_item(r) for r in results]


@router.get("/{result_id}", response_model=Phq9ResultResponse)
def get_phq9_result(
    result_id: UUID,
    profile: Profile = Depends(require_student),
    db: Session = Depends(get_db),
):
    result = get_assessment_result_for_user(db, profile.id, result_id)
    return _to_result_response(result)