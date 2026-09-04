import logging

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.models.journal_analysis import JournalAnalysis
from app.models.profile import Profile
from app.nlp.service import analyze_sentiment
from app.schemas.journal import (
    JournalAnalysisResponse,
    JournalCreateRequest,
    JournalListItem,
    JournalResponse,
    JournalUpdateRequest,
)
from app.security.consent_gate import require_consent
from app.services.journal_repository import (
    create_journal,
    delete_journal_for_user,
    get_journal_for_user,
    list_journals_for_user,
    to_response_dict,
    update_journal_for_user,
)

logger = logging.getLogger("mindtrack")

router = APIRouter(prefix="/api/v1/journals", tags=["journals"])


def _run_analysis_best_effort(db: Session, journal_id, content: str) -> None:
    """Analysis failures must never block journal creation — sentiment
    is an assistive, secondary feature. Any exception here is logged,
    not raised."""
    try:
        result = analyze_sentiment(content)
        db.add(
            JournalAnalysis(
                journal_id=journal_id,
                sentiment_label=result.label.value,
                confidence=result.confidence,
                model_version=result.model_version,
            )
        )
        db.commit()
    except Exception:
        logger.exception("NLP analysis failed for journal_id=%s (non-fatal)", journal_id)
        db.rollback()


@router.post("", response_model=JournalResponse, status_code=status.HTTP_201_CREATED)
def create_journal_entry(
    payload: JournalCreateRequest,
    profile: Profile = Depends(require_consent),
    db: Session = Depends(get_db),
):
    journal = create_journal(db, profile.id, payload.content)
    _run_analysis_best_effort(db, journal.id, payload.content)
    return JournalResponse(**to_response_dict(journal))


@router.get("", response_model=list[JournalListItem])
def list_journal_entries(
    profile: Profile = Depends(require_consent),
    db: Session = Depends(get_db),
):
    journals = list_journals_for_user(db, profile.id)
    return [JournalListItem(**to_response_dict(j)) for j in journals]


@router.get("/{journal_id}", response_model=JournalResponse)
def get_journal_entry(
    journal_id: UUID,
    profile: Profile = Depends(require_consent),
    db: Session = Depends(get_db),
):
    journal = get_journal_for_user(db, profile.id, journal_id)
    return JournalResponse(**to_response_dict(journal))


@router.get("/{journal_id}/analysis", response_model=JournalAnalysisResponse)
def get_journal_analysis(
    journal_id: UUID,
    profile: Profile = Depends(require_consent),
    db: Session = Depends(get_db),
):
    # Ownership check reuses the same 404-on-mismatch journal lookup —
    # a student cannot probe for another student's analysis by ID
    # any more than they could probe for their journal entry itself.
    get_journal_for_user(db, profile.id, journal_id)
    from sqlalchemy import select
    stmt = select(JournalAnalysis).where(JournalAnalysis.journal_id == journal_id)
    analysis = db.execute(stmt).scalars().first()
    if analysis is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="No analysis available for this entry yet")
    return JournalAnalysisResponse(
        sentiment_label=analysis.sentiment_label,
        is_uncertain=analysis.sentiment_label == "uncertain",
        analyzed_at=analysis.analyzed_at,
    )


@router.put("/{journal_id}", response_model=JournalResponse)
def update_journal_entry(
    journal_id: UUID,
    payload: JournalUpdateRequest,
    profile: Profile = Depends(require_consent),
    db: Session = Depends(get_db),
):
    journal = update_journal_for_user(db, profile.id, journal_id, payload.content)
    _run_analysis_best_effort(db, journal.id, payload.content)  # re-analyze on edit
    return JournalResponse(**to_response_dict(journal))


@router.delete("/{journal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_journal_entry(
    journal_id: UUID,
    profile: Profile = Depends(require_consent),
    db: Session = Depends(get_db),
):
    delete_journal_for_user(db, profile.id, journal_id)