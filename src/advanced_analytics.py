"""
src/advanced_analytics.py
==========================
Phase 7 -- Advanced Analytics & Optional Extensions

Contains three analytical extensions that go beyond basic model training:
  1. 5-Fold Stratified Cross-Validation on the best classifier
  2. Multiclass Attack-Type Classification (RF on 14 categories)
  3. PCA 2D Visualization (dimensionality reduction scatter)

Usage (standalone):
    python src/advanced_analytics.py
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
import seaborn as sns
from sklearn.decomposition import PCA
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import (
    StratifiedKFold,
    cross_validate,
    train_test_split,
)

RESULTS_DIR = os.path.join(os.path.dirname(__file__), "..", "results")
RANDOM_STATE = 42


def cross_validation(
    X_scaled: pd.DataFrame,
    y_binary: pd.Series,
    n_folds: int = 5,
    sample_n: int = 100_000,
    save_plots: bool = True,
    plots_dir: str = None,
    verbose: bool = True,
) -> pd.DataFrame:
    """
    5-Fold Stratified Cross-Validation on Random Forest classifier.

    Validates model robustness by training on 5 different data splits
    and reporting mean +/- std for each metric.

    Parameters
    ----------
    X_scaled : pd.DataFrame
        Scaled feature matrix (full dataset).
    y_binary : pd.Series
        Binary labels (0=BENIGN, 1=ATTACK).
    n_folds : int
        Number of CV folds.
    sample_n : int
        Subsample size for speed (CV is expensive).
    save_plots : bool
        Save CV metric bar chart.
    plots_dir : str
        Plot output directory.

    Returns
    -------
    pd.DataFrame
        CV results with mean, std, and per-fold scores.
    """
    if plots_dir is None:
        plots_dir = RESULTS_DIR
    os.makedirs(plots_dir, exist_ok=True)

    if verbose:
        print("=" * 65)
        print(f"  5-FOLD STRATIFIED CROSS-VALIDATION  (n={sample_n:,})")
        print("=" * 65)

    # Subsample for speed
    rng = np.random.default_rng(RANDOM_STATE)
    idx = rng.choice(len(X_scaled), min(sample_n, len(X_scaled)), replace=False)
    Xcv = X_scaled.iloc[idx]
    ycv = y_binary.iloc[idx]

    cv_model = RandomForestClassifier(
        n_estimators=50, max_depth=15,
        random_state=RANDOM_STATE, n_jobs=-1,
    )
    skf = StratifiedKFold(n_splits=n_folds, shuffle=True, random_state=RANDOM_STATE)

    scoring = ["accuracy", "f1", "precision", "recall", "roc_auc"]
    cv_out = cross_validate(cv_model, Xcv, ycv, cv=skf, scoring=scoring, n_jobs=-1)

    if verbose:
        print(f"\n  Model: RandomForest (n_estimators=50, max_depth=15)")
        print(f"  Folds: {n_folds}  |  Sample: {len(Xcv):,}\n")
        for m in scoring:
            v = cv_out[f"test_{m}"]
            print(f"    {m:12s}: {v.mean():.4f} +/- {v.std():.4f}  "
                  f"[{', '.join(f'{x:.4f}' for x in v)}]")

    if save_plots:
        _plot_cv(cv_out, scoring, n_folds, plots_dir)

    # Build results DataFrame
    rows = []
    for m in scoring:
        v = cv_out[f"test_{m}"]
        rows.append({"Metric": m, "Mean": round(v.mean(), 4),
                      "Std": round(v.std(), 4)})
    return pd.DataFrame(rows)


def multiclass_classification(
    X_scaled: pd.DataFrame,
    y_multi: pd.Series,
    class_names: np.ndarray,
    sample_n: int = None,
    save_plots: bool = True,
    plots_dir: str = None,
    verbose: bool = True,
) -> str:
    """
    Multiclass attack-type classification using Random Forest.

    Instead of just binary (Benign vs Attack), this classifies flows
    into their exact attack category (e.g., DoS Hulk, PortScan, DDoS).

    Parameters
    ----------
    X_scaled : pd.DataFrame
        Scaled feature matrix.
    y_multi : pd.Series
        Integer-encoded multiclass labels (0..N).
    class_names : np.ndarray
        Attack category names for the classification report.
    sample_n : int
        Subsample size. If None, uses full dataset.
    save_plots : bool
        Save confusion matrix heatmap.
    plots_dir : str
        Plot output directory.

    Returns
    -------
    str
        Full classification report as a string.
    """
    if plots_dir is None:
        plots_dir = RESULTS_DIR
    os.makedirs(plots_dir, exist_ok=True)

    if verbose:
        print("=" * 65)
        print("  MULTICLASS ATTACK-TYPE CLASSIFICATION")
        print("=" * 65)

    X = X_scaled
    y = y_multi
    if sample_n and len(X) > sample_n:
        rng = np.random.default_rng(RANDOM_STATE)
        idx = rng.choice(len(X), sample_n, replace=False)
        X = X.iloc[idx]
        y = y.iloc[idx]

    Xmc_tr, Xmc_te, ymc_tr, ymc_te = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y,
    )

    if verbose:
        print(f"  Training Random Forest on {len(Xmc_tr):,} samples "
              f"({len(class_names)} classes)...")

    rf_mc = RandomForestClassifier(
        n_estimators=100, max_depth=20,
        random_state=RANDOM_STATE, n_jobs=-1,
        class_weight="balanced",
    )
    t0 = time.time()
    rf_mc.fit(Xmc_tr, ymc_tr)
    elapsed = round(time.time() - t0, 2)
    yp_mc = rf_mc.predict(Xmc_te)

    report = classification_report(
        ymc_te, yp_mc, target_names=class_names, zero_division=0,
    )
    if verbose:
        print(f"  Trained in {elapsed}s.\n")
        print(report)

    if save_plots:
        _plot_multiclass_cm(ymc_te, yp_mc, class_names, plots_dir)

    return report


def pca_visualization(
    X_scaled: pd.DataFrame,
    y_binary: pd.Series,
    sample_n: int = 20_000,
    save_plots: bool = True,
    plots_dir: str = None,
    verbose: bool = True,
) -> tuple:
    """
    PCA 2D visualization -- project high-dimensional data to 2 principal
    components and colour by Benign vs Attack.

    Returns
    -------
    (explained_variance_ratio, pca_model)
    """
    if plots_dir is None:
        plots_dir = RESULTS_DIR
    os.makedirs(plots_dir, exist_ok=True)

    if verbose:
        print("=" * 65)
        print(f"  PCA 2D VISUALIZATION  (n={sample_n:,})")
        print("=" * 65)

    rng = np.random.default_rng(RANDOM_STATE)
    idx = rng.choice(len(X_scaled), min(sample_n, len(X_scaled)), replace=False)
    Xp = X_scaled.iloc[idx]
    yp = y_binary.iloc[idx]

    pca = PCA(n_components=2, random_state=RANDOM_STATE)
    Xpca = pca.fit_transform(Xp)
    var = pca.explained_variance_ratio_

    if verbose:
        print(f"  PC1: {var[0]:.2%}  |  PC2: {var[1]:.2%}  "
              f"|  Total: {var.sum():.2%}")

    if save_plots:
        fig, ax = plt.subplots(figsize=(10, 7))
        for cls, colour, label in [(0, "steelblue", "BENIGN"),
                                    (1, "salmon", "ATTACK")]:
            mask = (yp == cls).values
            ax.scatter(Xpca[mask, 0], Xpca[mask, 1],
                       c=colour, label=label, alpha=0.4, s=5)
        ax.set_title(f"PCA 2D Projection (CICIDS 2017, n={sample_n:,})",
                     fontweight="bold")
        ax.set_xlabel(f"PC1 ({var[0]:.1%} variance)")
        ax.set_ylabel(f"PC2 ({var[1]:.1%} variance)")
        ax.legend(markerscale=4)
        ax.grid(True, alpha=0.3)
        plt.tight_layout()
        out = os.path.join(plots_dir, "pca_2d_visualization.png")
        plt.savefig(out, dpi=150, bbox_inches="tight")
        plt.close()
        print(f"  [Plot] Saved: {out}")

    return var, pca


# -- Private plotting helpers --------------------------------------------------

def _plot_cv(cv_out: dict, scoring: list, n_folds: int, plots_dir: str) -> None:
    """Bar chart of mean CV scores with error bars."""
    means = [cv_out[f"test_{m}"].mean() for m in scoring]
    stds  = [cv_out[f"test_{m}"].std()  for m in scoring]

    fig, ax = plt.subplots(figsize=(10, 5))
    bars = ax.bar(scoring, means, yerr=stds, capsize=5,
                  color=sns.color_palette("Set2", len(scoring)),
                  edgecolor="black")
    ax.set_title(f"{n_folds}-Fold CV -- Random Forest Classifier",
                 fontweight="bold", fontsize=13)
    ax.set_ylabel("Score")
    ax.set_ylim(0, 1.05)
    for bar, m, s in zip(bars, means, stds):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + s + 0.01,
                f"{m:.4f}", ha="center", va="bottom", fontweight="bold", fontsize=9)
    ax.grid(axis="y", alpha=0.3)
    plt.tight_layout()
    out = os.path.join(plots_dir, "cv_results.png")
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  [Plot] Saved: {out}")


def _plot_multiclass_cm(y_true, y_pred, class_names, plots_dir: str) -> None:
    """Heatmap confusion matrix for multiclass classification."""
    cm = confusion_matrix(y_true, y_pred)
    cm_pct = cm.astype(float) / cm.sum(axis=1)[:, np.newaxis]

    fig, ax = plt.subplots(figsize=(14, 11))
    sns.heatmap(cm_pct, annot=True, fmt=".2f", cmap="Blues",
                xticklabels=class_names, yticklabels=class_names, ax=ax)
    ax.set_xlabel("Predicted", fontsize=12)
    ax.set_ylabel("Actual", fontsize=12)
    ax.set_title("Multiclass Confusion Matrix -- Attack Type Classification",
                 fontweight="bold", fontsize=13)
    plt.tight_layout()
    out = os.path.join(plots_dir, "multiclass_confusion_matrix.png")
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  [Plot] Saved: {out}")


if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(__file__))
    from data_loader import load_cicids
    from feature_engineering import engineer
    from preprocessing import clean

    data_dir = os.path.join(os.path.dirname(__file__), "..")

    print("Loading pipeline...")
    df_raw = load_cicids(data_dir=data_dir, verbose=False)
    df_clean = clean(df_raw, verbose=False)
    selected, X_scaled, _, _ = engineer(df_clean, save_plots=False, verbose=False)

    # 1. Cross-Validation
    cv_df = cross_validation(X_scaled, df_clean["label_binary"])

    # 2. Multiclass Classification
    from sklearn.preprocessing import LabelEncoder
    le = LabelEncoder()
    y_multi = pd.Series(le.fit_transform(df_clean["Label"]))
    class_names = le.classes_
    report = multiclass_classification(X_scaled, y_multi, class_names)

    # 3. PCA Visualization
    var, pca_model = pca_visualization(X_scaled, df_clean["label_binary"])

    print("\nAdvanced analytics complete.")
