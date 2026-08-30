import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.db.session import Base


class AssessmentResponse(Base):
    """Raw item-level answers for one assessment submission.
    item_scores is a JSON array of ints, in item order — validated
    against the instrument's shape in the scoring service, never
    trusted as pre-scored input from the client."""

    __tablename__ = "assessment_responses"
    __table_args__ = (
        CheckConstraint("assessment_code IN ('phq9', 'gad7')", name="ck_assessment_code"),
    )

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False, index=True)
    assessment_code = Column(String, nullable=False)
    item_scores = Column(JSON, nullable=False)
    submitted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class AssessmentResult(Base):
    """Computed score derived from one AssessmentResponse. Kept as a
    separate table so raw responses and computed results can evolve
    independently (e.g., re-scoring logic without re-collecting data)."""

    __tablename__ = "assessment_results"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    response_id = Column(PG_UUID(as_uuid=True), ForeignKey("assessment_responses.id"), nullable=False, unique=True)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False, index=True)
    assessment_code = Column(String, nullable=False)
    total_score = Column(Integer, nullable=False)
    severity_band = Column(String, nullable=False)
    escalated = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)