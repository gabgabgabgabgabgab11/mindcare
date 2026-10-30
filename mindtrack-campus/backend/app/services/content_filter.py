"""Content filtering service for MantraWall posts.

Uses VADER sentiment analysis (already in the codebase for journal NLP)
plus a curated keyword blocklist to determine a post's initial moderation
status at submission time.

Tiering:
  - Auto-Approve: clearly positive sentiment, no blocklist hit
  - Auto-Review:  ambiguous/neutral/uncertain sentiment
  - Auto-Reject:  clearly negative sentiment OR blocklist hit

See ADR-011 (Tiered Auto-Moderation) for the design rationale.
"""
import re
from typing import Tuple

from app.nlp.analyzer import get_compound_score
from app.nlp.preprocessing import preprocess_text


# ---------------------------------------------------------------------------
# VADER thresholds (tunable constants)
# ---------------------------------------------------------------------------

# Posts scoring at or above this are auto-approved.
AUTO_APPROVE_THRESHOLD = 0.3

# Posts scoring at or below this are auto-rejected (even without blocklist).
AUTO_REJECT_THRESHOLD = -0.2


# ---------------------------------------------------------------------------
# Keyword blocklist  (word-boundary matched to avoid false positives)
# ---------------------------------------------------------------------------
# Curated for a Filipino campus mental-health context.  Covers:
#   - English profanity / slurs
#   - Filipino profanity / slurs
#   - Self-harm / crisis indicators
#
# NOTE: This is a safety net, not the primary filter.  VADER handles
# sentiment; the blocklist catches content that might score neutral
# but is still clearly inappropriate (e.g. a slur embedded in an
# otherwise neutral sentence).

_BLOCKLIST_WORDS: set[str] = {
    # -- English profanity --
    "fuck", "shit", "bitch", "bastard", "asshole", "dick",
    "cunt", "whore", "slut", "damn", "piss",
    # -- English slurs --
    "nigger", "nigga", "faggot", "fag", "retard", "retarded",
    "tranny",
    # -- Filipino profanity --
    "putangina", "putang ina", "puta", "gago", "gaga",
    "tangina", "tang ina", "tarantado", "tarantada",
    "bobo", "tanga", "ulol", "leche", "punyeta",
    "pakyu", "hinayupak", "hayop ka",
    # -- Self-harm / crisis indicators --
    "kill myself", "want to die", "suicide", "suicidal",
    "self-harm", "self harm", "cutting myself",
    "end my life", "end it all", "no reason to live",
}

# Pre-compile a single regex for speed.  Each phrase is escaped and
# wrapped in word-boundary anchors.
_BLOCKLIST_PATTERN = re.compile(
    "|".join(r"\b" + re.escape(w) + r"\b" for w in _BLOCKLIST_WORDS),
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def determine_moderation_status(content: str) -> Tuple[str, str]:
    """Analyse *content* and return ``(moderation_status, filter_reason)``.

    Returns one of:
      * ``("approved",  "auto-approved: positive sentiment (compound={score})")``
      * ``("review",    "auto-review: ambiguous sentiment (compound={score})")``
      * ``("rejected",  "auto-rejected: negative sentiment (compound={score})")``
      * ``("rejected",  "auto-rejected: content policy violation")``

    The *filter_reason* is stored alongside the post so admins can see
    why the system made its decision.
    """

    # --- Step 1: blocklist check (takes priority over sentiment) ---
    if _BLOCKLIST_PATTERN.search(content):
        return ("rejected", "auto-rejected: content policy violation")

    # --- Step 2: VADER sentiment analysis ---
    cleaned = preprocess_text(content)
    compound = get_compound_score(cleaned)

    if compound >= AUTO_APPROVE_THRESHOLD:
        return ("approved", f"auto-approved: positive sentiment (compound={compound:.3f})")

    if compound <= AUTO_REJECT_THRESHOLD:
        return ("rejected", f"auto-rejected: negative sentiment (compound={compound:.3f})")

    # Everything in between is ambiguous — human review needed.
    return ("review", f"auto-review: ambiguous sentiment (compound={compound:.3f})")
