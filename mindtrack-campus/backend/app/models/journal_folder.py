import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.db.session import Base


class JournalFolder(Base):
    __tablename__ = "journal_folders"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False, index=True)
    name = Column(String(60), nullable=False)
    cover_color = Column(String(20), nullable=False, default="sage", server_default="sage")
    cover_image = Column(Text, nullable=True)  # encrypted at the application layer
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
