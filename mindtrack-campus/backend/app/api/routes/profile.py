from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.section_catalog import PROGRAM_OPTIONS, get_valid_sections, is_valid_combination
from app.db.session import get_db
from app.models.profile import Profile
from app.schemas.auth import MeResponse
from app.security.rbac import require_authenticated_user
from app.services.audit_log_repository import log_event

router = APIRouter(prefix="/api/v1/profile", tags=["profile"])

VALID_PETS = [
    "dog",
    "cat",
    "capybara",
    "rabbit",
    "frog",
    "otter",
    "red_panda",
    "axolotl",
    "bombardino",
    "cappuccino_assassino",
    "cappucina_ballerina",
    "tralalelo",
    "tungtungtung",
]


@router.get("/section-options")
def get_section_options(
    program: str,
    year_level: int,
    profile: Profile = Depends(require_authenticated_user),
):
    """Returns valid section labels for a given program + year_level pair.
    Used to populate a constrained dropdown in the frontend."""
    sections = get_valid_sections(program, year_level)
    if not sections:
        raise HTTPException(status_code=422, detail="Unrecognized program/year_level combination")
    return {"sections": sections}


class ProfileUpdateRequest(BaseModel):
    program: Optional[str] = None
    year_level: Optional[int] = Field(None, ge=1, le=4)
    section: Optional[str] = None
    companion_pet: Optional[str] = None
    companion_nickname: Optional[str] = Field(None, max_length=20)


@router.put("", response_model=MeResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    profile: Profile = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """Self-service profile update for program, year_level, section, and companion_pet."""
    has_program_only = (
        payload.program is not None
        and payload.year_level is None
        and payload.section is None
    )
    has_academic = payload.program is not None or payload.year_level is not None or payload.section is not None
    if has_program_only:
        if payload.program not in PROGRAM_OPTIONS:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid program '{payload.program}'. Allowed programs: {', '.join(PROGRAM_OPTIONS)}",
            )
        if profile.program != payload.program:
            profile.year_level = None
            profile.section = None
        profile.program = payload.program
    elif has_academic:
        if not (payload.program and payload.year_level and payload.section):
            raise HTTPException(
                status_code=422,
                detail="Program, year level, and section must all be provided together.",
            )
        if not is_valid_combination(payload.program, payload.year_level, payload.section):
            raise HTTPException(
                status_code=422,
                detail="Selected section is not valid for this program and year level.",
            )
        profile.program = payload.program
        profile.year_level = str(payload.year_level)
        profile.section = payload.section

    if payload.companion_pet is not None:
        pet_candidate = payload.companion_pet.strip().lower()
        if pet_candidate == "cappybara":
            pet_candidate = "capybara"
        if pet_candidate not in VALID_PETS:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid companion pet '{payload.companion_pet}'. Allowed pets: {', '.join(VALID_PETS)}",
            )
        profile.companion_pet = pet_candidate

    if payload.companion_nickname is not None:
        nickname = payload.companion_nickname.strip()
        profile.companion_nickname = nickname or None

    db.commit()
    db.refresh(profile)

    # Cosmetic companion pet changes are not logged; only academic changes are audit-logged
    if has_academic:
        log_event(
            db,
            "admin_action" if profile.role == "admin" else "privacy_setting_changed",
            "Profile program/year/section updated",
            actor_id=profile.id,
        )

    return MeResponse(
        id=str(profile.id),
        email=None,
        role=profile.role,
        year_level=profile.year_level,
        program=profile.program,
        section=profile.section,
        companion_pet=profile.companion_pet,
        companion_nickname=profile.companion_nickname,
    )
