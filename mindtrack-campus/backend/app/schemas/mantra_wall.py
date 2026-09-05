from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

POST_TYPES = ("affirmation", "gratitude", "win")
MODERATION_STATUSES = ("pending", "approved", "rejected", "flagged")
MAX_CONTENT_LENGTH = 300

SEEK_ASSISTANCE_NOTICE = (
    "This board is for positive affirmations, gratitude, and small wins only "
    "- it is not a place to seek help for a difficult moment. If you're "
    "struggling, please see the Resources section or reach out to campus "
    "counseling directly."
)

ANONYMITY_NOTICE = (
    "Your post is shown anonymously to other students (no name, only an "
    "optional nickname you choose). It is NOT anonymous to system "
    "administrators, who can see who posted it for moderation and safety "
    "purposes."
)


class MantraWallPostCreateRequest(BaseModel):
    post_type: str
    content: str = Field(..., min_length=1, max_length=MAX_CONTENT_LENGTH)
    nickname: Optional[str] = Field(None, max_length=50)

    @field_validator("post_type")
    @classmethod
    def post_type_must_be_valid(cls, v: str) -> str:
        if v not in POST_TYPES:
            raise ValueError(f"post_type must be one of {POST_TYPES}")
        return v

    @field_validator("content")
    @classmethod
    def content_must_not_be_only_whitespace(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Content cannot be empty or only whitespace")
        return v


class MantraWallPostResponse(BaseModel):
    """Student-facing response - user_id is deliberately NEVER a field
    here. See MantraWallPost model docstring."""
    id: UUID
    post_type: str
    content: str
    nickname: Optional[str] = None
    moderation_status: str
    created_at: datetime
    anonymity_notice: str = ANONYMITY_NOTICE
    seek_assistance_notice: str = SEEK_ASSISTANCE_NOTICE


class MantraWallReportCreateRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=500)


class MantraWallReportResponse(BaseModel):
    id: UUID
    post_id: UUID
    created_at: datetime


class AdminMantraWallReportItem(BaseModel):
    """Admin-only view - includes reporter_id and post content, since
    admins are explicitly NOT subject to the anonymity guarantee."""
    id: UUID
    post_id: UUID
    reporter_id: UUID
    reason: Optional[str] = None
    created_at: datetime
    post_content: str
    post_moderation_status: str


class MantraWallModerateRequest(BaseModel):
    moderation_status: str

    @field_validator("moderation_status")
    @classmethod
    def status_must_be_valid(cls, v: str) -> str:
        if v not in MODERATION_STATUSES:
            raise ValueError(f"moderation_status must be one of {MODERATION_STATUSES}")
        return v