from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.profile import Profile
from app.security.supabase_auth import SupabaseUser, get_current_supabase_user
from app.services.profile_service import get_or_create_profile


def require_authenticated_user(
    supabase_user: SupabaseUser = Depends(get_current_supabase_user),
    db: Session = Depends(get_db),
) -> Profile:
    """Confirms the caller is a valid, known user and returns their
    Profile row. Any role is accepted here — use require_student or
    require_admin when a specific role is required."""
    return get_or_create_profile(db, supabase_user.id)


def require_student(
    profile: Profile = Depends(require_authenticated_user),
) -> Profile:
    if profile.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires a student account",
        )
    return profile


def require_admin(
    profile: Profile = Depends(require_authenticated_user),
) -> Profile:
    if profile.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires an administrator account",
        )
    return profile