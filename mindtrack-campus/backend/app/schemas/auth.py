from typing import Optional

from pydantic import BaseModel


class MeResponse(BaseModel):
    id: str
    email: Optional[str]
    role: str
    year_level: Optional[str]
    program: Optional[str]

    class Config:
        from_attributes = True