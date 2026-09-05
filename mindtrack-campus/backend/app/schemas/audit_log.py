from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: UUID
    event_type: str
    actor_id: Optional[UUID] = None
    description: str
    event_metadata: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True