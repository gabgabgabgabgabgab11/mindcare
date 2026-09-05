import uuid
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.mantra_wall import MantraWallPost, MantraWallReport


def create_post(db: Session, user_id: uuid.UUID, post_type: str, content: str, nickname: Optional[str]) -> MantraWallPost:
    post = MantraWallPost(
        user_id=user_id,
        post_type=post_type,
        content=content,
        nickname=nickname,
        moderation_status="pending",
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def list_visible_posts(db: Session, requesting_user_id: uuid.UUID) -> list[MantraWallPost]:
    """A student sees: all approved posts, PLUS their own pending/rejected/
    flagged posts (so they know their post's status), but never another
    student's non-approved post."""
    stmt = (
        select(MantraWallPost)
        .where(
            (MantraWallPost.moderation_status == "approved")
            | (MantraWallPost.user_id == requesting_user_id)
        )
        .order_by(MantraWallPost.created_at.desc())
    )
    return list(db.execute(stmt).scalars().all())


def get_post_or_404(db: Session, post_id: uuid.UUID) -> MantraWallPost:
    post: Optional[MantraWallPost] = db.get(MantraWallPost, post_id)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return post


def create_report(db: Session, post_id: uuid.UUID, reporter_id: uuid.UUID, reason: Optional[str]) -> MantraWallReport:
    get_post_or_404(db, post_id)  # 404s before reporting a nonexistent post
    report = MantraWallReport(post_id=post_id, reporter_id=reporter_id, reason=reason)
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def list_reports_for_admin(db: Session) -> list[dict]:
    stmt = (
        select(MantraWallReport, MantraWallPost)
        .join(MantraWallPost, MantraWallReport.post_id == MantraWallPost.id)
        .order_by(MantraWallReport.created_at.desc())
    )
    rows = db.execute(stmt).all()
    return [
        {
            "id": report.id,
            "post_id": report.post_id,
            "reporter_id": report.reporter_id,
            "reason": report.reason,
            "created_at": report.created_at,
            "post_content": post.content,
            "post_moderation_status": post.moderation_status,
        }
        for report, post in rows
    ]


def moderate_post(db: Session, post_id: uuid.UUID, admin_id: uuid.UUID, new_status: str) -> MantraWallPost:
    from datetime import datetime, timezone

    post = get_post_or_404(db, post_id)
    post.moderation_status = new_status
    post.moderated_by = admin_id
    post.moderated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(post)
    return post