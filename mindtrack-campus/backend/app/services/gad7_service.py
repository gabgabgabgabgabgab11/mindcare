from dataclasses import dataclass
from enum import Enum

# Verbatim from the validated GAD-7 instrument (Spitzer, Kroenke,
# Williams & Löwe, 2006). Do not reword, reorder, or add/remove items.
# Recall period: "Over the last 2 weeks, how often have you been
# bothered by the following problems?"
GAD7_ITEMS: list[str] = [
    "Feeling nervous, anxious, or on edge",
    "Not being able to stop or control worrying",
    "Worrying too much about different things",
    "Trouble relaxing",
    "Being so restless that it is hard to sit still",
    "Becoming easily annoyed or irritable",
    "Feeling afraid as if something awful might happen",
]

RESPONSE_SCALE = {
    0: "Not at all",
    1: "Several days",
    2: "More than half the days",
    3: "Nearly every day",
}

# GAD-7, unlike PHQ-9, has no dedicated self-harm/suicidal-ideation
# item. Escalation here is based purely on the published severity
# cutoffs — see Basis and References, Phase 11, for the citation.
FURTHER_EVALUATION_THRESHOLD = 10  # Spitzer et al. (2006) recommended screening cutoff


class Gad7Severity(str, Enum):
    MINIMAL = "minimal"
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"


@dataclass(frozen=True)
class Gad7ScoringResult:
    total_score: int
    severity: Gad7Severity
    recommend_further_evaluation: bool  # score >= 10
    escalated: bool  # score >= 15 (severe band)


class InvalidGad7ResponsesError(ValueError):
    """Raised when submitted responses don't match the validated
    instrument's shape (wrong count or out-of-range values)."""


def _severity_for_score(total_score: int) -> Gad7Severity:
    # Published cutoffs (Spitzer et al., 2006): 5, 10, 15.
    if total_score <= 4:
        return Gad7Severity.MINIMAL
    if total_score <= 9:
        return Gad7Severity.MILD
    if total_score <= 14:
        return Gad7Severity.MODERATE
    return Gad7Severity.SEVERE


def score_gad7(responses: list[int]) -> Gad7ScoringResult:
    """Scores a completed GAD-7. Never trust a pre-computed score from
    the client — this is the only place a GAD-7 score is ever computed."""
    if len(responses) != len(GAD7_ITEMS):
        raise InvalidGad7ResponsesError(
            f"Expected {len(GAD7_ITEMS)} responses, got {len(responses)}"
        )
    if any(r not in (0, 1, 2, 3) for r in responses):
        raise InvalidGad7ResponsesError("Each response must be an integer 0-3")

    total_score = sum(responses)
    severity = _severity_for_score(total_score)

    return Gad7ScoringResult(
        total_score=total_score,
        severity=severity,
        recommend_further_evaluation=total_score >= FURTHER_EVALUATION_THRESHOLD,
        escalated=severity == Gad7Severity.SEVERE,
    )