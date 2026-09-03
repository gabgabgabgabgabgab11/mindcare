from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.profile import Profile
from app.security.rbac import require_student
from app.services.consent_repository import get_active_consent

settings = get_settings()


def require_consent(
    profile: Profile = Depends(require_student),
    db: Session = Depends(get_db),
) -> Profile:
    """A student-only dependency that additionally requires an active,
    current-version consent record. Intended to be composed in front
    of any wellness-feature route (see Phase 15B for actual wiring)."""
    active = get_active_consent(db, profile.id, settings.CURRENT_CONSENT_VERSION)
    if active is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active informed consent is required to use this feature.",
        )
    return profile