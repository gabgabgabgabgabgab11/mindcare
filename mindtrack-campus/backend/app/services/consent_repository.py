import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.consent import ConsentRecord


def get_active_consent(db: Session, user_id: uuid.UUID, current_version: str) -> Optional[ConsentRecord]:
    """Returns the active consent record for the CURRENT version only.
    A signed-but-outdated-version record, or a withdrawn record,
    correctly returns None here."""
    stmt = (
        select(ConsentRecord)
        .where(
            ConsentRecord.user_id == user_id,
            ConsentRecord.consent_version == current_version,
            ConsentRecord.withdrawn_at.is_(None),
        )
        .order_by(ConsentRecord.signed_at.desc())
        .limit(1)
    )
    return db.execute(stmt).scalars().first()


def sign_consent(db: Session, user_id: uuid.UUID, version: str) -> ConsentRecord:
    record = ConsentRecord(user_id=user_id, consent_version=version)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def withdraw_active_consent(db: Session, user_id: uuid.UUID, current_version: str) -> Optional[ConsentRecord]:
    active = get_active_consent(db, user_id, current_version)
    if active is None:
        return None
    from datetime import datetime, timezone
    active.withdrawn_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(active)
    return active