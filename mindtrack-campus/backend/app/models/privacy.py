import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.db.session import Base


class PrivacySettings(Base):
    """One row per student. user_id is both the primary key and the
    foreign key — a student has exactly one privacy settings row,
    lazily created on first access (same pattern as Profile)."""

    __tablename__ = "privacy_settings"

    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("profiles.id"), primary_key=True)
    allow_activity_tracking = Column(Boolean, nullable=False, default=True)
    anonymize_activity = Column(Boolean, nullable=False, default=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )