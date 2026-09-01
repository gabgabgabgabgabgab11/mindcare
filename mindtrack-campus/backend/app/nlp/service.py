from app.nlp.analyzer import MODEL_VERSION, get_compound_score
from app.nlp.preprocessing import preprocess_text
from app.nlp.schemas import SentimentLabel, SentimentResult


# Standard VADER classification thresholds
POSITIVE_THRESHOLD = 0.05
NEGATIVE_THRESHOLD = -0.05

# Project-specific threshold for weak sentiment signals
CONFIDENCE_THRESHOLD = 0.15

# Very short text lacks enough context for reliable interpretation
MIN_WORDS_FOR_CONFIDENT_SENTIMENT = 3


def analyze_sentiment(raw_text: str) -> SentimentResult:
    """Analyzes journal text for sentiment.

    The input text is used transiently — nothing from it is retained
    in the returned SentimentResult.
    """

    cleaned = preprocess_text(raw_text)

    compound = get_compound_score(cleaned)
    confidence = abs(compound)

    word_count = len(cleaned.split())

    # Very short text should not be interpreted confidently.
    if word_count < MIN_WORDS_FOR_CONFIDENT_SENTIMENT:
        return SentimentResult(
            label=SentimentLabel.UNCERTAIN,
            confidence=round(min(confidence, 0.149), 3),
            model_version=MODEL_VERSION,
        )

    if confidence < CONFIDENCE_THRESHOLD:
        label = SentimentLabel.UNCERTAIN

    elif compound >= POSITIVE_THRESHOLD:
        label = SentimentLabel.POSITIVE

    elif compound <= NEGATIVE_THRESHOLD:
        label = SentimentLabel.NEGATIVE

    else:
        label = SentimentLabel.NEUTRAL

    return SentimentResult(
        label=label,
        confidence=round(confidence, 3),
        model_version=MODEL_VERSION,
    )