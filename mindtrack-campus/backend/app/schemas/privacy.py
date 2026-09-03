from datetime import datetime

from pydantic import BaseModel


class PrivacySettingsResponse(BaseModel):
    allow_activity_tracking: bool
    anonymize_activity: bool
    updated_at: datetime
    anonymize_activity_description: str = (
        "Hide your name and dates — only overall wellness scores are shared."
    )


class PrivacySettingsUpdateRequest(BaseModel):
    allow_activity_tracking: bool
    anonymize_activity: bool