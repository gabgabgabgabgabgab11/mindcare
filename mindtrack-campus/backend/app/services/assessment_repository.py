import uuid
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.assessment import AssessmentResponse, AssessmentResult
from app.services.phq9_service import Phq9ScoringResult


def create_phq9_submission(
    db: Session, user_id: uuid.UUID, responses: list[int], scoring: Phq9ScoringResult
) -> AssessmentResult:
    response_row = AssessmentResponse(
        user_id=user_id, assessment_code="phq9", item_scores=responses
    )
    db.add(response_row)
    db.flush()  # assigns response_row.id without committing yet

    result_row = AssessmentResult(
        response_id=response_row.id,
        user_id=user_id,
        assessment_code="phq9",
        total_score=scoring.total_score,
        severity_band=scoring.severity.value,
        escalated=scoring.escalated,
    )
    db.add(result_row)
    db.commit()
    db.refresh(result_row)
    return result_row


def get_phq9_history_for_user(db: Session, user_id: uuid.UUID) -> list[AssessmentResult]:
    stmt = (
        select(AssessmentResult)
        .where(AssessmentResult.user_id == user_id, AssessmentResult.assessment_code == "phq9")
        .order_by(AssessmentResult.created_at.desc())
    )
    return list(db.execute(stmt).scalars().all())


def get_phq9_result_for_user(
    db: Session, user_id: uuid.UUID, result_id: uuid.UUID
) -> AssessmentResult:
    """Returns 404 — not 403 — on a cross-user access attempt, so a
    student cannot learn whether a given result ID belongs to someone
    else simply by trying it."""
    result: Optional[AssessmentResult] = db.get(AssessmentResult, result_id)
    if result is None or result.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Result not found")
    return result