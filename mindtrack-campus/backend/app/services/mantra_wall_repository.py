import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.mantra_wall import MantraWallPost, MantraWallReport, MantraWallHeart
from app.services.content_filter import determine_moderation_status


def create_post(db: Session, user_id: uuid.UUID, post_type: str, content: str, nickname: Optional[str]) -> MantraWallPost:
    moderation_status, filter_reason = determine_moderation_status(content)
    post = MantraWallPost(
        user_id=user_id,
        post_type=post_type,
        content=content,
        nickname=nickname,
        moderation_status=moderation_status,
        filter_reason=filter_reason,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def list_visible_posts(db: Session, requesting_user_id: uuid.UUID) -> list[MantraWallPost]:
    """A student sees: all approved posts, PLUS their own non-approved
    posts (so they know their post's status), but never another
    student's non-approved post.

    Under tiered auto-moderation (ADR-011), 'approved' posts are
    visible to everyone.  Posts in 'review', 'rejected', or 'archived'
    are visible only to their author."""
    stmt = (
        select(MantraWallPost)
        .where(
            (MantraWallPost.moderation_status == "approved")
            | (MantraWallPost.user_id == requesting_user_id)
        )
        .order_by(MantraWallPost.created_at.desc())
    )
    return list(db.execute(stmt).scalars().all())


def get_heart_summaries(db: Session, post_ids: list[uuid.UUID], user_id: uuid.UUID) -> dict:
    if not post_ids:
        return {}
    rows = db.execute(
        select(
            MantraWallHeart.post_id,
            func.count().label("heart_count"),
            func.max(case((MantraWallHeart.user_id == user_id, 1), else_=0)).label("has_sent_heart"),
        ).where(MantraWallHeart.post_id.in_(post_ids)).group_by(MantraWallHeart.post_id)
    ).all()
    return {row.post_id: {"heart_count": row.heart_count, "has_sent_heart": bool(row.has_sent_heart)} for row in rows}


def set_post_heart(db: Session, post_id: uuid.UUID, user_id: uuid.UUID, hearted: bool) -> dict:
    # Serialize updates to a post in PostgreSQL. The composite primary key is
    # also a database-level guarantee against duplicate hearts per account.
    post = db.execute(select(MantraWallPost).where(
        MantraWallPost.id == post_id, MantraWallPost.moderation_status == "approved",
    ).with_for_update()).scalar_one_or_none()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not available")
    heart = db.get(MantraWallHeart, (post_id, user_id))
    if hearted and heart is None:
        db.add(MantraWallHeart(post_id=post_id, user_id=user_id))
    elif not hearted and heart is not None:
        db.delete(heart)
    db.flush()
    result = get_heart_summaries(db, [post_id], user_id).get(post_id, {"heart_count": 0, "has_sent_heart": False})
    db.commit()
    return result


def list_posts_for_admin(db: Session, status_filter: Optional[str] = None) -> list[MantraWallPost]:
    stmt = select(MantraWallPost).order_by(MantraWallPost.created_at.desc())
    if status_filter:
        stmt = stmt.where(MantraWallPost.moderation_status == status_filter)
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
    """Original flat report list — kept for backward compatibility with
    the admin dashboard's recent-reports feed."""
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


def list_grouped_reports_for_admin(
    db: Session,
    resolved: bool = False,
    sort_by: str = "reports_count",
) -> list[dict]:
    """Grouped report view — one entry per reported post (ADR-011).

    Args:
        resolved: If False (default), only unresolved reports.
        sort_by: 'reports_count' (most-reported first) or 'newest'.
    """
    # Subquery: aggregate reports per post
    report_agg = (
        select(
            MantraWallReport.post_id,
            func.count(MantraWallReport.id).label("report_count"),
            func.max(MantraWallReport.created_at).label("latest_report_at"),
        )
        .where(MantraWallReport.resolved == resolved)
        .group_by(MantraWallReport.post_id)
        .subquery()
    )

    stmt = (
        select(MantraWallPost, report_agg.c.report_count, report_agg.c.latest_report_at)
        .join(report_agg, MantraWallPost.id == report_agg.c.post_id)
    )

    if sort_by == "reports_count":
        stmt = stmt.order_by(report_agg.c.report_count.desc())
    else:
        stmt = stmt.order_by(report_agg.c.latest_report_at.desc())

    rows = db.execute(stmt).all()

    result = []
    for post, report_count, latest_report_at in rows:
        # Fetch individual report details for this post
        reports_stmt = (
            select(MantraWallReport)
            .where(MantraWallReport.post_id == post.id)
            .where(MantraWallReport.resolved == resolved)
        )
        reports = list(db.execute(reports_stmt).scalars().all())
        reasons = list({r.reason for r in reports if r.reason})
        reporter_ids = [r.reporter_id for r in reports]

        result.append({
            "post_id": post.id,
            "post_content": post.content,
            "post_type": post.post_type,
            "post_moderation_status": post.moderation_status,
            "post_created_at": post.created_at,
            "filter_reason": post.filter_reason,
            "report_count": report_count,
            "reasons": reasons,
            "reporter_ids": reporter_ids,
            "latest_report_at": latest_report_at,
        })

    return result


def moderate_post(db: Session, post_id: uuid.UUID, admin_id: uuid.UUID, new_status: str) -> MantraWallPost:
    post = get_post_or_404(db, post_id)
    post.moderation_status = new_status
    post.moderated_by = admin_id
    post.moderated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(post)
    return post


def bulk_moderate_posts(
    db: Session,
    post_ids: list[uuid.UUID],
    admin_id: uuid.UUID,
    new_status: str,
) -> list[MantraWallPost]:
    """Moderate multiple posts in a single transaction (ADR-011)."""
    now = datetime.now(timezone.utc)
    posts = []
    for post_id in post_ids:
        post = get_post_or_404(db, post_id)
        post.moderation_status = new_status
        post.moderated_by = admin_id
        post.moderated_at = now
        posts.append(post)
    db.commit()
    for p in posts:
        db.refresh(p)
    return posts


def resolve_reports_for_post(db: Session, post_id: uuid.UUID, admin_id: uuid.UUID) -> int:
    """Mark all unresolved reports for a post as resolved.
    Returns the number of reports resolved."""
    now = datetime.now(timezone.utc)
    stmt = (
        select(MantraWallReport)
        .where(MantraWallReport.post_id == post_id)
        .where(MantraWallReport.resolved == False)  # noqa: E712
    )
    reports = list(db.execute(stmt).scalars().all())
    for report in reports:
        report.resolved = True
        report.resolved_by = admin_id
        report.resolved_at = now
    db.commit()
    return len(reports)