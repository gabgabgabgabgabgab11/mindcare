from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.models.profile import Profile
from app.schemas.assessment import (
    Gad7HistoryItem,
    Gad7QuestionsResponse,
    Gad7ResultResponse,
    Gad7SubmitRequest,
)
from app.security.rbac import require_student
from app.services.assessment_repository import (
    create_assessment_submission,
    get_assessment_history_for_user,
    get_assessment_result_for_user,
)
from app.services.gad7_service import (
    GAD7_ITEMS,
    RESPONSE_SCALE,
    InvalidGad7ResponsesError,
    score_gad7,
)

router = APIRouter(prefix="/api/v1/assessments/gad7", tags=["assessments"])


@router.get("", response_model=Gad7QuestionsResponse)
def get_gad7_questions():
    return Gad7QuestionsResponse(scale=RESPONSE_SCALE, items=GAD7_ITEMS)


@router.post("", response_model=Gad7ResultResponse, status_code=status.HTTP_201_CREATED)
def submit_gad7(
    payload: Gad7SubmitRequest,
    profile: Profile = Depends(require_student),
    db: Session = Depends(get_db),
):
    try:
        scoring = score_gad7(payload.responses)
    except InvalidGad7ResponsesError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    result = create_assessment_submission(db, profile.id, "gad7", payload.responses, scoring)
    return Gad7ResultResponse.model_validate(result)


@router.get("/history", response_model=list[Gad7HistoryItem])
def get_gad7_history(
    profile: Profile = Depends(require_student),
    db: Session = Depends(get_db),
):
    results = get_assessment_history_for_user(db, profile.id, "gad7")
    return [Gad7HistoryItem.model_validate(r) for r in results]


@router.get("/{result_id}", response_model=Gad7ResultResponse)
def get_gad7_result(
    result_id: UUID,
    profile: Profile = Depends(require_student),
    db: Session = Depends(get_db),
):
    result = get_assessment_result_for_user(db, profile.id, result_id)
    return Gad7ResultResponse.model_validate(result)