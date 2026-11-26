from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.middleware.rate_limit import limiter
from app.models.profile import Profile
from app.schemas.auth import MeResponse
from app.security.rbac import require_admin
from app.security.supabase_auth import SupabaseUser, get_current_supabase_user
from app.services.profile_service import get_or_create_profile

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def account_rate_limit_key(request: Request) -> str:
    # Dependencies verify identity before SlowAPI invokes this route wrapper.
    # Students sharing campus Wi-Fi must not consume one shared login quota.
    user_id = getattr(request.state, "verified_auth_user_id", None)
    return f"account:{user_id}" if user_id else f"ip:{request.client.host if request.client else 'unknown'}"


@router.get("/me", response_model=MeResponse)
@limiter.limit("30/minute", key_func=account_rate_limit_key)
def read_current_user(
    request: Request,
    supabase_user: SupabaseUser = Depends(get_current_supabase_user),
    db: Session = Depends(get_db),
):
    """Returns the authenticated user's safe profile information.
    Rate-limited to 30 requests/minute per verified account — generous enough for
    normal frontend polling, tight enough to blunt a retry-loop bug
    or basic abuse."""
    profile = get_or_create_profile(db, supabase_user.id)
    return MeResponse(
        id=str(profile.id),
        email=supabase_user.email,
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


@router.get("/admin-check")
def admin_only_probe(profile: Profile = Depends(require_admin)):
    """Temporary diagnostic route — see Phase 8 notes. Not rate-limited
    since it will be deleted before Milestone 3."""
    return {"message": "You are confirmed as an admin", "role": profile.role}
