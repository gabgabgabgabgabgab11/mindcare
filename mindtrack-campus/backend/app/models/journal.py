import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Text
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
    title = Column(Text, nullable=True)  # encrypted at the application layer
    folder_id = Column(PG_UUID(as_uuid=True), ForeignKey("journal_folders.id", ondelete="SET NULL"), nullable=True, index=True)
    is_archived = Column(Boolean, nullable=False, default=False, server_default="false")
    decorations = Column(Text, nullable=True)  # encrypted JSON: stickers and photo data
    decoration_count = Column(Integer, nullable=False, default=0, server_default="0")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
