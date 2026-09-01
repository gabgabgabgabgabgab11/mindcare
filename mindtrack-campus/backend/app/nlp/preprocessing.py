import re

_EMAIL_PATTERN = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
_URL_PATTERN = re.compile(r"https?://\S+|www\.\S+")
_PHONE_PATTERN = re.compile(r"\b(?:\+?\d[\d\-\s()]{7,}\d)\b")


def preprocess_text(raw_text: str) -> str:
    """Light preprocessing before sentiment analysis: strips
    identifying patterns (emails, URLs, phone-like numbers) and
    normalizes whitespace. This text is used transiently for scoring
    only — it is never stored anywhere (see journal_analysis model)."""
    text = _EMAIL_PATTERN.sub(" ", raw_text)
    text = _URL_PATTERN.sub(" ", text)
    text = _PHONE_PATTERN.sub(" ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text