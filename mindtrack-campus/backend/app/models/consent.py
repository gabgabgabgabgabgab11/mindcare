import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.db.session import Base


class ConsentRecord(Base):
    """Append-style: a new row per consent action (sign, or a future
    re-consent after a version bump). withdrawn_at marks withdrawal
    without deleting the historical record of what was agreed to and
    when — deleting consent history would itself be a compliance
    problem, unlike journal content (Phase 12), which IS deleted on
    request."""

    __tablename__ = "consent_records"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False, index=True)
    consent_version = Column(String, nullable=False)
    signed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    withdrawn_at = Column(DateTime(timezone=True), nullable=True)