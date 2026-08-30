from dataclasses import dataclass
from enum import Enum

# Verbatim from the validated PHQ-9 instrument (Kroenke, Spitzer &
# Williams, 2001). Do not reword, reorder, or add/remove items.
# Recall period: "Over the last 2 weeks, how often have you been
# bothered by any of the following problems?"
PHQ9_ITEMS: list[str] = [
    "Little interest or pleasure in doing things",
    "Feeling down, depressed, or hopeless",
    "Trouble falling or staying asleep, or sleeping too much",
    "Feeling tired or having little energy",
    "Poor appetite or overeating",
    "Feeling bad about yourself \u2014 or that you are a failure or "
    "have let yourself or your family down",
    "Trouble concentrating on things, such as reading the newspaper "
    "or watching television",
    "Moving or speaking so slowly that other people could have "
    "noticed? Or the opposite \u2014 being so fidgety or restless "
    "that you have been moving around a lot more than usual",
    "Thoughts that you would be better off dead or of hurting "
    "yourself in some way",
]

RESPONSE_SCALE = {
    0: "Not at all",
    1: "Several days",
    2: "More than half the days",
    3: "Nearly every day",
}

# Index of the self-harm/suicidal ideation item (0-based). Any nonzero
# response here triggers escalation regardless of total score.
SELF_HARM_ITEM_INDEX = 8


class Phq9Severity(str, Enum):
    MINIMAL = "minimal"
    MILD = "mild"
    MODERATE = "moderate"
    MODERATELY_SEVERE = "moderately_severe"
    SEVERE = "severe"


@dataclass(frozen=True)
class Phq9ScoringResult:
    total_score: int
    severity: Phq9Severity
    escalated: bool


class InvalidPhq9ResponsesError(ValueError):
    """Raised when submitted responses don't match the validated
    instrument's shape (wrong count or out-of-range values)."""


def _severity_for_score(total_score: int) -> Phq9Severity:
    # Published cutoffs (Kroenke et al., 2001).
    if total_score <= 4:
        return Phq9Severity.MINIMAL
    if total_score <= 9:
        return Phq9Severity.MILD
    if total_score <= 14:
        return Phq9Severity.MODERATE
    if total_score <= 19:
        return Phq9Severity.MODERATELY_SEVERE
    return Phq9Severity.SEVERE


def score_phq9(responses: list[int]) -> Phq9ScoringResult:
    """Scores a completed PHQ-9. Never trust a pre-computed score from
    the client — this is the only place a PHQ-9 score is ever computed."""
    if len(responses) != len(PHQ9_ITEMS):
        raise InvalidPhq9ResponsesError(
            f"Expected {len(PHQ9_ITEMS)} responses, got {len(responses)}"
        )
    if any(r not in (0, 1, 2, 3) for r in responses):
        raise InvalidPhq9ResponsesError("Each response must be an integer 0-3")

    total_score = sum(responses)
    severity = _severity_for_score(total_score)
    self_harm_flagged = responses[SELF_HARM_ITEM_INDEX] > 0
    escalated = self_harm_flagged or severity == Phq9Severity.SEVERE

    return Phq9ScoringResult(total_score=total_score, severity=severity, escalated=escalated)