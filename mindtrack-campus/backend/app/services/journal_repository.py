import uuid
import json
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.journal import Journal
from app.models.journal_folder import JournalFolder
from app.security.encryption import decrypt_text, encrypt_text


def _validate_folder(db: Session, user_id: uuid.UUID, folder_id: uuid.UUID | None) -> None:
    if folder_id is None:
        return
    folder = db.get(JournalFolder, folder_id)
    if folder is None or folder.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal folder not found")


def _encode_decorations(decorations: list[dict] | None) -> str:
    return encrypt_text(json.dumps(decorations or [], separators=(",", ":")))


def _decode_decorations(ciphertext: str | None) -> list[dict]:
    if not ciphertext:
        return []
    try:
        value = json.loads(decrypt_text(ciphertext))
    except (ValueError, json.JSONDecodeError):
        return []
    return value if isinstance(value, list) else []


def create_journal(
    db: Session,
    user_id: uuid.UUID,
    content: str,
    title: str | None = None,
    folder_id: uuid.UUID | None = None,
    decorations: list[dict] | None = None,
) -> Journal:
    _validate_folder(db, user_id, folder_id)
    decoration_items = decorations or []
    journal = Journal(
        user_id=user_id,
        content=encrypt_text(content),
        title=encrypt_text(title) if title else None,
        folder_id=folder_id,
        decorations=_encode_decorations(decoration_items),
        decoration_count=len(decoration_items),
    )
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
    db: Session,
    user_id: uuid.UUID,
    journal_id: uuid.UUID,
    content: str,
    title: str | None = None,
    folder_id: uuid.UUID | None = None,
    is_archived: bool = False,
    decorations: list[dict] | None = None,
) -> Journal:
    journal = get_journal_for_user(db, user_id, journal_id)  # raises 404 if not owner
    _validate_folder(db, user_id, folder_id)
    journal.content = encrypt_text(content)
    journal.title = encrypt_text(title) if title else None
    journal.folder_id = folder_id
    journal.is_archived = is_archived
    decoration_items = decorations or []
    journal.decorations = _encode_decorations(decoration_items)
    journal.decoration_count = len(decoration_items)
    db.commit()
    db.refresh(journal)
    return journal


def set_journal_archived(
    db: Session, user_id: uuid.UUID, journal_id: uuid.UUID, is_archived: bool
) -> Journal:
    journal = get_journal_for_user(db, user_id, journal_id)
    journal.is_archived = is_archived
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
        "title": decrypt_text(journal.title) if journal.title else None,
        "folder_id": journal.folder_id,
        "is_archived": journal.is_archived,
        "decorations": _decode_decorations(journal.decorations),
    }


def to_list_response_dict(journal: Journal) -> dict:
    return {
        "id": journal.id,
        "content": decrypt_text(journal.content),
        "created_at": journal.created_at,
        "updated_at": journal.updated_at,
        "title": decrypt_text(journal.title) if journal.title else None,
        "folder_id": journal.folder_id,
        "is_archived": journal.is_archived,
        "decoration_count": journal.decoration_count,
    }
