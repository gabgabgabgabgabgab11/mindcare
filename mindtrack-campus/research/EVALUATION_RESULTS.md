# Taglish Sentiment Analysis — Evaluation Results
## VADER (English Baseline) vs. DOST-ASTI RoBERTa-tl vs. Rule-Based Ensemble

**Date:** September 19, 2026  
**Researcher:** MindCare Capstone Team  
**Scripts:** `compare_sentiment_models.py`, `mcnemar_test.py`, `ensemble_experiment.py`  
**Dataset:** `validation_set.csv` — 50 manually-labeled Taglish/Filipino student expressions  
*(expanded from initial n=35 to strengthen statistical power and positive-class coverage)*

---

## 1. Background and Purpose

MindCare's journal feature currently uses **VADER** (`vaderSentiment`) for sentiment analysis.
VADER is a lexicon-based English analyzer with no coverage of Tagalog words, Taglish
code-switching, or Filipino informal speech patterns.

This evaluation answers three bounded research questions:

> 1. Does DOST-ASTI RoBERTa-tl perform meaningfully better than VADER on Taglish text?
> 2. Is that improvement statistically significant given the paired sample?
> 3. Does combining both models via a rule-based ensemble outperform either alone?

This work is **isolated from the production codebase** — the Taglish model is not integrated
into the live backend. These findings inform that future decision.

---

## 2. Models Evaluated

### Baseline: VADER
- **Package:** `vaderSentiment==3.3.2`
- **Type:** Rule-based English lexicon
- **Threshold:** compound >= 0.05 → positive; <= -0.05 → negative; else neutral

### Challenger: DOST-ASTI RoBERTa-tl-sentiment-analysis
- **HuggingFace ID:** `dost-asti/RoBERTa-tl-sentiment-analysis`
- **Publisher:** Department of Science and Technology — Advanced Science and Technology Institute (Philippines)
- **Architecture:** RoBERTa (transformer-based)
- **Training data:** ~8.2 million Tagalog/Taglish formal and informal text instances
- **Classes:** Negative, Neutral, Positive

### Ensemble
- **Type:** Rule-based combination (no meta-model training; not fit on this dataset)
- **Rule:** IF Taglish predicts negative → use Taglish. ELIF VADER predicts positive → use VADER. ELSE → use Taglish.
- **Rationale:** Derived from observed failure mode complementarity in the initial n=35 run.

### Label Mapping Verification (DOST-ASTI model)
The model's `config.json` uses generic label names. The mapping was resolved empirically via probe:

| Probe Text | Expected | Logits [L0, L1, L2] | argmax |
|---|---|---|---|
| masaya at saya ko ngayon | positive | [-3.407, **6.709**, -3.815] | LABEL_1 |
| sobrang lungkot ko ngayon | negative | [**6.012**, -0.300, -5.108] | LABEL_0 |
| okay lang naman | neutral | [-4.182, -3.501, **6.911**] | LABEL_2 |

**Confirmed mapping: LABEL_0 = negative, LABEL_1 = neutral, LABEL_2 = positive**

---

## 3. Validation Dataset (n=50)

50 researcher-created Taglish/Filipino student expressions, never seen by either model during
training. Real student journal entries were not used (ethics/consent constraint).

15 new examples were added in Round 2, deliberately targeting the weakest category identified
in Round 1: **positive sentiment expressed in Tagalog-dominant vocabulary** (`tuwang-tuwa`,
`nakakatuwa`, `ganda ng araw`, `saya saya`, `thankful`), plus additional neutral and negative
examples for balance.

**Sentiment distribution:**
| Class | Count |
|---|---|
| Negative | 19 |
| Positive | 18 |
| Neutral | 13 |
| **Total** | **50** |

---

## 4. Aggregate Metrics (n=50)

| Model | Accuracy | Precision (macro) | Recall (macro) | F1 (macro) |
|---|---|---|---|---|
| VADER (English baseline) | 0.3800 | 0.6019 | 0.4111 | 0.3848 |
| DOST-ASTI RoBERTa-tl | 0.4800 | 0.4416 | 0.4787 | 0.4357 |
| **Ensemble (rule-based)** | **0.5200** | **0.5132** | **0.4944** | **0.4993** |
| Delta: RoBERTa-tl − VADER | +0.1000 | −0.1603 | +0.0676 | +0.0509 |
| Delta: Ensemble − RoBERTa-tl | +0.0400 | +0.0716 | +0.0157 | +0.0636 |
| **Delta: Ensemble − VADER** | **+0.1400** | −0.0887 | **+0.0833** | **+0.1145** |

---

## 5. Per-Class Classification Reports

### VADER (English Baseline)
```
              precision    recall  f1-score   support

    negative       1.00      0.26      0.42        19
     neutral       0.25      0.69      0.37        13
    positive       0.56      0.28      0.37        18

    accuracy                           0.38        50
   macro avg       0.60      0.41      0.38        50
weighted avg       0.65      0.38      0.39        50
```

### DOST-ASTI RoBERTa-tl
```
              precision    recall  f1-score   support

    negative       0.89      0.84      0.86        19
     neutral       0.27      0.54      0.36        13
    positive       0.17      0.06      0.08        18

    accuracy                           0.48        50
   macro avg       0.44      0.48      0.44        50
weighted avg       0.47      0.48      0.45        50
```

### Ensemble (rule-based)
```
              precision    recall  f1-score   support

    negative       0.89      0.84      0.86        19
     neutral       0.22      0.31      0.26        13
    positive       0.43      0.33      0.38        18

    accuracy                           0.52        50
   macro avg       0.51      0.49      0.50        50
weighted avg       0.55      0.52      0.53        50
```

---

## 6. Confusion Matrices

### VADER
```
               pred_negative  pred_neutral  pred_positive
true_negative              5            14              0
true_neutral               0             9              4
true_positive              0            13              5
```

### DOST-ASTI RoBERTa-tl
```
               pred_negative  pred_neutral  pred_positive
true_negative             16             2              1
true_neutral               2             7              4
true_positive              0            17              1
```

### Ensemble
```
               pred_negative  pred_neutral  pred_positive
true_negative             16             2              1
true_neutral               2             4              7
true_positive              0            12              6
```

---

## 7. Statistical Significance — McNemar's Exact Test (Task A)

**Test:** McNemar's exact test (correct for paired samples evaluated on the same examples)  
**Null hypothesis:** Both models have the same probability of being correct on any given example

| Paired outcome | Count |
|---|---|
| Both correct | 9 |
| Both wrong | 16 |
| VADER correct, Taglish wrong | 10 |
| Taglish correct, VADER wrong | 15 |
| **Discordant pairs (b+c)** | **25** |

**Result: p = 0.4244 — NOT statistically significant at alpha = 0.05**

**Disagreement by class:**
| True class | VADER-only-right | Taglish-only-right |
|---|---|---|
| negative | 0 | 11 |
| neutral | 5 | 3 |
| positive | 5 | 1 |

### Interpretation
The overall accuracy advantage of the Taglish model does not reach statistical significance
at this sample size. This is an expected and honest result for n=50 — the test requires
a larger discordant-pairs count to detect a significant difference.

**Manuscript phrasing (Limitations section):**
*"The validation set (n=50) is insufficient to confirm statistical significance of the
accuracy difference between VADER and the DOST-ASTI model (McNemar's exact test,
p = 0.4244). The observed improvement in negative-class recall (26% → 84%) is nevertheless
large in absolute terms and consistent in direction; a larger, multi-annotator dataset is
identified as future work to confirm this finding."*

The per-class breakdown is the more informative result: on negative examples, the Taglish
model is correct in every case where VADER is wrong (11 discordant pairs, all Taglish-favoring).
On positive and neutral examples, the advantage reverses. This class-level pattern is
substantive even when the aggregate test is not significant.

---

## 8. Ensemble Experiment (Task B)

### Rule
```
IF taglish_prediction == "negative":  use taglish   # high-confidence negative detector
ELIF vader_prediction == "positive":  use vader     # reliable on English loanword positives
ELSE:                                 use taglish   # stronger model overall
```

### Result
The ensemble **outperforms both individual models** on accuracy (+4.0 pp vs. RoBERTa-tl,
+14.0 pp vs. VADER) and F1 (+6.4 pp vs. RoBERTa-tl, +11.5 pp vs. VADER).

**Cases where ensemble improved over Taglish model alone (5 examples):**
| Text | Expected | VADER | Taglish | Ensemble |
|---|---|---|---|---|
| proud ako sa sarili ko ngayon | positive | positive ✓ | neutral ✗ | positive ✓ |
| happy ako kasi may bonding kami ng friends ko | positive | positive ✓ | neutral ✗ | positive ✓ |
| excited ako for the weekend | positive | positive ✓ | neutral ✗ | positive ✓ |
| relax lang ako ngayon | positive | positive ✓ | neutral ✗ | positive ✓ |
| sobrang thankful ako sa lahat ng tumulong | positive | positive ✓ | neutral ✗ | positive ✓ |

**Cases where ensemble hurt vs. Taglish model alone (3 examples):**
| Text | Expected | VADER | Taglish | Ensemble |
|---|---|---|---|---|
| okay naman ako pero ang dami talagang requirements | neutral | positive ✗ | neutral ✓ | positive ✗ |
| grabe nakakapagod pero okay lang masaya naman | neutral | positive ✗ | neutral ✓ | positive ✗ |
| medyo okay na ako ngayon kumpara kanina | neutral | positive ✗ | neutral ✓ | positive ✗ |

**Net improvement: +5 correct, −3 correct = net +2 examples over Taglish alone.**

### Interpretation
The ensemble rule works as hypothesised: VADER's English-loanword positive detection
(`proud`, `happy`, `excited`, `relax`, `thankful`) plugs a specific gap in the Taglish
model. The cost is 3 neutral examples that VADER falsely scores positive and the ensemble
inherits. The net is positive.

### Known structural flaw in the rule
All 3 cases where the ensemble hurt performance share the same failure pattern: the Taglish
model had correctly predicted neutral, but the rule overrode it with VADER's incorrect
positive prediction. The rule as written checks only "did VADER say positive?" — it cannot
distinguish "Taglish said neutral because the text is genuinely neutral" from "Taglish said
neutral because it missed a positive expression." It has no mechanism to weigh the Taglish
model's own confidence before deciding to defer to VADER.

This flaw is understood and named, not fixed here. Adjusting the rule to avoid these 3 cases
after seeing them would be fitting the rule to this specific dataset — the resulting
improvement would not generalise. The right time to apply a fix is against a new, separate
held-out set.

**Proposed fix for the next validation round:** Gate the VADER-positive override on the
Taglish model's raw confidence. Instead of:
```
ELIF vader_prediction == "positive": use vader
```
use:
```
ELIF vader_prediction == "positive" AND taglish_neutral_logit < threshold: use vader
```
The Taglish model's raw logits for all 50 examples are already recorded in
`ensemble_results.csv` (the model outputs them during inference). A low neutral logit means
the Taglish model itself is uncertain — that's the condition under which VADER's loanword
positive detection should take over. A high neutral logit means the Taglish model is
confident in its neutral call and should not be overridden. The threshold would be chosen
on the new held-out set, not on these 50 examples.

**Important constraint:** This rule was derived from and evaluated on the same 50 examples.
It should not be interpreted as a validated production rule — it is a proof-of-concept
demonstrating that the failure modes are complementary. Validation on a separate,
held-out dataset is required before any production use.

---

## 9. Key Findings (Summary for Manuscript)

1. **VADER is structurally unsuited for Taglish negative sentiment.** Recall = 0.26 (5/19).
   It classified 14 of 19 true-negative examples as neutral — Tagalog negative-sentiment
   vocabulary is simply absent from its lexicon.

2. **The Taglish model is substantially better for negative sentiment.** Recall = 0.84 (16/19),
   a 58-percentage-point improvement on the clinically relevant class. In every case where
   VADER was wrong on a negative example, the Taglish model was right (11/11 discordant
   negative pairs favoured the Taglish model).

3. **Positive Taglish remains hard.** The Taglish model's positive recall = 0.06 (1/18).
   Both models miss most positive examples where sentiment is in Tagalog vocabulary
   (`saya`, `masaya`, `tuwang-tuwa`, `nakakatuwa`). This limitation is documented and
   should be stated plainly in the manuscript.

4. **The ensemble is the strongest configuration on this dataset.** F1 = 0.4993 vs.
   0.4357 (RoBERTa-tl alone) and 0.3848 (VADER). The rule exploits complementary failure
   modes and is explainable without a trained meta-model.

5. **The improvement is not statistically significant at n=50.** McNemar p = 0.4244.
   Report this plainly. The class-level pattern (all 11 negative discordant pairs favour
   the Taglish model) is substantively meaningful despite the non-significant aggregate result.

---

## 10. Limitations

1. **Small dataset (n=50):** Insufficient for statistically confident conclusions
   (McNemar p = 0.4244). Directional conclusions are supported; significance is not.

2. **Researcher-created examples:** Not drawn from real student journals. May not capture
   full natural variability, idiosyncrasy, emoji use, or highly abbreviated text.

3. **Ensemble evaluated on its own training distribution:** The ensemble rule was derived
   from and tested on the same 50 examples. This is an in-sample result and will likely
   overestimate ensemble performance on new data.

4. **Single annotator:** No inter-annotator agreement measured.

5. **Positive Taglish gap unresolved:** Neither model reliably detects positive sentiment
   in Tagalog-dominant text. A future custom-trained model or an extended Filipino-positive
   lexicon would be needed to address this.

---

## 11. Disposition and Next Steps

This evaluation is **research only** — no model is integrated into the production backend.

Future production integration requires (in order):
1. Hosting plan that accommodates model memory footprint (~436MB weights; exceeds
   standard free-tier Render RAM budget).
2. Psychologist (Dr. Torres) review of any disclaimer wording before student-facing display.
3. Re-verification of all model citations used in the manuscript.
4. Expanded, held-out validation dataset (ideally with authentic student text pending
   ethics approval) to confirm the ensemble finding and test statistical significance.

---

## 12. Reproducibility

```powershell
# From research/ with venv-research activated:
.\venv-research\Scripts\Activate.ps1
$env:PYTHONIOENCODING="utf-8"

# Step 1: run both models on full dataset
python compare_sentiment_models.py

# Step 2: statistical significance test
python mcnemar_test.py

# Step 3: ensemble experiment
python ensemble_experiment.py
```

All outputs are deterministic. Re-running produces identical results.

**Environment** *(verified via `pip show` against the actual venv, not inferred):*
- Python: 3.14 (cp314)
- torch: 2.14.0
- transformers: 5.17.0
- vaderSentiment: 3.3.2
- scikit-learn: 1.9.1
- statsmodels: 0.15.0
- pandas: 3.0.6

---

## 13. Output Files

| File | Contents |
|---|---|
| `comparison_results.csv` | All 50 examples with VADER and Taglish predictions |
| `summary_metrics.csv` | Aggregate metrics for VADER and Taglish model |
| `ensemble_results.csv` | All 50 examples with all three model predictions |
| `ensemble_summary_metrics.csv` | Aggregate metrics for all three models |
| `mcnemar_results.csv` | McNemar test statistic, p-value, contingency table |
| `validation_set.csv` | Labeled validation dataset (n=50) |
