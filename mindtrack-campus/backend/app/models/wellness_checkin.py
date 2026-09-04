import uuid
from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, SmallInteger, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.db.session import Base


class WellnessCheckIn(Base):
    """A student's self-reported mood, 1-5, with an optional encrypted
    note. Deliberately not fed into wellness_prioritization (Phase 14)
    in this phase - see Basis and References, Phase 16."""

    __tablename__ = "wellness_checkins"
    __table_args__ = (
        CheckConstraint("mood_score >= 1 AND mood_score <= 5", name="ck_wellness_checkins_mood_score"),
    )

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False, index=True)
    mood_score = Column(SmallInteger, nullable=False)
    note = Column(Text, nullable=True)  # encrypted at the application layer, same as Journal.content
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)