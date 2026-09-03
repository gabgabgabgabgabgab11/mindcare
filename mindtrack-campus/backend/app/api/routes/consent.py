from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.profile import Profile
from app.schemas.consent import ConsentSignResponse, ConsentStatusResponse, ConsentWithdrawResponse
from app.security.rbac import require_student
from app.services.consent_repository import get_active_consent, sign_consent, withdraw_active_consent

settings = get_settings()

router = APIRouter(prefix="/api/v1/consent", tags=["consent"])


@router.get("/status", response_model=ConsentStatusResponse)
def get_consent_status(
    profile: Profile = Depends(require_student),
    db: Session = Depends(get_db),
):
    active = get_active_consent(db, profile.id, settings.CURRENT_CONSENT_VERSION)
    return ConsentStatusResponse(
        has_active_consent=active is not None,
        consented_version=active.consent_version if active else None,
        current_version=settings.CURRENT_CONSENT_VERSION,
        signed_at=active.signed_at if active else None,
    )


@router.post("", response_model=ConsentSignResponse, status_code=201)
def post_consent(
    profile: Profile = Depends(require_student),
    db: Session = Depends(get_db),
):
    existing = get_active_consent(db, profile.id, settings.CURRENT_CONSENT_VERSION)
    if existing is not None:
        return ConsentSignResponse(consent_version=existing.consent_version, signed_at=existing.signed_at)
    record = sign_consent(db, profile.id, settings.CURRENT_CONSENT_VERSION)
    return ConsentSignResponse(consent_version=record.consent_version, signed_at=record.signed_at)


@router.post("/withdraw", response_model=ConsentWithdrawResponse)
def post_withdraw_consent(
    profile: Profile = Depends(require_student),
    db: Session = Depends(get_db),
):
    from fastapi import HTTPException
    active = withdraw_active_consent(db, profile.id, settings.CURRENT_CONSENT_VERSION)
    if active is None:
        raise HTTPException(status_code=404, detail="No active consent found to withdraw")
    return ConsentWithdrawResponse(withdrawn_at=active.withdrawn_at)