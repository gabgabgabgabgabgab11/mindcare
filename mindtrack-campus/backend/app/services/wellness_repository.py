import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.assessment import AssessmentResult
from app.models.journal import Journal
from app.models.journal_analysis import JournalAnalysis
from app.services.wellness_prioritization import AssessmentSnapshot


def get_latest_snapshot(db: Session, user_id: uuid.UUID, assessment_code: str) -> Optional[AssessmentSnapshot]:
    stmt = (
        select(AssessmentResult)
        .where(AssessmentResult.user_id == user_id, AssessmentResult.assessment_code == assessment_code)
        .order_by(AssessmentResult.created_at.desc())
        .limit(1)
    )
    result = db.execute(stmt).scalars().first()
    if result is None:
        return None
    return AssessmentSnapshot(severity_band=result.severity_band, escalated=result.escalated)


def get_recent_sentiment_labels(db: Session, user_id: uuid.UUID, limit: int) -> List[str]:
    """Joins through Journal to enforce ownership — JournalAnalysis
    itself has no user_id column (see Phase 13), by design."""
    stmt = (
        select(JournalAnalysis.sentiment_label)
        .join(Journal, JournalAnalysis.journal_id == Journal.id)
        .where(Journal.user_id == user_id)
        .order_by(JournalAnalysis.analyzed_at.desc())
        .limit(limit)
    )
    return [row[0] for row in db.execute(stmt).all()]