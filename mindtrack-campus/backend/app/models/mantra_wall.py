import uuid
from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.db.session import Base


class MantraWallPost(Base):
    """Positive-only post per ADR-007 (redesigned from the original
    open Freedom Wall spec). Anonymous to other students - user_id is
    stored but never returned in a student-facing response. Not
    anonymous to system administrators (see Basis and References,
    Phase 18)."""

    __tablename__ = "mantra_wall_posts"
    __table_args__ = (
        CheckConstraint("post_type IN ('affirmation', 'gratitude', 'win')", name="ck_mantra_wall_post_type"),
        CheckConstraint(
            "moderation_status IN ('pending', 'approved', 'rejected', 'flagged')",
            name="ck_mantra_wall_moderation_status",
        ),
    )

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False, index=True)
    post_type = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    nickname = Column(String, nullable=True)
    moderation_status = Column(String, nullable=False, default="pending", index=True)
    moderated_by = Column(PG_UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True)
    moderated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class MantraWallReport(Base):
    """A student flagging a post for admin review. Reporter identity
    is stored (never anonymous to admins) so reports can't be spammed
    without accountability, but is never exposed to other students."""

    __tablename__ = "mantra_wall_reports"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(PG_UUID(as_uuid=True), ForeignKey("mantra_wall_posts.id"), nullable=False, index=True)
    reporter_id = Column(PG_UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)