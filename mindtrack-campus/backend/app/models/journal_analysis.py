import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.db.session import Base


class JournalAnalysis(Base):
    """Stores ONLY derived sentiment metadata. Deliberately has no
    content/text column of any kind — raw journal text must never be
    persisted here, per the project's journal/NLP architecture."""

    __tablename__ = "journal_analysis"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    journal_id = Column(PG_UUID(as_uuid=True), ForeignKey("journals.id"), nullable=False, unique=True, index=True)
    sentiment_label = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    model_version = Column(String, nullable=False)
    analyzed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)