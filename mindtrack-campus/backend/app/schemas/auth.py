from typing import Optional

from pydantic import BaseModel


class MeResponse(BaseModel):
    id: str
    email: Optional[str]
    role: str
    year_level: Optional[str]
    program: Optional[str]
    section: Optional[str]
    companion_pet: Optional[str] = None
    companion_nickname: Optional[str] = None

    class Config:
        from_attributes = True
