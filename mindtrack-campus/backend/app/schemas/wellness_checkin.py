from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

MOOD_LABELS = {
    1: "Very Low",
    2: "Low",
    3: "Neutral",
    4: "Good",
    5: "Very Good",
}

MAX_NOTE_LENGTH = 500


class WellnessCheckInCreateRequest(BaseModel):
    mood_score: int = Field(..., ge=1, le=5)
    note: Optional[str] = Field(None, max_length=MAX_NOTE_LENGTH)


class WellnessCheckInResponse(BaseModel):
    id: UUID
    mood_score: int
    mood_label: str
    note: Optional[str] = None
    created_at: datetime
    disclaimer: str = (
        "This is a self-report mood check-in, not a clinical assessment. "
        "It is not a diagnosis and does not reflect professional clinical judgment."
    )