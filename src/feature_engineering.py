"""
src/feature_engineering.py
===========================
Phase 3 -- Feature Engineering, Selection & Scaling

Steps performed:
  1. Identify and report high-correlation feature pairs (|r| > 0.95)
  2. Use Random Forest feature importance to select top-N features
  3. Fit StandardScaler strictly on training data (zero leakage)
  4. Return selected feature list and scaled matrices

Usage (standalone):
    python src/feature_engineering.py

Returns (when imported):
    engineer(df, top_n, random_state) -> (selected_features, X_scaled, scaler)
"""

import os
import sys
import time

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

# -- Columns to always exclude from features -----------------------------------
_EXCLUDE_ALWAYS = {"Label", "label_binary", "label_multi"}

# -- Correlation threshold -----------------------------------------------------
_CORR_THRESHOLD = 0.95

# -- Sample size for correlation computation (full data is too slow) -----------
_CORR_SAMPLE = 50_000

# -- RF importance sample size -------------------------------------------------
_RF_SAMPLE = 100_000


def engineer(
    df: pd.DataFrame,
    top_n: int = 30,
    random_state: int = 42,
    save_plots: bool = True,
    plots_dir: str = "results",
    verbose: bool = True,
) -> tuple:
    """
    Full feature engineering pipeline.

    Parameters
    ----------
    df : pd.DataFrame
        Cleaned DataFrame from ``preprocessing.clean()``.
    top_n : int
        Number of top features to select via Random Forest importance.
    random_state : int
        Reproducibility seed.
    save_plots : bool
        If True, save feature importance and correlation plots.
    plots_dir : str
        Directory for plot output.
    verbose : bool
        Print progress.

    Returns
    -------
    selected_features : list[str]
        Names of the top_n selected features.
    X_scaled : pd.DataFrame
        StandardScaler-transformed full dataset (all rows).
    scaler : StandardScaler
        Fitted scaler (for reuse on inference data).
    importances : pd.Series
        Full feature importance series (all candidate features).
    """
    if verbose:
        print("=" * 65)
        print("  PHASE 3 -- FEATURE ENGINEERING & SELECTION")
        print("=" * 65)
    t_start = time.time()

    # -- Candidate features ----------------------------------------------------
    all_num = df.select_dtypes(include=[np.number]).columns.tolist()
    candidate_cols = [c for c in all_num if c not in _EXCLUDE_ALWAYS]

    if verbose:
        print(f"  Candidate numerical features: {len(candidate_cols)}")

    # -- Step 1: Correlation Analysis -----------------------------------------
    high_pairs = _correlation_analysis(df, candidate_cols, random_state, verbose)

    # -- Step 2: Random Forest Feature Importance ------------------------------
    importances = _rf_importance(
        df, candidate_cols, random_state, verbose
    )
    selected_features = importances.head(top_n).index.tolist()

    if verbose:
        print(f"\n  Selected top {top_n} features by RF importance:")
        for i, (feat, score) in enumerate(importances.head(top_n).items(), 1):
            bar = "#" * int(score / importances.max() * 25)
            print(f"    {i:>2}. {feat:<40s}  {score:.4f}  {bar}")

    # -- Step 3: StandardScaler ------------------------------------------------
    # NOTE: We fit the scaler here on ALL data for the feature engineering module.
    # In data_split.py, the scaler is RE-FIT strictly on X_train only.
    # This scaled version is for EDA and feature importance checks only.
    scaler = StandardScaler()
    X = df[selected_features].copy()
    X_scaled_arr = scaler.fit_transform(X)
    X_scaled = pd.DataFrame(X_scaled_arr, columns=selected_features, index=X.index)

    if verbose:
        print(f"\n  StandardScaler applied. Scaled shape: {X_scaled.shape}")

    # -- Step 4: Plots ---------------------------------------------------------
    if save_plots:
        os.makedirs(plots_dir, exist_ok=True)
        _plot_importance(importances, top_n, plots_dir)
        _plot_distributions(df, importances, plots_dir)

    elapsed = round(time.time() - t_start, 2)
    if verbose:
        print(f"\n  Feature engineering complete in {elapsed}s.\n")

    return selected_features, X_scaled, scaler, importances


def _correlation_analysis(
    df: pd.DataFrame,
    candidate_cols: list,
    random_state: int,
    verbose: bool,
) -> list:
    """Compute pairwise correlation on a sample; report high-correlation pairs."""
    sample_df = df[candidate_cols].sample(
        min(_CORR_SAMPLE, len(df)), random_state=random_state
    )
    corr_mat = sample_df.corr()

    high_pairs = []
    cols = corr_mat.columns.tolist()
    for i in range(len(cols)):
        for j in range(i):
            r = corr_mat.iloc[i, j]
            if abs(r) > _CORR_THRESHOLD:
                high_pairs.append((cols[i], cols[j], round(float(r), 4)))

    if verbose:
        print(f"\n  [Step 1] High-correlation pairs (|r| > {_CORR_THRESHOLD}): "
              f"{len(high_pairs)}")
        for a, b, r in high_pairs[:8]:
            print(f"    {a[:35]:<35s}  <->  {b[:35]:<35s}  r={r:+.3f}")
        if len(high_pairs) > 8:
            print(f"    ... and {len(high_pairs) - 8} more pairs.")

    return high_pairs


def _rf_importance(
    df: pd.DataFrame,
    candidate_cols: list,
    random_state: int,
    verbose: bool,
) -> pd.Series:
    """Train a shallow Random Forest on a sample and return feature importances."""
    if verbose:
        print(f"\n  [Step 2] Training RF importance model "
              f"(sample={_RF_SAMPLE:,}, n_estimators=50, max_depth=10)...")

    sample_idx = df.sample(
        min(_RF_SAMPLE, len(df)), random_state=random_state
    ).index
    X_samp = df.loc[sample_idx, candidate_cols]
    y_samp = df.loc[sample_idx, "label_binary"]

    rf = RandomForestClassifier(
        n_estimators=50, max_depth=10,
        random_state=random_state, n_jobs=-1,
    )
    t0 = time.time()
    rf.fit(X_samp, y_samp)
    if verbose:
        print(f"  [Step 2] RF trained in {round(time.time()-t0, 2)}s")

    importances = pd.Series(
        rf.feature_importances_, index=candidate_cols
    ).sort_values(ascending=False)
    return importances


def _plot_importance(importances: pd.Series, top_n: int, plots_dir: str) -> None:
    """Save horizontal bar chart of top feature importances."""
    fig, ax = plt.subplots(figsize=(10, 10))
    importances.head(top_n).plot(
        kind="barh", ax=ax, color="steelblue", edgecolor="black"
    )
    ax.invert_yaxis()
    ax.set_title(
        f"Top {top_n} Features -- Random Forest Importance\n(CICIDS 2017)",
        fontweight="bold", fontsize=13,
    )
    ax.set_xlabel("Importance Score", fontsize=11)
    ax.grid(axis="x", alpha=0.3)
    plt.tight_layout()
    out = os.path.join(plots_dir, "plot_feature_importance.png")
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  [Plot] Saved: {out}")


def _plot_distributions(
    df: pd.DataFrame, importances: pd.Series, plots_dir: str
) -> None:
    """Save overlapping histograms (Benign vs Attack) for top-5 features."""
    top5 = importances.head(5).index.tolist()
    fig, axes = plt.subplots(1, 5, figsize=(22, 4))
    for ax, feat in zip(axes, top5):
        upper = df[feat].quantile(0.99)
        df[df["label_binary"] == 0][feat].clip(upper=upper).hist(
            ax=ax, bins=50, alpha=0.6, color="steelblue", label="Benign", density=True
        )
        df[df["label_binary"] == 1][feat].clip(upper=upper).hist(
            ax=ax, bins=50, alpha=0.6, color="salmon", label="Attack", density=True
        )
        ax.set_title(feat[:24], fontsize=9)
        ax.legend(fontsize=7)
    plt.suptitle(
        "Feature Distributions: Benign vs Attack (Top-5 Features)",
        fontweight="bold",
    )
    plt.tight_layout()
    out = os.path.join(plots_dir, "plot_feature_distributions.png")
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  [Plot] Saved: {out}")


if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from src.data_loader import load_cicids
    from src.preprocessing import clean

    data_dir = sys.argv[1] if len(sys.argv) > 1 else ".."
    df_raw = load_cicids(data_dir=data_dir, verbose=False)
    df_clean = clean(df_raw, verbose=False)
    selected, X_scaled, scaler, importances = engineer(df_clean)
    print(f"\nSelected features ({len(selected)}): {selected[:5]}...")
    print(f"Scaled matrix: {X_scaled.shape}")
