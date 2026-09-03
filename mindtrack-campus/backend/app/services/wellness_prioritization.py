from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional

# ==========================================================================
# CLINICAL VALIDATION STATUS: DRAFT — PENDING EXPERT VALIDATION
#
# This rule set combines PHQ-9, GAD-7, and NLP sentiment-trend outputs
# into a single wellness-priority signal. Each individual input has its
# own basis (see Basis and References, Phases 10/11/13), but the
# COMBINATION LOGIC below is a project-authored design choice that has
# NOT yet been explicitly reviewed by the project's psychologist
# validator. Per Master Backend Prompt Section 19, this is deliberately
# implemented as a clearly-labeled, configurable rule set rather than
# presented as if it were itself a validated clinical instrument.
#
# Do not remove or soften this labeling without an explicit,
# documented psychologist sign-off on THIS SPECIFIC combination logic.
# ==========================================================================

RULE_VERSION = "wellness-priority-rules-draft-v1-pending-validation"

# How many of the most recent journal sentiment analyses to consider
# when computing a "negative trend." Configurable, not clinically derived.
SENTIMENT_TREND_WINDOW = 5

# Proportion of recent non-uncertain journal entries that must be
# negative to count as a contributing factor. Configurable.
NEGATIVE_TREND_THRESHOLD = 0.5


class WellnessPriority(str, Enum):
    INSUFFICIENT_DATA = "insufficient_data"
    LOW = "low"
    MODERATE = "moderate"
    ELEVATED = "elevated"


@dataclass(frozen=True)
class AssessmentSnapshot:
    """Minimal, already-computed data this module needs — never raw
    responses, never raw journal text. Consumes only outputs of
    Phases 10/11/13."""
    severity_band: Optional[str] = None
    escalated: bool = False


@dataclass(frozen=True)
class WellnessPriorityResult:
    priority: WellnessPriority
    contributing_factors: List[str] = field(default_factory=list)
    rule_version: str = RULE_VERSION
    clinical_validation_status: str = (
        "Draft rule set — combination logic pending explicit psychologist "
        "validation. Individual instruments (PHQ-9, GAD-7) are validated; "
        "this combination is a system design choice, not itself a "
        "clinical determination."
    )


def _sentiment_negative_ratio(recent_sentiment_labels: List[str]) -> Optional[float]:
    """Returns the proportion of negative labels among recent
    non-uncertain entries, or None if there's no usable signal."""
    usable = [s for s in recent_sentiment_labels if s != "uncertain"]
    if not usable:
        return None
    negative_count = sum(1 for s in usable if s == "negative")
    return negative_count / len(usable)


def compute_wellness_priority(
    phq9: Optional[AssessmentSnapshot],
    gad7: Optional[AssessmentSnapshot],
    recent_sentiment_labels: List[str],
) -> WellnessPriorityResult:
    """Pure function — no database access, fully unit-testable.
    Combines already-derived signals only."""
    factors: List[str] = []

    if phq9 is None and gad7 is None and not recent_sentiment_labels:
        return WellnessPriorityResult(
            priority=WellnessPriority.INSUFFICIENT_DATA,
            contributing_factors=["No assessment or journal data available yet"],
        )

    # --- Tier 1: ELEVATED triggers ---
    if phq9 is not None and phq9.escalated:
        factors.append("PHQ-9 escalation triggered (self-harm item and/or severe band)")
    if gad7 is not None and gad7.escalated:
        factors.append("GAD-7 escalation triggered (severe band)")
    if phq9 is not None and phq9.severity_band in ("moderately_severe", "severe"):
        factors.append(f"PHQ-9 severity band: {phq9.severity_band}")
    if gad7 is not None and gad7.severity_band == "severe":
        factors.append(f"GAD-7 severity band: {gad7.severity_band}")

    if factors:
        return WellnessPriorityResult(priority=WellnessPriority.ELEVATED, contributing_factors=factors)

    # --- Tier 2: MODERATE triggers ---
    if phq9 is not None and phq9.severity_band == "moderate":
        factors.append("PHQ-9 severity band: moderate")
    if gad7 is not None and gad7.severity_band == "moderate":
        factors.append("GAD-7 severity band: moderate")

    negative_ratio = _sentiment_negative_ratio(recent_sentiment_labels[:SENTIMENT_TREND_WINDOW])
    if negative_ratio is not None and negative_ratio >= NEGATIVE_TREND_THRESHOLD:
        count = len(recent_sentiment_labels[:SENTIMENT_TREND_WINDOW])
        factors.append(
            f"{round(negative_ratio * count)} of last {count} journal entries trended negative"
        )

    if factors:
        return WellnessPriorityResult(priority=WellnessPriority.MODERATE, contributing_factors=factors)

    # --- Tier 3: LOW ---
    return WellnessPriorityResult(
        priority=WellnessPriority.LOW,
        contributing_factors=["No elevated or moderate indicators found in available data"],
    )