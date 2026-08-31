from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.models.profile import Profile
from app.schemas.journal import (
    JournalCreateRequest,
    JournalListItem,
    JournalResponse,
    JournalUpdateRequest,
)
from app.security.rbac import require_student
from app.services.journal_repository import (
    create_journal,
    delete_journal_for_user,
    get_journal_for_user,
    list_journals_for_user,
    to_response_dict,
    update_journal_for_user,
)

router = APIRouter(prefix="/api/v1/journals", tags=["journals"])


@router.post("", response_model=JournalResponse, status_code=status.HTTP_201_CREATED)
def create_journal_entry(
    payload: JournalCreateRequest,
    profile: Profile = Depends(require_student),
    db: Session = Depends(get_db),
):
    journal = create_journal(db, profile.id, payload.content)
    return JournalResponse(**to_response_dict(journal))


@router.get("", response_model=list[JournalListItem])
def list_journal_entries(
    profile: Profile = Depends(require_student),
    db: Session = Depends(get_db),
):
    journals = list_journals_for_user(db, profile.id)
    return [JournalListItem(**to_response_dict(j)) for j in journals]


@router.get("/{journal_id}", response_model=JournalResponse)
def get_journal_entry(
    journal_id: UUID,
    profile: Profile = Depends(require_student),
    db: Session = Depends(get_db),
):
    journal = get_journal_for_user(db, profile.id, journal_id)
    return JournalResponse(**to_response_dict(journal))


@router.put("/{journal_id}", response_model=JournalResponse)
def update_journal_entry(
    journal_id: UUID,
    payload: JournalUpdateRequest,
    profile: Profile = Depends(require_student),
    db: Session = Depends(get_db),
):
    journal = update_journal_for_user(db, profile.id, journal_id, payload.content)
    return JournalResponse(**to_response_dict(journal))


@router.delete("/{journal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_journal_entry(
    journal_id: UUID,
    profile: Profile = Depends(require_student),
    db: Session = Depends(get_db),
):
    delete_journal_for_user(db, profile.id, journal_id)