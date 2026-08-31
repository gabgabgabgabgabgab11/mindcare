import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.db.session import Base


class Journal(Base):
    """content stores ENCRYPTED text (see app/security/encryption.py),
    never plaintext. Deletion is a real DELETE, not a soft-delete —
    journals are the most sensitive artifact in the system and a
    student's withdrawal of an entry should mean it is actually gone."""

    __tablename__ = "journals"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)  # encrypted at the application layer
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )