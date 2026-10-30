"""
mcnemar_test.py
McNemar's exact test on paired VADER vs. DOST-ASTI RoBERTa-tl predictions.
Tests whether the accuracy difference observed in compare_sentiment_models.py
is statistically significant given the paired (same examples) evaluation design.

Run from research/ with venv-research activated:
    python mcnemar_test.py
"""

import pandas as pd
from statsmodels.stats.contingency_tables import mcnemar

df = pd.read_csv("comparison_results.csv")

vader_correct   = df["vader_prediction"]   == df["expected_sentiment"]
taglish_correct = df["taglish_prediction"] == df["expected_sentiment"]

both_correct          = int(( vader_correct  &  taglish_correct).sum())
both_wrong            = int((~vader_correct  & ~taglish_correct).sum())
vader_only_correct    = int(( vader_correct  & ~taglish_correct).sum())
taglish_only_correct  = int((~vader_correct  &  taglish_correct).sum())

print("=" * 55)
print("McNemar's Test: VADER vs. DOST-ASTI RoBERTa-tl")
print("=" * 55)
print(f"\n2x2 paired contingency table (n={len(df)}):")
print(f"  Both correct (concordant +):     {both_correct}")
print(f"  Both wrong   (concordant -):     {both_wrong}")
print(f"  VADER correct, Taglish wrong:    {vader_only_correct}")
print(f"  Taglish correct, VADER wrong:    {taglish_only_correct}")
print(f"\n  Discordant pairs (b+c):          {vader_only_correct + taglish_only_correct}")

# exact=True is required for small n; continuity correction not needed for exact test
table = [
    [both_correct,         vader_only_correct],
    [taglish_only_correct, both_wrong        ],
]
result = mcnemar(table, exact=True)

print(f"\nMcNemar's exact test:")
print(f"  Statistic: {result.statistic}")
print(f"  p-value:   {result.pvalue:.4f}")

alpha = 0.05
print(f"\n  Alpha:     {alpha}")
if result.pvalue < alpha:
    print(f"  SIGNIFICANT: p={result.pvalue:.4f} < {alpha}")
    print("  The accuracy difference is unlikely to be due to chance.")
    print("  Manuscript phrasing:")
    print(f'  "The improvement was statistically significant (McNemar\'s exact')
    print(f'   test, p = {result.pvalue:.4f}, n = {len(df)} paired examples)."')
else:
    print(f"  NOT SIGNIFICANT: p={result.pvalue:.4f} >= {alpha}")
    print("  The current sample size is too small to confirm significance.")
    print("  Report honestly. Suggested manuscript addition to Limitations:")
    print('  "The validation set (n=35) is insufficient to confirm statistical')
    print('   significance (McNemar\'s exact test, p = {:.4f}); a larger,'.format(result.pvalue))
    print('   multi-annotator dataset is identified as future work."')

# Per-class breakdown of disagreements
print("\n" + "=" * 55)
print("Disagrement breakdown by true class")
print("=" * 55)
for cls in ["negative", "neutral", "positive"]:
    mask = df["expected_sentiment"] == cls
    v_right = int(( vader_correct[mask] & ~taglish_correct[mask]).sum())
    t_right = int((~vader_correct[mask] &  taglish_correct[mask]).sum())
    print(f"  {cls:10s}: VADER-only-right={v_right}, Taglish-only-right={t_right}")

# Save
out = pd.DataFrame([{
    "both_correct": both_correct,
    "both_wrong": both_wrong,
    "vader_only_correct": vader_only_correct,
    "taglish_only_correct": taglish_only_correct,
    "discordant_pairs": vader_only_correct + taglish_only_correct,
    "mcnemar_statistic": result.statistic,
    "p_value": round(result.pvalue, 4),
    "significant_at_0.05": result.pvalue < 0.05,
}])
out.to_csv("mcnemar_results.csv", index=False)
print("\nSaved: mcnemar_results.csv")
