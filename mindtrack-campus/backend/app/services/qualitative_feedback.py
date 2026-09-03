# ==========================================================================
# DRAFT WORDING — NOT YET PSYCHOLOGIST-REVIEWED
#
# Per ADR-006, the ARCHITECTURE of replacing numeric scores with
# qualitative feedback has been validated by the project's psychologist
# (Dr. Elle). The EXACT SENTENCES below have not. Treat this content as
# a functional placeholder, not clinically-approved copy, until it has
# been specifically reviewed and either approved or revised.
# ==========================================================================

PHQ9_QUALITATIVE_FEEDBACK = {
    "minimal": (
        "Your recent responses suggest minimal difficulty with your mood "
        "right now. Keep checking in regularly, and feel free to explore "
        "the Resources page anytime."
    ),
    "mild": (
        "Your responses suggest you may be experiencing some mild changes "
        "in your mood lately. Self-care resources and regular check-ins "
        "can help — visit the Resources page anytime."
    ),
    "moderate": (
        "Your responses suggest a moderate level of difficulty with your "
        "mood recently. It may help to explore the wellness resources "
        "available, and consider reaching out to a campus counselor for "
        "additional support."
    ),
    "moderately_severe": (
        "Your responses suggest a more significant level of difficulty "
        "with your mood right now. We encourage you to reach out to a "
        "campus counselor or trusted support resource soon."
    ),
    "severe": (
        "Your responses suggest a high level of difficulty with your mood "
        "right now. Please consider reaching out to a campus counselor or "
        "a mental health professional as soon as possible. If you are in "
        "crisis, please see the emergency resources provided."
    ),
}

GAD7_QUALITATIVE_FEEDBACK = {
    "minimal": (
        "Your responses suggest minimal difficulty with anxiety right now. "
        "Keep checking in regularly, and feel free to explore the "
        "Resources page anytime."
    ),
    "mild": (
        "Your responses suggest you may be experiencing some mild anxiety "
        "lately. Self-care resources and regular check-ins can help — "
        "visit the Resources page anytime."
    ),
    "moderate": (
        "Your responses suggest a moderate level of anxiety recently. It "
        "may help to explore the wellness resources available, and "
        "consider talking to a campus counselor for extra support."
    ),
    "severe": (
        "Your responses suggest a high level of anxiety right now. We "
        "encourage you to reach out to a campus counselor or a mental "
        "health professional soon. If you are in crisis, please see the "
        "emergency resources provided."
    ),
}


def get_phq9_feedback(severity_band: str) -> str:
    return PHQ9_QUALITATIVE_FEEDBACK.get(
        severity_band,
        "Thank you for completing this check-in. Visit the Resources page "
        "for support options anytime.",
    )


def get_gad7_feedback(severity_band: str) -> str:
    return GAD7_QUALITATIVE_FEEDBACK.get(
        severity_band,
        "Thank you for completing this check-in. Visit the Resources page "
        "for support options anytime.",
    )