from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.profile import Profile
from app.schemas.journal import JournalFolderCreateRequest, JournalFolderResponse, JournalFolderUpdateRequest
from app.security.consent_gate import require_consent
from app.services.journal_folder_repository import (
    create_folder,
    delete_folder,
    list_folders_for_user,
    to_folder_response,
    update_folder,
)

router = APIRouter(prefix="/api/v1/journal-folders", tags=["journal-folders"])


@router.get("", response_model=list[JournalFolderResponse])
def list_journal_folders(
    profile: Profile = Depends(require_consent),
    db: Session = Depends(get_db),
):
    return [to_folder_response(folder) for folder in list_folders_for_user(db, profile.id)]


@router.post("", response_model=JournalFolderResponse, status_code=status.HTTP_201_CREATED)
def create_journal_folder(
    payload: JournalFolderCreateRequest,
    profile: Profile = Depends(require_consent),
    db: Session = Depends(get_db),
):
    folder = create_folder(db, profile.id, payload.name, payload.cover_color, payload.cover_image)
    return to_folder_response(folder)


@router.patch("/{folder_id}", response_model=JournalFolderResponse)
def update_journal_folder(
    folder_id: UUID,
    payload: JournalFolderUpdateRequest,
    profile: Profile = Depends(require_consent),
    db: Session = Depends(get_db),
):
    folder = update_folder(db, profile.id, folder_id, payload.name, payload.cover_color, payload.cover_image)
    return to_folder_response(folder)


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_journal_folder(
    folder_id: UUID,
    profile: Profile = Depends(require_consent),
    db: Session = Depends(get_db),
):
    delete_folder(db, profile.id, folder_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
