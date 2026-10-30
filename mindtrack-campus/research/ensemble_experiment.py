"""
ensemble_experiment.py
Rule-based ensemble: VADER + DOST-ASTI RoBERTa-tl.

Rule rationale (derived from first-run error analysis):
  - Taglish model is highly reliable on negative (recall=0.87) -> trust it when it says negative
  - VADER is reliable when it says positive via English loanwords -> trust it when it says positive
  - Otherwise defer to the Taglish model (stronger overall model)

Run from research/ with venv-research activated:
    python ensemble_experiment.py
"""

import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    classification_report,
    confusion_matrix,
)

df = pd.read_csv("comparison_results.csv")

# ---------------------------------------------------------------------------
# Ensemble rule
# ---------------------------------------------------------------------------
def ensemble_predict(row) -> str:
    if row["taglish_prediction"] == "negative":
        return "negative"               # Taglish model: high-confidence negative detector
    if row["vader_prediction"] == "positive":
        return "positive"               # VADER: reliable on English loanword positives
    return row["taglish_prediction"]    # Default to Taglish (stronger overall)

df["ensemble_prediction"] = df.apply(ensemble_predict, axis=1)

# ---------------------------------------------------------------------------
# Evaluation helper
# ---------------------------------------------------------------------------
SEP = "=" * 55

def evaluate(y_true, y_pred, label: str) -> dict:
    acc = accuracy_score(y_true, y_pred)
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_true, y_pred, average="macro", zero_division=0
    )
    print(f"\n{SEP}\n{label}\n{SEP}")
    print(f"  Accuracy:  {acc:.4f}")
    print(f"  Precision: {precision:.4f}  (macro)")
    print(f"  Recall:    {recall:.4f}  (macro)")
    print(f"  F1-score:  {f1:.4f}  (macro)")
    print("\n  Classification report:")
    print(classification_report(y_true, y_pred, zero_division=0))
    labels = sorted(set(list(y_true) + list(y_pred)))
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    cm_df = pd.DataFrame(cm,
                         index=[f"true_{l}" for l in labels],
                         columns=[f"pred_{l}" for l in labels])
    print("  Confusion matrix:")
    print(cm_df.to_string())
    return {"model": label, "accuracy": round(acc,4),
            "precision_macro": round(precision,4),
            "recall_macro": round(recall,4),
            "f1_macro": round(f1,4)}

# ---------------------------------------------------------------------------
# Run all three for side-by-side comparison
# ---------------------------------------------------------------------------
results = []
results.append(evaluate(df["expected_sentiment"], df["vader_prediction"],   "VADER (baseline)"))
results.append(evaluate(df["expected_sentiment"], df["taglish_prediction"], "DOST-ASTI RoBERTa-tl"))
results.append(evaluate(df["expected_sentiment"], df["ensemble_prediction"],"Ensemble (rule-based)"))

# ---------------------------------------------------------------------------
# Delta table
# ---------------------------------------------------------------------------
print(f"\n{SEP}")
print("Summary comparison")
print(SEP)
summary = pd.DataFrame(results)
print(summary.to_string(index=False))

taglish_row  = summary[summary["model"] == "DOST-ASTI RoBERTa-tl"].iloc[0]
ensemble_row = summary[summary["model"] == "Ensemble (rule-based)"].iloc[0]
print(f"\n  Ensemble vs. Taglish model alone:")
print(f"    Accuracy delta:  {ensemble_row['accuracy']  - taglish_row['accuracy']:+.4f}")
print(f"    F1 delta:        {ensemble_row['f1_macro']  - taglish_row['f1_macro']:+.4f}")
print(f"    Recall delta:    {ensemble_row['recall_macro'] - taglish_row['recall_macro']:+.4f}")

# ---------------------------------------------------------------------------
# Per-example inspection: where ensemble changed the outcome
# ---------------------------------------------------------------------------
print(f"\n{SEP}")
print("Cases where ensemble IMPROVED over Taglish model")
print(SEP)
improved = df[
    (df["taglish_prediction"] != df["expected_sentiment"]) &
    (df["ensemble_prediction"] == df["expected_sentiment"])
]
if len(improved):
    print(improved[["text","expected_sentiment","vader_prediction",
                     "taglish_prediction","ensemble_prediction"]].to_string(index=False))
else:
    print("  (none)")

print(f"\n{SEP}")
print("Cases where ensemble HURT vs. Taglish model")
print(SEP)
hurt = df[
    (df["taglish_prediction"] == df["expected_sentiment"]) &
    (df["ensemble_prediction"] != df["expected_sentiment"])
]
if len(hurt):
    print(hurt[["text","expected_sentiment","vader_prediction",
                "taglish_prediction","ensemble_prediction"]].to_string(index=False))
else:
    print("  (none)")

# ---------------------------------------------------------------------------
# Save
# ---------------------------------------------------------------------------
summary.to_csv("ensemble_summary_metrics.csv", index=False)
df.to_csv("ensemble_results.csv", index=False)
print(f"\n{SEP}")
print("Saved: ensemble_summary_metrics.csv, ensemble_results.csv")
print(SEP)
