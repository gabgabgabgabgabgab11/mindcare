from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ConsentStatusResponse(BaseModel):
    has_active_consent: bool
    consented_version: Optional[str] = None
    current_version: str
    signed_at: Optional[datetime] = None


class ConsentSignResponse(BaseModel):
    consent_version: str
    signed_at: datetime
    message: str = "Consent recorded. You may withdraw at any time without penalty."


class ConsentWithdrawResponse(BaseModel):
    withdrawn_at: datetime
    message: str = "Consent withdrawn. Access to wellness features requires re-consenting."