from datetime import datetime
from typing import List
from uuid import UUID

from pydantic import BaseModel, Field


class Phq9QuestionsResponse(BaseModel):
    assessment_code: str = "phq9"
    instructions: str = "Over the last 2 weeks, how often have you been bothered by any of the following problems?"
    scale: dict[int, str]
    items: List[str]


class Phq9SubmitRequest(BaseModel):
    responses: List[int] = Field(..., min_length=9, max_length=9)


class Phq9ResultResponse(BaseModel):
    id: UUID
    total_score: int
    severity_band: str
    escalated: bool
    created_at: datetime
    disclaimer: str = (
        "This result reflects a standardized wellness screening only. "
        "It is not a diagnosis. If you are in crisis or need immediate "
        "support, please see the Resources section or contact OSS."
    )

    class Config:
        from_attributes = True


class Phq9HistoryItem(BaseModel):
    id: UUID
    total_score: int
    severity_band: str
    escalated: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Gad7QuestionsResponse(BaseModel):
    assessment_code: str = "gad7"
    instructions: str = "Over the last 2 weeks, how often have you been bothered by the following problems?"
    scale: dict[int, str]
    items: List[str]


class Gad7SubmitRequest(BaseModel):
    responses: List[int] = Field(..., min_length=7, max_length=7)


class Gad7ResultResponse(BaseModel):
    id: UUID
    total_score: int
    severity_band: str
    escalated: bool
    created_at: datetime
    disclaimer: str = (
        "This result reflects a standardized wellness screening only. "
        "It is not a diagnosis. If you are in crisis or need immediate "
        "support, please see the Resources section or contact OSS."
    )

    class Config:
        from_attributes = True


class Gad7HistoryItem(BaseModel):
    id: UUID
    total_score: int
    severity_band: str
    escalated: bool
    created_at: datetime

    class Config:
        from_attributes = True        