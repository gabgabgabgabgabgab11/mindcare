from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

MIN_CONTENT_LENGTH = 1
MAX_CONTENT_LENGTH = 5000  # generous for reflective writing, bounded against abuse


class JournalDecoration(BaseModel):
    id: str = Field(min_length=1, max_length=64)
    kind: Literal["sticker", "photo", "washi"]
    value: str = Field(min_length=1, max_length=1_100_000)
    position: int | None = Field(default=None, ge=0, le=MAX_CONTENT_LENGTH)

    @model_validator(mode="after")
    def validate_value(self):
        if self.kind == "photo" and not self.value.startswith(("data:image/jpeg;base64,", "data:image/webp;base64,", "data:image/gif;base64,")):
            raise ValueError("Journal images must be compressed JPEG, WebP, or GIF data")
        if self.kind != "photo" and len(self.value) > 32:
            raise ValueError("Sticker labels are too long")
        return self


class JournalCreateRequest(BaseModel):
    content: str = Field(..., min_length=MIN_CONTENT_LENGTH, max_length=MAX_CONTENT_LENGTH)
    title: str | None = Field(default=None, max_length=120)
    folder_id: UUID | None = None
    decorations: list[JournalDecoration] = Field(default_factory=list, max_length=10)

    @field_validator("content")
    @classmethod
    def content_must_not_be_only_whitespace(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Journal content cannot be empty or only whitespace")
        return v

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None

    @model_validator(mode="after")
    def limit_photo_count(self):
        if sum(element.kind == "photo" for element in self.decorations) > 3:
            raise ValueError("A journal page can include up to three photos")
        return self

class JournalUpdateRequest(JournalCreateRequest):
    is_archived: bool = False


class JournalResponse(BaseModel):
    id: UUID
    content: str  # decrypted before being placed into this schema
    created_at: datetime
    updated_at: datetime
    title: str | None = None
    folder_id: UUID | None = None
    is_archived: bool = False
    decorations: list[JournalDecoration] = Field(default_factory=list)


class JournalListItem(BaseModel):
    id: UUID
    content: str
    created_at: datetime
    updated_at: datetime
    title: str | None = None
    folder_id: UUID | None = None
    is_archived: bool = False
    decoration_count: int = 0


class JournalFolderCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    cover_color: Literal["sage", "rose", "lavender", "sky", "amber"] = "sage"
    cover_image: str | None = Field(default=None, max_length=1_100_000)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Folder name cannot be empty")
        return value.strip()

    @field_validator("cover_image")
    @classmethod
    def validate_cover_image(cls, value: str | None) -> str | None:
        if value is not None and not value.startswith("data:image/jpeg;base64,"):
            raise ValueError("Notebook covers must be compressed JPEG images")
        return value


class JournalFolderUpdateRequest(JournalFolderCreateRequest):
    pass


class JournalFolderResponse(BaseModel):
    id: UUID
    name: str
    cover_color: str
    cover_image: str | None = None
    created_at: datetime


class JournalArchiveUpdateRequest(BaseModel):
    is_archived: bool

class JournalAnalysisResponse(BaseModel):
    sentiment_label: str
    is_uncertain: bool
    analyzed_at: datetime
    disclaimer: str = (
        "This is an automated, non-clinical sentiment trend indicator "
        "derived from your journal entry. It is not a diagnosis and "
        "does not reflect professional clinical judgment."
    )
