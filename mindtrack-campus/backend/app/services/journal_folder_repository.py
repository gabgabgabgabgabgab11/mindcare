import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.journal_folder import JournalFolder
from app.security.encryption import decrypt_text, encrypt_text


def list_folders_for_user(db: Session, user_id: uuid.UUID) -> list[JournalFolder]:
    stmt = select(JournalFolder).where(JournalFolder.user_id == user_id).order_by(JournalFolder.created_at.asc())
    return list(db.execute(stmt).scalars().all())


def get_folder_for_user(db: Session, user_id: uuid.UUID, folder_id: uuid.UUID) -> JournalFolder:
    folder = db.get(JournalFolder, folder_id)
    if folder is None or folder.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal folder not found")
    return folder


def create_folder(db: Session, user_id: uuid.UUID, name: str, cover_color: str, cover_image: str | None) -> JournalFolder:
    folder = JournalFolder(
        user_id=user_id,
        name=name,
        cover_color=cover_color,
        cover_image=encrypt_text(cover_image) if cover_image else None,
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


def update_folder(
    db: Session, user_id: uuid.UUID, folder_id: uuid.UUID, name: str, cover_color: str, cover_image: str | None
) -> JournalFolder:
    folder = get_folder_for_user(db, user_id, folder_id)
    folder.name = name
    folder.cover_color = cover_color
    folder.cover_image = encrypt_text(cover_image) if cover_image else None
    db.commit()
    db.refresh(folder)
    return folder


def to_folder_response(folder: JournalFolder) -> dict:
    return {
        "id": folder.id,
        "name": folder.name,
        "cover_color": folder.cover_color,
        "cover_image": decrypt_text(folder.cover_image) if folder.cover_image else None,
        "created_at": folder.created_at,
    }


def delete_folder(db: Session, user_id: uuid.UUID, folder_id: uuid.UUID) -> None:
    folder = get_folder_for_user(db, user_id, folder_id)
    db.delete(folder)
    db.commit()
