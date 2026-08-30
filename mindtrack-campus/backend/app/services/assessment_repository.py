import uuid
from typing import Optional, Union

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.assessment import AssessmentResponse, AssessmentResult
from app.services.gad7_service import Gad7ScoringResult
from app.services.phq9_service import Phq9ScoringResult

ScoringResult = Union[Phq9ScoringResult, Gad7ScoringResult]


def create_assessment_submission(
    db: Session,
    user_id: uuid.UUID,
    assessment_code: str,
    responses: list[int],
    scoring: ScoringResult,
) -> AssessmentResult:
    """Generic across instruments — assessment_code distinguishes
    phq9/gad7 rows. GAD-7's scoring result has no explicit self-harm
    flag, so `escalated` here is whatever the instrument-specific
    scoring service already decided (see gad7_service/phq9_service)."""
    response_row = AssessmentResponse(
        user_id=user_id, assessment_code=assessment_code, item_scores=responses
    )
    db.add(response_row)
    db.flush()

    result_row = AssessmentResult(
        response_id=response_row.id,
        user_id=user_id,
        assessment_code=assessment_code,
        total_score=scoring.total_score,
        severity_band=scoring.severity.value,
        escalated=scoring.escalated,
    )
    db.add(result_row)
    db.commit()
    db.refresh(result_row)
    return result_row


def get_assessment_history_for_user(
    db: Session, user_id: uuid.UUID, assessment_code: str
) -> list[AssessmentResult]:
    stmt = (
        select(AssessmentResult)
        .where(
            AssessmentResult.user_id == user_id,
            AssessmentResult.assessment_code == assessment_code,
        )
        .order_by(AssessmentResult.created_at.desc())
    )
    return list(db.execute(stmt).scalars().all())


def get_assessment_result_for_user(
    db: Session, user_id: uuid.UUID, result_id: uuid.UUID
) -> AssessmentResult:
    """Instrument-agnostic by design — ownership is checked purely by
    user_id, regardless of whether the result is phq9 or gad7. Returns
    404 (not 403) on mismatch, same reasoning as Phase 10."""
    result: Optional[AssessmentResult] = db.get(AssessmentResult, result_id)
    if result is None or result.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Result not found")
    return result