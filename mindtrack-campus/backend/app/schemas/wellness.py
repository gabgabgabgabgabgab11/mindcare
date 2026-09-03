from typing import List

from pydantic import BaseModel


class WellnessPriorityResponse(BaseModel):
    priority: str
    contributing_factors: List[str]
    rule_version: str
    clinical_validation_status: str