from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

MIN_CONTENT_LENGTH = 1
MAX_CONTENT_LENGTH = 5000  # generous for reflective writing, bounded against abuse


class JournalCreateRequest(BaseModel):
    content: str = Field(..., min_length=MIN_CONTENT_LENGTH, max_length=MAX_CONTENT_LENGTH)

    @field_validator("content")
    @classmethod
    def content_must_not_be_only_whitespace(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Journal content cannot be empty or only whitespace")
        return v


class JournalUpdateRequest(JournalCreateRequest):
    pass  # same validation rules as create


class JournalResponse(BaseModel):
    id: UUID
    content: str  # decrypted before being placed into this schema
    created_at: datetime
    updated_at: datetime


class JournalListItem(BaseModel):
    id: UUID
    content: str
    created_at: datetime
    updated_at: datetime