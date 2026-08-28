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


@router.get("/me", response_model=MeResponse)
@limiter.limit("30/minute")
def read_current_user(
    request: Request,
    supabase_user: SupabaseUser = Depends(get_current_supabase_user),
    db: Session = Depends(get_db),
):
    """Returns the authenticated user's safe profile information.
    Rate-limited to 30 requests/minute per IP — generous enough for
    normal frontend polling, tight enough to blunt a retry-loop bug
    or basic abuse."""
    profile = get_or_create_profile(db, supabase_user.id)
    return MeResponse(
        id=str(profile.id),
        email=supabase_user.email,
        role=profile.role,
        year_level=profile.year_level,
        program=profile.program,
    )


@router.get("/admin-check")
def admin_only_probe(profile: Profile = Depends(require_admin)):
    """Temporary diagnostic route — see Phase 8 notes. Not rate-limited
    since it will be deleted before Milestone 3."""
    return {"message": "You are confirmed as an admin", "role": profile.role}