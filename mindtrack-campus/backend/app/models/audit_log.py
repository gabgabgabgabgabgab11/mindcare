import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.db.session import Base

EVENT_TYPES = (
    "login",
    "failed_authentication",
    "assessment_submission",
    "journal_created",
    "journal_deleted",
    "privacy_setting_changed",
    "admin_action",
    "mantra_wall_moderation",
)


class AuditLog(Base):
    """NEVER store journal content, passwords, or tokens in `description`
    or `event_metadata`. This cannot be enforced at the model level -
    it is a calling-convention requirement for whoever writes log_event()
    calls in Phase 20B. See Basis and References, Phase 20."""

    __tablename__ = "audit_logs"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(String, nullable=False, index=True)
    actor_id = Column(PG_UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True, index=True)
    description = Column(Text, nullable=False)
    event_metadata = Column(Text, nullable=True)  # JSON-encoded string, small structured extras only
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)