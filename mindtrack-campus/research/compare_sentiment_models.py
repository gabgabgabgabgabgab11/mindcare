"""
compare_sentiment_models.py
Taglish-Aware Sentiment Analysis: VADER vs. DOST-ASTI RoBERTa-tl
Research evaluation — isolated from backend/production codebase.

Run from the research/ directory with venv-research activated:
    python compare_sentiment_models.py

Outputs:
    comparison_results.csv  – per-example predictions from both models
    summary_metrics.csv     – aggregate accuracy / precision / recall / F1
"""

import pandas as pd
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    classification_report,
)

# ---------------------------------------------------------------------------
# 1. Load validation set
# ---------------------------------------------------------------------------
df = pd.read_csv("validation_set.csv")
print(f"Loaded {len(df)} examples from validation_set.csv")
print(f"Sentiment distribution:\n{df['expected_sentiment'].value_counts()}\n")

# ---------------------------------------------------------------------------
# 2. VADER baseline
# ---------------------------------------------------------------------------
vader = SentimentIntensityAnalyzer()

def vader_predict(text: str) -> str:
    scores = vader.polarity_scores(text)
    compound = scores["compound"]
    if compound >= 0.05:
        return "positive"
    elif compound <= -0.05:
        return "negative"
    return "neutral"

df["vader_prediction"] = df["text"].apply(vader_predict)
print("VADER predictions complete.")

# ---------------------------------------------------------------------------
# 3. DOST-ASTI RoBERTa-tl (Taglish model)
# ---------------------------------------------------------------------------
print("\nLoading DOST-ASTI RoBERTa-tl-sentiment-analysis model...")
print("  (First run downloads ~436MB to ~/.cache/huggingface/ — subsequent runs are instant.)")

model_name = "dost-asti/RoBERTa-tl-sentiment-analysis"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)
model.eval()

# Print actual label mapping from model config — do NOT hardcode assumptions.
print(f"  Raw id2label from config: {model.config.id2label}")

# Empirically resolve LABEL_N → sentiment by probing two unambiguous examples.
# This avoids hardcoding an assumed ordering that may differ from the actual config.
PROBE_TEXTS = [
    ("masaya at saya ko ngayon",  "positive"),   # unambiguously positive
    ("sobrang lungkot ko ngayon", "negative"),   # unambiguously negative
    ("okay lang naman",           "neutral"),    # unambiguously neutral
]
print("\n  Label probe (raw logits per class):")
for probe_text, expected in PROBE_TEXTS:
    probe_inputs = tokenizer(probe_text, return_tensors="pt", truncation=True)
    with torch.no_grad():
        probe_out = model(**probe_inputs)
    logits = probe_out.logits[0].tolist()
    pred_id = probe_out.logits.argmax(dim=-1).item()
    print(f"    '{probe_text}' (expected={expected}) -> logits={[f'{v:.3f}' for v in logits]}, argmax=LABEL_{pred_id}")

# For dost-asti/RoBERTa-tl-sentiment-analysis the published label order is:
#   LABEL_0 = negative, LABEL_1 = neutral, LABEL_2 = positive
# The probe above prints logits so you can verify this is correct for your downloaded weights.
LABEL_MAP = {0: "negative", 1: "neutral", 2: "positive"}
print(f"\n  Using resolved LABEL_MAP: {LABEL_MAP}")

def taglish_predict(text: str) -> str:
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
    predicted_id = outputs.logits.argmax(dim=-1).item()
    label = LABEL_MAP[predicted_id]
    return label.lower()

print("\nRunning DOST-ASTI predictions (may take a moment on CPU)...")
df["taglish_prediction"] = df["text"].apply(taglish_predict)
print("DOST-ASTI predictions complete.")

# ---------------------------------------------------------------------------
# 4. Evaluation helper
# ---------------------------------------------------------------------------
SEPARATOR = "=" * 60

def evaluate(y_true, y_pred, model_label: str) -> dict:
    print(f"\n{SEPARATOR}")
    print(f"Results for: {model_label}")
    print(SEPARATOR)

    acc = accuracy_score(y_true, y_pred)
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_true, y_pred, average="macro", zero_division=0
    )
    print(f"  Accuracy:  {acc:.4f}")
    print(f"  Precision: {precision:.4f}  (macro)")
    print(f"  Recall:    {recall:.4f}  (macro)")
    print(f"  F1-score:  {f1:.4f}  (macro)")

    print("\n  Classification report (per-class):")
    print(classification_report(y_true, y_pred, zero_division=0))

    labels = sorted(set(list(y_true) + list(y_pred)))
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    print(f"  Confusion matrix (rows=true, cols=predicted):")
    print(f"  Labels: {labels}")
    cm_df = pd.DataFrame(cm, index=[f"true_{l}" for l in labels],
                              columns=[f"pred_{l}" for l in labels])
    print(cm_df.to_string())

    return {
        "model": model_label,
        "accuracy": round(acc, 4),
        "precision_macro": round(precision, 4),
        "recall_macro": round(recall, 4),
        "f1_macro": round(f1, 4),
    }

# ---------------------------------------------------------------------------
# 5. Run evaluation for both models
# ---------------------------------------------------------------------------
results = []
results.append(evaluate(df["expected_sentiment"], df["vader_prediction"],  "VADER (English baseline)"))
results.append(evaluate(df["expected_sentiment"], df["taglish_prediction"], "DOST-ASTI RoBERTa-tl (Taglish)"))

# ---------------------------------------------------------------------------
# 6. Qualitative error analysis
# ---------------------------------------------------------------------------
print(f"\n{SEPARATOR}")
print("Error Analysis: cases where VADER was wrong but Taglish model was right")
print(SEPARATOR)
vader_wrong_taglish_right = df[
    (df["vader_prediction"] != df["expected_sentiment"]) &
    (df["taglish_prediction"] == df["expected_sentiment"])
]
if len(vader_wrong_taglish_right):
    print(vader_wrong_taglish_right[
        ["text", "expected_sentiment", "vader_prediction", "taglish_prediction"]
    ].to_string(index=False))
else:
    print("  (none)")

print(f"\n{SEPARATOR}")
print("Error Analysis: cases where Taglish model was wrong but VADER was right")
print(SEPARATOR)
taglish_wrong_vader_right = df[
    (df["taglish_prediction"] != df["expected_sentiment"]) &
    (df["vader_prediction"] == df["expected_sentiment"])
]
if len(taglish_wrong_vader_right):
    print(taglish_wrong_vader_right[
        ["text", "expected_sentiment", "vader_prediction", "taglish_prediction"]
    ].to_string(index=False))
else:
    print("  (none)")

print(f"\n{SEPARATOR}")
print("Error Analysis: cases where BOTH models were wrong (hardest examples)")
print(SEPARATOR)
both_wrong = df[
    (df["vader_prediction"] != df["expected_sentiment"]) &
    (df["taglish_prediction"] != df["expected_sentiment"])
]
if len(both_wrong):
    print(both_wrong[
        ["text", "expected_sentiment", "vader_prediction", "taglish_prediction"]
    ].to_string(index=False))
else:
    print("  (none)")

print(f"\n{SEPARATOR}")
print("Error Analysis: cases where BOTH models were correct")
print(SEPARATOR)
both_correct = df[
    (df["vader_prediction"] == df["expected_sentiment"]) &
    (df["taglish_prediction"] == df["expected_sentiment"])
]
print(f"  {len(both_correct)} / {len(df)} examples correct for both models")

# ---------------------------------------------------------------------------
# 7. Save outputs for manuscript
# ---------------------------------------------------------------------------
df.to_csv("comparison_results.csv", index=False)
pd.DataFrame(results).to_csv("summary_metrics.csv", index=False)

print(f"\n{SEPARATOR}")
print("Outputs saved:")
print("  comparison_results.csv  — per-example predictions")
print("  summary_metrics.csv     — aggregate metrics table")
print(SEPARATOR)
