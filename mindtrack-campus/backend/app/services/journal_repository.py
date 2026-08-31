import uuid
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.journal import Journal
from app.security.encryption import decrypt_text, encrypt_text


def create_journal(db: Session, user_id: uuid.UUID, content: str) -> Journal:
    journal = Journal(user_id=user_id, content=encrypt_text(content))
    db.add(journal)
    db.commit()
    db.refresh(journal)
    return journal


def list_journals_for_user(db: Session, user_id: uuid.UUID) -> list[Journal]:
    stmt = select(Journal).where(Journal.user_id == user_id).order_by(Journal.created_at.desc())
    return list(db.execute(stmt).scalars().all())


def get_journal_for_user(db: Session, user_id: uuid.UUID, journal_id: uuid.UUID) -> Journal:
    """404 (not 403) on any ownership mismatch — same reasoning as
    assessment results in Phases 10-11."""
    journal: Optional[Journal] = db.get(Journal, journal_id)
    if journal is None or journal.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found")
    return journal


def update_journal_for_user(
    db: Session, user_id: uuid.UUID, journal_id: uuid.UUID, content: str
) -> Journal:
    journal = get_journal_for_user(db, user_id, journal_id)  # raises 404 if not owner
    journal.content = encrypt_text(content)
    db.commit()
    db.refresh(journal)
    return journal


def delete_journal_for_user(db: Session, user_id: uuid.UUID, journal_id: uuid.UUID) -> None:
    journal = get_journal_for_user(db, user_id, journal_id)  # raises 404 if not owner
    db.delete(journal)
    db.commit()


def to_response_dict(journal: Journal) -> dict:
    """Decrypts content only at the point of returning it to its owner."""
    return {
        "id": journal.id,
        "content": decrypt_text(journal.content),
        "created_at": journal.created_at,
        "updated_at": journal.updated_at,
    }