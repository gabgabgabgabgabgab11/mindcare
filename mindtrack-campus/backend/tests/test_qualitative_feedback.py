from app.services.qualitative_feedback import get_gad7_feedback, get_phq9_feedback


def test_phq9_feedback_covers_every_severity_band():
    for band in ["minimal", "mild", "moderate", "moderately_severe", "severe"]:
        feedback = get_phq9_feedback(band)
        assert isinstance(feedback, str)
        assert len(feedback) > 0
        assert not any(char.isdigit() for char in feedback)  # no numbers, per ADR-006


def test_gad7_feedback_covers_every_severity_band():
    for band in ["minimal", "mild", "moderate", "severe"]:
        feedback = get_gad7_feedback(band)
        assert isinstance(feedback, str)
        assert len(feedback) > 0
        assert not any(char.isdigit() for char in feedback)


def test_unknown_band_returns_safe_fallback_not_an_error():
    feedback = get_phq9_feedback("some_unexpected_value")
    assert isinstance(feedback, str)
    assert len(feedback) > 0