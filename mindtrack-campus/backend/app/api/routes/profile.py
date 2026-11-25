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
    display_name: Optional[str] = Field(None, max_length=50)
    program: Optional[str] = None
    year_level: Optional[int] = Field(None, ge=1, le=4)
    section: Optional[str] = None
    companion_pet: Optional[str] = None
    companion_nickname: Optional[str] = Field(None, max_length=20)
    avatar_image: Optional[str] = Field(None, max_length=1_400_000)
    cover_image: Optional[str] = Field(None, max_length=1_400_000)


@router.put("", response_model=MeResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    profile: Profile = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """Self-service profile update for program, year_level, section, and companion_pet."""
    has_academic = payload.program is not None or payload.year_level is not None or payload.section is not None
    if payload.display_name is not None:
        display_name = payload.display_name.strip()
        if not display_name:
            raise HTTPException(status_code=422, detail="Display name cannot be empty.")
        profile.display_name = display_name
    if has_academic:
        program = payload.program if payload.program is not None else profile.program
        year_level = str(payload.year_level) if payload.year_level is not None else profile.year_level
        if payload.program is not None and payload.program not in PROGRAM_OPTIONS and not (
            payload.section and payload.year_level
            and is_valid_combination(payload.program, payload.year_level, payload.section)
        ):
            raise HTTPException(
                status_code=422,
                detail=f"Invalid program '{payload.program}'. Allowed programs: {', '.join(PROGRAM_OPTIONS)}",
            )
        # Year is useful for aggregate analytics even when no section is assigned.
        # Clear a stale section when either academic grouping changes.
        section = profile.section if (program, year_level) == (profile.program, profile.year_level) else None
        if payload.section is not None and (
            not program or year_level not in ("1", "2", "3", "4")
            or not is_valid_combination(program, int(year_level), payload.section)
        ):
            raise HTTPException(
                status_code=422,
                detail="Selected section is not valid for this program and year level.",
            )
        profile.program = program
        profile.year_level = year_level
        profile.section = payload.section if payload.section is not None else section

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

    if payload.avatar_image is not None:
        profile.avatar_image = payload.avatar_image
    if payload.cover_image is not None:
        profile.cover_image = payload.cover_image

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
        display_name=profile.display_name,
        year_level=profile.year_level,
        program=profile.program,
        section=profile.section,
        companion_pet=profile.companion_pet,
        companion_nickname=profile.companion_nickname,
        avatar_image=profile.avatar_image,
        cover_image=profile.cover_image,
    )
