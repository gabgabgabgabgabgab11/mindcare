import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.wellness_checkin import WellnessCheckIn
from app.schemas.wellness_checkin import MOOD_LABELS
from app.security.encryption import decrypt_text, encrypt_text


def create_checkin(db: Session, user_id: uuid.UUID, mood_score: int, note: Optional[str]) -> WellnessCheckIn:
    checkin = WellnessCheckIn(
        user_id=user_id,
        mood_score=mood_score,
        note=encrypt_text(note) if note else None,
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return checkin


def list_checkins_for_user(db: Session, user_id: uuid.UUID, limit: int = 30) -> list[WellnessCheckIn]:
    stmt = (
        select(WellnessCheckIn)
        .where(WellnessCheckIn.user_id == user_id)
        .order_by(WellnessCheckIn.created_at.desc())
        .limit(limit)
    )
    return list(db.execute(stmt).scalars().all())


def to_response_dict(checkin: WellnessCheckIn) -> dict:
    """Decrypts the note only at the point of returning it to its owner -
    same pattern as journal_repository.to_response_dict."""
    return {
        "id": checkin.id,
        "mood_score": checkin.mood_score,
        "mood_label": MOOD_LABELS[checkin.mood_score],
        "note": decrypt_text(checkin.note) if checkin.note else None,
        "created_at": checkin.created_at,
    }