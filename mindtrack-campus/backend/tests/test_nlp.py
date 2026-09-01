from app.nlp.preprocessing import preprocess_text
from app.nlp.schemas import SentimentLabel
from app.nlp.service import analyze_sentiment


def test_preprocessing_strips_email():
    result = preprocess_text("Contact me at student@example.com please")
    assert "student@example.com" not in result


def test_preprocessing_strips_url():
    result = preprocess_text("Check this out https://example.com/page")
    assert "https://example.com/page" not in result


def test_preprocessing_normalizes_whitespace():
    result = preprocess_text("too   many\n\nspaces")
    assert result == "too many spaces"


def test_clearly_positive_text_is_labeled_positive():
    result = analyze_sentiment("I am so happy and grateful today, everything is wonderful!")
    assert result.label == SentimentLabel.POSITIVE
    assert result.confidence >= 0.15


def test_clearly_negative_text_is_labeled_negative():
    result = analyze_sentiment("I feel terrible, hopeless, and miserable today.")
    assert result.label == SentimentLabel.NEGATIVE
    assert result.confidence >= 0.15


def test_weak_signal_text_is_uncertain_not_neutral():
    # A very short, mild phrase should produce a low-confidence result
    # rather than being confidently reported as "neutral".
    result = analyze_sentiment("okay")
    assert result.confidence < 0.15
    assert result.label == SentimentLabel.UNCERTAIN


def test_result_never_contains_raw_text():
    result = analyze_sentiment("This is a private sentence with details.")
    result_fields = vars(result)
    for value in result_fields.values():
        if isinstance(value, str):
            assert "private sentence with details" not in value


def test_model_version_is_recorded():
    result = analyze_sentiment("Feeling alright.")
    assert result.model_version == "vader-lexicon-v1"