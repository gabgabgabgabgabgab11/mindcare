from dataclasses import dataclass
from enum import Enum


class SentimentLabel(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    UNCERTAIN = "uncertain"  # confidence too low to report a direction


@dataclass(frozen=True)
class SentimentResult:
    label: SentimentLabel
    confidence: float  # abs(compound), 0.0-1.0
    model_version: str