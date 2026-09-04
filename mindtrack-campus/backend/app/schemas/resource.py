from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ResourceCreateRequest(BaseModel):
    category: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=2000)
    url: Optional[str] = Field(None, max_length=500)
    is_active: bool = True


class ResourceUpdateRequest(BaseModel):
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1, max_length=2000)
    url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


class ResourceResponse(BaseModel):
    id: UUID
    category: str
    title: str
    description: str
    url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True