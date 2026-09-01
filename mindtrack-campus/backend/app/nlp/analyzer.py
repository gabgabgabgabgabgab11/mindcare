from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# VADER (Valence Aware Dictionary and sEntiment Reasoner; Hutto &
# Gilbert, 2014) — a lexicon- and rule-based model, chosen per the
# project's NLP Architecture decision to start with the simplest
# explainable approach rather than a trained model. See Basis and
# References, Phase 13, for the full citation and threshold sources.
_analyzer = SentimentIntensityAnalyzer()

MODEL_VERSION = "vader-lexicon-v1"


def get_compound_score(text: str) -> float:
    """Returns VADER's compound score in [-1, 1]. This is the only
    function that touches the underlying library — kept isolated so
    the model/library could be swapped later without touching
    service.py's confidence-gating or persistence logic."""
    scores = _analyzer.polarity_scores(text)
    return scores["compound"]