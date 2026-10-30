"""Pydantic schemas for the Wellness Analytics admin endpoints.

All responses are aggregate-only. No individual student identifiers,
scores, or wellness records are ever included in these schemas.
"""
from typing import Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Filter params (shared across endpoints)
# ---------------------------------------------------------------------------

class WellnessAnalyticsFilters(BaseModel):
    """Query parameters accepted by all wellness analytics endpoints."""
    program: Optional[str] = None
    year_level: Optional[str] = None
    section: Optional[str] = None
    academic_year: Optional[str] = None   # e.g. "2026-2027"
    semester: Optional[str] = None         # "1st", "2nd", "summer"
    start_date: Optional[str] = None       # ISO date string
    end_date: Optional[str] = None         # ISO date string


# ---------------------------------------------------------------------------
# Overview KPIs
# ---------------------------------------------------------------------------

class WellnessOverviewResponse(BaseModel):
    total_students: int
    assessment_count: int
    assessment_participation_rate: Optional[float]   # 0–100, None if no students
    checkin_count: int
    checkin_participation_rate: Optional[float]
    journal_count: int
    journal_participation_rate: Optional[float]
    follow_up_flags: int
    cohort_hidden: bool = Field(
        default=False,
        description="True when group size is below the privacy threshold; "
                    "wellness scores are withheld in that case.",
    )
    min_cohort_size: int = Field(
        default=5,
        description="The configured minimum group size required to display wellness metrics.",
    )


# ---------------------------------------------------------------------------
# Screening averages + severity distributions
# ---------------------------------------------------------------------------

class SeverityDistribution(BaseModel):
    minimal: int = 0
    mild: int = 0
    moderate: int = 0
    moderately_severe: int = 0   # PHQ-9 only
    severe: int = 0


class WellnessScreeningResponse(BaseModel):
    sample_size: int
    average_phq9: Optional[float]   # None when sample_size == 0
    average_gad7: Optional[float]
    phq9_distribution: SeverityDistribution
    gad7_distribution: SeverityDistribution
    cohort_hidden: bool = False


# ---------------------------------------------------------------------------
# Group-level breakdown (program / year / section)
# ---------------------------------------------------------------------------

class GroupMetric(BaseModel):
    group_name: str
    student_count: int
    assessment_count: int
    average_phq9: Optional[float]
    average_gad7: Optional[float]
    cohort_hidden: bool = False


class GroupAnalyticsResponse(BaseModel):
    groups: list[GroupMetric]


# ---------------------------------------------------------------------------
# Historical trend (time-series)
# ---------------------------------------------------------------------------

class TrendPoint(BaseModel):
    date: str           # "YYYY-MM-DD"
    average_phq9: Optional[float]
    average_gad7: Optional[float]
    assessment_count: int


class WellnessTrendResponse(BaseModel):
    trend: list[TrendPoint]


# ---------------------------------------------------------------------------
# Filter option lists (populated from actual DB values)
# ---------------------------------------------------------------------------

class FilterOptionsResponse(BaseModel):
    programs: list[str]
    year_levels: list[str]
    sections: list[str]
    academic_years: list[str]
