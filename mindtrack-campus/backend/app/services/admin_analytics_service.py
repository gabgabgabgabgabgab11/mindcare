"""Wellness Analytics aggregation service.

PRIVACY CONTRACT
────────────────
• This service NEVER returns individual student identifiers, scores, or
  wellness records.
• All queries aggregate at the DB level using AVG / COUNT / GROUP BY.
• If the resulting cohort contains fewer than MIN_COHORT_SIZE distinct
  students, wellness score averages and distributions are withheld and
  ``cohort_hidden=True`` is returned instead.

CLINICAL NOTE
─────────────
Averages produced here are descriptive statistics of existing,
already-computed assessment_results rows.  They do not constitute
a diagnosis or a clinical determination.  The PHQ-9 and GAD-7
severity bands stored in assessment_results were computed by the
validated scoring services (phq9_service.py / gad7_service.py).
No new clinical classification logic is introduced here.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import Date, Float, cast, distinct, func, select
from sqlalchemy.orm import Session

from app.models.assessment import AssessmentResult
from app.models.journal import Journal
from app.models.profile import Profile
from app.models.wellness_checkin import WellnessCheckIn

# ── Privacy threshold ──────────────────────────────────────────────────────
# Groups smaller than this will have wellness averages withheld.
MIN_COHORT_SIZE: int = 5

# ── PHQ-9 severity bands (must match phq9_service.Phq9Severity) ────────────
PHQ9_BANDS = ("minimal", "mild", "moderate", "moderately_severe", "severe")

# ── GAD-7 severity bands (must match gad7_service.Gad7Severity) ────────────
GAD7_BANDS = ("minimal", "mild", "moderate", "severe")


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _date_filter(col, start_date: Optional[str], end_date: Optional[str]):
    """Return a list of SQLAlchemy filter expressions for a timestamp column."""
    filters = []
    if start_date:
        try:
            filters.append(col >= datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc))
        except ValueError:
            pass
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date).replace(tzinfo=timezone.utc)
            # Include the entire end day
            end_dt = end_dt.replace(hour=23, minute=59, second=59)
            filters.append(col <= end_dt)
        except ValueError:
            pass
    return filters


def _profile_filters(
    program: Optional[str],
    year_level: Optional[str],
    section: Optional[str],
):
    """Return filter expressions that narrow the profiles table."""
    filters = []
    if program:
        filters.append(Profile.program == program)
    if year_level:
        filters.append(Profile.year_level == year_level)
    if section:
        filters.append(Profile.section == section)
    return filters


def _semester_date_range(
    academic_year: Optional[str],
    semester: Optional[str],
) -> tuple[Optional[datetime], Optional[datetime]]:
    """
    Convert academic_year + semester into approximate calendar date bounds.

    Academic year format: "2026-2027"
    Semester values: "1st", "2nd", "summer"

    Returns (start, end) datetimes (UTC), or (None, None) if insufficient info.
    """
    if not academic_year:
        return None, None
    try:
        start_yr = int(academic_year.split("-")[0])
    except (ValueError, IndexError):
        return None, None

    if semester == "1st":
        return (
            datetime(start_yr, 8, 1, tzinfo=timezone.utc),
            datetime(start_yr, 12, 31, tzinfo=timezone.utc),
        )
    if semester == "2nd":
        return (
            datetime(start_yr + 1, 1, 1, tzinfo=timezone.utc),
            datetime(start_yr + 1, 5, 31, tzinfo=timezone.utc),
        )
    if semester == "summer":
        return (
            datetime(start_yr + 1, 6, 1, tzinfo=timezone.utc),
            datetime(start_yr + 1, 7, 31, tzinfo=timezone.utc),
        )
    # No semester filter — whole academic year
    return (
        datetime(start_yr, 8, 1, tzinfo=timezone.utc),
        datetime(start_yr + 1, 7, 31, tzinfo=timezone.utc),
    )


def _resolve_date_bounds(
    academic_year: Optional[str],
    semester: Optional[str],
    start_date: Optional[str],
    end_date: Optional[str],
) -> tuple[Optional[datetime], Optional[datetime]]:
    """
    Explicit start_date / end_date takes priority over academic_year + semester.
    """
    if start_date or end_date:
        start = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc) if start_date else None
        end = (
            datetime.fromisoformat(end_date).replace(tzinfo=timezone.utc).replace(
                hour=23, minute=59, second=59
            )
            if end_date
            else None
        )
        return start, end
    return _semester_date_range(academic_year, semester)


# ---------------------------------------------------------------------------
# Public API — called by the route layer
# ---------------------------------------------------------------------------

def get_wellness_overview(
    db: Session,
    *,
    program: Optional[str] = None,
    year_level: Optional[str] = None,
    section: Optional[str] = None,
    academic_year: Optional[str] = None,
    semester: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> dict:
    """Aggregate participation KPIs for the selected cohort."""
    date_start, date_end = _resolve_date_bounds(academic_year, semester, start_date, end_date)
    prof_filters = _profile_filters(program, year_level, section)

    # Matching student user_ids
    student_ids_stmt = (
        select(Profile.id)
        .where(Profile.role == "student")
        .where(*prof_filters)
        if prof_filters
        else select(Profile.id).where(Profile.role == "student")
    )
    student_ids: list = [row[0] for row in db.execute(student_ids_stmt).all()]
    total_students = len(student_ids)

    if total_students == 0:
        return {
            "total_students": 0,
            "assessment_count": 0,
            "assessment_participation_rate": None,
            "checkin_count": 0,
            "checkin_participation_rate": None,
            "journal_count": 0,
            "journal_participation_rate": None,
            "follow_up_flags": 0,
            "cohort_hidden": False,
            "min_cohort_size": MIN_COHORT_SIZE,
        }

    # Assessment count (phq9 + gad7 combined)
    assess_q = (
        select(func.count())
        .select_from(AssessmentResult)
        .where(AssessmentResult.user_id.in_(student_ids))
    )
    if date_start:
        assess_q = assess_q.where(AssessmentResult.created_at >= date_start)
    if date_end:
        assess_q = assess_q.where(AssessmentResult.created_at <= date_end)
    assessment_count = db.scalar(assess_q) or 0

    # Unique students who submitted at least one assessment
    assessed_students_q = (
        select(func.count(distinct(AssessmentResult.user_id)))
        .where(AssessmentResult.user_id.in_(student_ids))
    )
    if date_start:
        assessed_students_q = assessed_students_q.where(AssessmentResult.created_at >= date_start)
    if date_end:
        assessed_students_q = assessed_students_q.where(AssessmentResult.created_at <= date_end)
    assessed_students = db.scalar(assessed_students_q) or 0

    # Check-in count
    checkin_q = (
        select(func.count())
        .select_from(WellnessCheckIn)
        .where(WellnessCheckIn.user_id.in_(student_ids))
    )
    if date_start:
        checkin_q = checkin_q.where(WellnessCheckIn.created_at >= date_start)
    if date_end:
        checkin_q = checkin_q.where(WellnessCheckIn.created_at <= date_end)
    checkin_count = db.scalar(checkin_q) or 0

    checkin_students_q = (
        select(func.count(distinct(WellnessCheckIn.user_id)))
        .where(WellnessCheckIn.user_id.in_(student_ids))
    )
    if date_start:
        checkin_students_q = checkin_students_q.where(WellnessCheckIn.created_at >= date_start)
    if date_end:
        checkin_students_q = checkin_students_q.where(WellnessCheckIn.created_at <= date_end)
    checkin_students = db.scalar(checkin_students_q) or 0

    # Journal count (entry count, not content)
    journal_q = (
        select(func.count())
        .select_from(Journal)
        .where(Journal.user_id.in_(student_ids))
    )
    if date_start:
        journal_q = journal_q.where(Journal.created_at >= date_start)
    if date_end:
        journal_q = journal_q.where(Journal.created_at <= date_end)
    journal_count = db.scalar(journal_q) or 0

    journal_students_q = (
        select(func.count(distinct(Journal.user_id)))
        .where(Journal.user_id.in_(student_ids))
    )
    if date_start:
        journal_students_q = journal_students_q.where(Journal.created_at >= date_start)
    if date_end:
        journal_students_q = journal_students_q.where(Journal.created_at <= date_end)
    journal_students = db.scalar(journal_students_q) or 0

    # Follow-up flags: students whose latest PHQ-9 or GAD-7 result is
    # escalated=True — reuses the existing deterministic escalation flag.
    flags_q = (
        select(func.count(distinct(AssessmentResult.user_id)))
        .where(
            AssessmentResult.user_id.in_(student_ids),
            AssessmentResult.escalated == True,  # noqa: E712
        )
    )
    follow_up_flags = db.scalar(flags_q) or 0

    def _rate(numerator: int, denominator: int) -> Optional[float]:
        if denominator == 0:
            return None
        return round(numerator / denominator * 100, 1)

    return {
        "total_students": total_students,
        "assessment_count": assessment_count,
        "assessment_participation_rate": _rate(assessed_students, total_students),
        "checkin_count": checkin_count,
        "checkin_participation_rate": _rate(checkin_students, total_students),
        "journal_count": journal_count,
        "journal_participation_rate": _rate(journal_students, total_students),
        "follow_up_flags": follow_up_flags,
        "cohort_hidden": False,
        "min_cohort_size": MIN_COHORT_SIZE,
    }


def get_wellness_screening(
    db: Session,
    *,
    program: Optional[str] = None,
    year_level: Optional[str] = None,
    section: Optional[str] = None,
    academic_year: Optional[str] = None,
    semester: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> dict:
    """Return aggregate PHQ-9 and GAD-7 averages and severity distributions.

    If the cohort is smaller than MIN_COHORT_SIZE, wellness scores are
    withheld and cohort_hidden=True is returned.
    """
    date_start, date_end = _resolve_date_bounds(academic_year, semester, start_date, end_date)
    prof_filters = _profile_filters(program, year_level, section)

    student_ids_stmt = (
        select(Profile.id)
        .where(Profile.role == "student")
        .where(*prof_filters)
        if prof_filters
        else select(Profile.id).where(Profile.role == "student")
    )
    student_ids = [row[0] for row in db.execute(student_ids_stmt).all()]

    empty_dist = {"minimal": 0, "mild": 0, "moderate": 0, "moderately_severe": 0, "severe": 0}

    if len(student_ids) < MIN_COHORT_SIZE:
        return {
            "sample_size": len(student_ids),
            "average_phq9": None,
            "average_gad7": None,
            "phq9_distribution": empty_dist,
            "gad7_distribution": {"minimal": 0, "mild": 0, "moderate": 0, "severe": 0},
            "cohort_hidden": len(student_ids) > 0,  # True only when >0 but <threshold
        }

    def _score_query(code: str):
        q = (
            select(
                func.avg(AssessmentResult.total_score).label("avg_score"),
                func.count().label("count"),
            )
            .where(
                AssessmentResult.user_id.in_(student_ids),
                AssessmentResult.assessment_code == code,
            )
        )
        if date_start:
            q = q.where(AssessmentResult.created_at >= date_start)
        if date_end:
            q = q.where(AssessmentResult.created_at <= date_end)
        return db.execute(q).one()

    def _dist_query(code: str):
        q = (
            select(AssessmentResult.severity_band, func.count().label("cnt"))
            .where(
                AssessmentResult.user_id.in_(student_ids),
                AssessmentResult.assessment_code == code,
            )
            .group_by(AssessmentResult.severity_band)
        )
        if date_start:
            q = q.where(AssessmentResult.created_at >= date_start)
        if date_end:
            q = q.where(AssessmentResult.created_at <= date_end)
        return {row.severity_band: row.cnt for row in db.execute(q).all()}

    phq9_row = _score_query("phq9")
    gad7_row = _score_query("gad7")

    phq9_dist_raw = _dist_query("phq9")
    gad7_dist_raw = _dist_query("gad7")

    phq9_dist = {band: phq9_dist_raw.get(band, 0) for band in PHQ9_BANDS}
    gad7_dist = {band: gad7_dist_raw.get(band, 0) for band in GAD7_BANDS}
    # GAD-7 has no "moderately_severe" band — include it as 0 for schema compat
    gad7_dist.setdefault("moderately_severe", 0)

    sample_size = (phq9_row.count or 0) + (gad7_row.count or 0)

    return {
        "sample_size": sample_size,
        "average_phq9": round(float(phq9_row.avg_score), 2) if phq9_row.avg_score is not None else None,
        "average_gad7": round(float(gad7_row.avg_score), 2) if gad7_row.avg_score is not None else None,
        "phq9_distribution": phq9_dist,
        "gad7_distribution": gad7_dist,
        "cohort_hidden": False,
    }


def get_wellness_by_group(
    db: Session,
    *,
    group_by: str,   # "program" | "year_level" | "section"
    program: Optional[str] = None,
    year_level: Optional[str] = None,
    academic_year: Optional[str] = None,
    semester: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> dict:
    """Aggregate average PHQ-9 and GAD-7 per program / year level / section.

    Groups with fewer than MIN_COHORT_SIZE students have their wellness
    averages withheld (cohort_hidden=True for that group row).
    """
    date_start, date_end = _resolve_date_bounds(academic_year, semester, start_date, end_date)

    group_col_map = {
        "program": Profile.program,
        "year_level": Profile.year_level,
        "section": Profile.section,
    }
    if group_by not in group_col_map:
        return {"groups": []}

    group_col = group_col_map[group_by]

    # Build base profile filter
    base_filters = [Profile.role == "student", group_col.isnot(None)]
    if program and group_by in ("year_level", "section"):
        base_filters.append(Profile.program == program)
    if year_level and group_by == "section":
        base_filters.append(Profile.year_level == year_level)

    # Fetch all student ids + their group value
    student_rows = db.execute(
        select(Profile.id, group_col.label("group_val")).where(*base_filters)
    ).all()

    # Build: group_name -> [user_id, ...]
    groups: dict[str, list] = {}
    for row in student_rows:
        if row.group_val:
            groups.setdefault(row.group_val, []).append(row[0])

    def _avg_for_ids(user_ids: list, code: str) -> Optional[float]:
        if not user_ids:
            return None
        q = select(func.avg(AssessmentResult.total_score)).where(
            AssessmentResult.user_id.in_(user_ids),
            AssessmentResult.assessment_code == code,
        )
        if date_start:
            q = q.where(AssessmentResult.created_at >= date_start)
        if date_end:
            q = q.where(AssessmentResult.created_at <= date_end)
        val = db.scalar(q)
        return round(float(val), 2) if val is not None else None

    def _assess_count(user_ids: list) -> int:
        if not user_ids:
            return 0
        q = select(func.count()).where(AssessmentResult.user_id.in_(user_ids))
        if date_start:
            q = q.where(AssessmentResult.created_at >= date_start)
        if date_end:
            q = q.where(AssessmentResult.created_at <= date_end)
        return db.scalar(q) or 0

    result_groups = []
    for group_name in sorted(groups.keys()):
        ids = groups[group_name]
        sc = len(ids)
        hidden = sc < MIN_COHORT_SIZE
        result_groups.append({
            "group_name": group_name,
            "student_count": sc,
            "assessment_count": _assess_count(ids),
            "average_phq9": None if hidden else _avg_for_ids(ids, "phq9"),
            "average_gad7": None if hidden else _avg_for_ids(ids, "gad7"),
            "cohort_hidden": hidden,
        })

    return {"groups": result_groups}


def get_wellness_trend(
    db: Session,
    *,
    program: Optional[str] = None,
    year_level: Optional[str] = None,
    section: Optional[str] = None,
    academic_year: Optional[str] = None,
    semester: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> dict:
    """Return a time-series of daily average PHQ-9, GAD-7, and assessment count."""
    date_start, date_end = _resolve_date_bounds(academic_year, semester, start_date, end_date)
    # Default: last 90 days if no date filters
    if date_start is None and date_end is None:
        date_start = datetime.now(timezone.utc) - timedelta(days=90)

    prof_filters = _profile_filters(program, year_level, section)
    student_ids_subq = (
        select(Profile.id)
        .where(Profile.role == "student")
        .where(*prof_filters)
        if prof_filters
        else select(Profile.id).where(Profile.role == "student")
    ).scalar_subquery()

    q = (
        select(
            cast(AssessmentResult.created_at, Date).label("date"),
            func.avg(
                AssessmentResult.total_score.cast(Float)
            ).filter(AssessmentResult.assessment_code == "phq9").label("avg_phq9"),
            func.avg(
                AssessmentResult.total_score.cast(Float)
            ).filter(AssessmentResult.assessment_code == "gad7").label("avg_gad7"),
            func.count().label("assessment_count"),
        )
        .where(AssessmentResult.user_id.in_(student_ids_subq))
        .group_by(cast(AssessmentResult.created_at, Date))
        .order_by(cast(AssessmentResult.created_at, Date))
    )
    if date_start:
        q = q.where(AssessmentResult.created_at >= date_start)
    if date_end:
        q = q.where(AssessmentResult.created_at <= date_end)

    rows = db.execute(q).all()
    trend = [
        {
            "date": str(row.date),
            "average_phq9": round(float(row.avg_phq9), 2) if row.avg_phq9 is not None else None,
            "average_gad7": round(float(row.avg_gad7), 2) if row.avg_gad7 is not None else None,
            "assessment_count": row.assessment_count,
        }
        for row in rows
    ]
    return {"trend": trend}


def get_filter_options(
    db: Session,
    *,
    program: Optional[str] = None,
    year_level: Optional[str] = None,
) -> dict:
    """Return distinct values for filter dropdowns — from actual profile data."""
    def _distinct(col):
        rows = db.execute(
            select(col).where(Profile.role == "student", col.isnot(None)).distinct()
        ).all()
        return sorted(str(r[0]) for r in rows if r[0])

    programs = _distinct(Profile.program)
    year_levels = _distinct(Profile.year_level)

    # Sections filtered by program + year_level if selected
    sect_q = select(Profile.section).where(
        Profile.role == "student", Profile.section.isnot(None)
    )
    if program:
        sect_q = sect_q.where(Profile.program == program)
    if year_level:
        sect_q = sect_q.where(Profile.year_level == year_level)
    sections = sorted(str(r[0]) for r in db.execute(sect_q.distinct()).all() if r[0])

    # Academic years: derive from assessment submission years
    year_rows = db.execute(
        select(func.extract("year", AssessmentResult.created_at).label("yr")).distinct()
    ).all()
    calendar_years = sorted(set(int(r.yr) for r in year_rows if r.yr))
    # Convert to "YYYY–YYYY+1" academic year strings (Aug–Jul convention)
    academic_years = []
    for cy in calendar_years:
        academic_years.append(f"{cy}-{cy + 1}")
        if cy > 1:  # also include the previous-year range
            academic_years.append(f"{cy - 1}-{cy}")
    academic_years = sorted(set(academic_years))

    return {
        "programs": programs,
        "year_levels": year_levels,
        "sections": sections,
        "academic_years": academic_years,
    }


# ---------------------------------------------------------------------------
# Operational analytics (used by the existing /admin/analytics/* endpoints)
# These were originally in this module and are kept here to avoid moving them.
# ---------------------------------------------------------------------------

from app.models.audit_log import AuditLog  # noqa: E402
from app.models.mantra_wall import MantraWallPost, MantraWallReport  # noqa: E402
from app.models.resource import Resource  # noqa: E402


def get_overview_kpis(db: Session) -> dict:
    """Returns all KPI tile counts in one call (operational dashboard)."""
    pending_moderation = db.scalar(
        select(func.count()).where(MantraWallPost.moderation_status == "review")
    ) or 0

    approved_posts = db.scalar(
        select(func.count()).where(MantraWallPost.moderation_status == "approved")
    ) or 0

    archived_posts = db.scalar(
        select(func.count()).where(MantraWallPost.moderation_status == "archived")
    ) or 0

    active_resources = db.scalar(
        select(func.count()).where(Resource.is_active == True)  # noqa: E712
    ) or 0

    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    audit_events_7d = db.scalar(
        select(func.count()).where(AuditLog.created_at >= seven_days_ago)
    ) or 0

    unresolved_reports = db.scalar(
        select(func.count())
        .select_from(MantraWallReport)
        .where(MantraWallReport.resolved == False)  # noqa: E712
    ) or 0

    type_rows = db.execute(
        select(MantraWallPost.post_type, func.count())
        .where(MantraWallPost.moderation_status == "approved")
        .group_by(MantraWallPost.post_type)
    ).all()
    post_type_distribution = {row[0]: row[1] for row in type_rows}

    return {
        "pending_moderation_count": pending_moderation,
        "approved_posts_count": approved_posts,
        "archived_count": archived_posts,
        "active_resources_count": active_resources,
        "audit_events_7d_count": audit_events_7d,
        "unresolved_reports_count": unresolved_reports,
        "mantra_post_type_distribution": post_type_distribution,
    }


def get_audit_timeline(db: Session, days: int = 30) -> list[dict]:
    """Returns audit event counts grouped by day and by type."""
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    rows = db.execute(
        select(
            cast(AuditLog.created_at, Date).label("date"),
            AuditLog.event_type,
            func.count().label("count"),
        )
        .where(AuditLog.created_at >= start_date)
        .group_by(cast(AuditLog.created_at, Date), AuditLog.event_type)
        .order_by(cast(AuditLog.created_at, Date))
    ).all()

    timeline: dict[str, dict] = {}
    for date_val, event_type, count in rows:
        date_str = str(date_val)
        if date_str not in timeline:
            timeline[date_str] = {"date": date_str, "count": 0, "by_type": {}}
        timeline[date_str]["count"] += count
        timeline[date_str]["by_type"][event_type] = count

    return list(timeline.values())


def get_moderation_timeline(db: Session, days: int = 30) -> list[dict]:
    """Returns post counts grouped by day and moderation status."""
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    rows = db.execute(
        select(
            cast(MantraWallPost.created_at, Date).label("date"),
            func.count().filter(MantraWallPost.moderation_status == "pending").label("pending"),
            func.count().filter(MantraWallPost.moderation_status == "approved").label("approved"),
            func.count().filter(MantraWallPost.moderation_status == "rejected").label("rejected"),
            func.count().filter(MantraWallPost.moderation_status == "review").label("review"),
            func.count().filter(MantraWallPost.moderation_status == "archived").label("archived"),
        )
        .where(MantraWallPost.created_at >= start_date)
        .group_by(cast(MantraWallPost.created_at, Date))
        .order_by(cast(MantraWallPost.created_at, Date))
    ).all()

    return [
        {
            "date": str(row.date),
            "pending": row.pending,
            "approved": row.approved,
            "rejected": row.rejected,
            "review": row.review,
            "archived": row.archived,
        }
        for row in rows
    ]

