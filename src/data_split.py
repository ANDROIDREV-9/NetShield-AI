"""
src/data_split.py
=================
Phase 4 — Leakage-Free Train/Test Split + SMOTE Oversampling

Critical pipeline decisions made here:
  ┌─────────────────────────────────────────────────────┐
  │  SPLIT FIRST → then SMOTE only on X_train           │
  │  This prevents synthetic samples leaking into        │
  │  the test set (a common academic error).             │
  └─────────────────────────────────────────────────────┘

Steps:
  1. Stratified 80/20 train-test split (preserves class ratios)
  2. StandardScaler fitted STRICTLY on X_train, then applied to both
  3. SMOTE applied STRICTLY on (X_train_scaled, y_train)
  4. Regression split (no SMOTE — regression doesn't need it)

Usage (standalone):
    python src/data_split.py

Returns (when imported):
    split_classification(df, selected_features, ...) -> dict
    split_regression(df, selected_features, ...)     -> dict
"""

import os
import sys
import time

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTE
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# ── Regression target ─────────────────────────────────────────────────────────
_REG_TARGET = "Flow Duration"

# ── Leakage-risk columns to exclude from regression features ──────────────────
# These are DERIVED from Flow Duration — using them would leak the target.
_REG_EXCLUDE = {"Flow Bytes/s", "Flow Packets/s", "Flow Duration",
                "label_binary", "label_multi", "Label"}

# ── Max sample size for regression (memory-intensive) ─────────────────────────
_REG_SAMPLE = 200_000


def split_classification(
    df: pd.DataFrame,
    selected_features: list,
    test_size: float = 0.20,
    random_state: int = 42,
    smote_k: int = 5,
    save_plots: bool = True,
    plots_dir: str = "results",
    verbose: bool = True,
) -> dict:
    """
    Leakage-free train/test split + SMOTE for binary classification.

    Parameters
    ----------
    df : pd.DataFrame
        Cleaned DataFrame with ``label_binary`` column.
    selected_features : list[str]
        Feature names selected by feature_engineering.engineer().
    test_size : float
        Fraction of data for test set (default 0.20).
    random_state : int
        Reproducibility seed.
    smote_k : int
        Number of nearest neighbours for SMOTE interpolation.
    save_plots : bool
        If True, save before/after SMOTE bar chart.
    plots_dir : str
        Directory for saved plots.
    verbose : bool
        Print progress.

    Returns
    -------
    dict with keys:
        X_train, X_test        — scaled feature matrices (numpy arrays)
        y_train, y_test        — binary labels
        X_train_raw, X_test_raw— unsmote'd for reference
        scaler                 — fitted StandardScaler
        feature_names          — list of selected_features
    """
    if verbose:
        print("=" * 65)
        print("  PHASE 4A — CLASSIFICATION SPLIT + SMOTE")
        print("=" * 65)

    t_start = time.time()
    X = df[selected_features].copy()
    y = df["label_binary"].copy()

    # ── Step 1: Stratified Split ──────────────────────────────────────────────
    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X, y,
        test_size=test_size,
        random_state=random_state,
        stratify=y,          # maintain class ratio in both splits
    )
    if verbose:
        print(f"  [1] Stratified split (80/20):")
        print(f"      Train: {len(X_train_raw):,}  |  Test: {len(X_test_raw):,}")
        vc_tr = y_train.value_counts()
        vc_te = y_test.value_counts()
        print(f"      Train — BENIGN: {vc_tr.get(0,0):,}  ATTACK: {vc_tr.get(1,0):,}")
        print(f"      Test  — BENIGN: {vc_te.get(0,0):,}  ATTACK: {vc_te.get(1,0):,}")

    # ── Step 2: Scale (fit on X_train ONLY) ──────────────────────────────────
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_raw)   # fit + transform
    X_test_scaled  = scaler.transform(X_test_raw)         # transform only
    if verbose:
        print(f"\n  [2] StandardScaler fitted on X_train only (zero leakage).")
        print(f"      Scaler mean[:3]: {scaler.mean_[:3].round(4)}")

    # ── Step 3: SMOTE on training set only ───────────────────────────────────
    vc_before = pd.Series(y_train).value_counts()
    smote = SMOTE(random_state=random_state, k_neighbors=smote_k)
    X_train_smote, y_train_smote = smote.fit_resample(X_train_scaled, y_train)
    vc_after = pd.Series(y_train_smote).value_counts()

    if verbose:
        print(f"\n  [3] SMOTE applied to training set only (k={smote_k}):")
        print(f"      Before: BENIGN {vc_before.get(0,0):,}  "
              f"ATTACK {vc_before.get(1,0):,}")
        print(f"      After : BENIGN {vc_after.get(0,0):,}  "
              f"ATTACK {vc_after.get(1,0):,}  "
              f"(ratio {vc_after.get(0,0)/max(vc_after.get(1,0),1):.2f}:1)")
        print(f"      Total training samples: {len(X_train_smote):,}")

    if save_plots:
        os.makedirs(plots_dir, exist_ok=True)
        _plot_smote(vc_before, vc_after, plots_dir)

    elapsed = round(time.time() - t_start, 2)
    if verbose:
        print(f"\n  Classification split complete in {elapsed}s.\n")

    return {
        "X_train":      X_train_smote,
        "X_test":       X_test_scaled,
        "y_train":      np.array(y_train_smote),
        "y_test":       np.array(y_test),
        "X_train_raw":  X_train_scaled,   # pre-SMOTE, post-scale (for CV)
        "y_train_raw":  np.array(y_train),
        "scaler":       scaler,
        "feature_names": selected_features,
    }


def split_regression(
    df: pd.DataFrame,
    selected_features: list,
    test_size: float = 0.20,
    random_state: int = 42,
    verbose: bool = True,
) -> dict:
    """
    Train/test split for regression (no SMOTE needed).

    Target: log1p(Flow Duration) — log-transformed to normalise skewed distribution.
    Anti-leakage: Flow Duration itself, Flow Bytes/s, Flow Packets/s excluded
                  from the feature set.

    Returns
    -------
    dict with keys:
        Xr_train, Xr_test — scaled feature arrays
        yr_train, yr_test — log1p-transformed target arrays
        scaler_reg        — fitted StandardScaler
        reg_features      — feature names used
    """
    if verbose:
        print("=" * 65)
        print("  PHASE 4B — REGRESSION SPLIT (no SMOTE)")
        print("=" * 65)

    # Regression features = selected features MINUS leakage columns
    reg_features = [
        c for c in selected_features
        if c not in _REG_EXCLUDE and c in df.columns
    ]

    # Regression target
    if _REG_TARGET not in df.columns:
        alts = [c for c in df.columns if "duration" in c.lower()]
        reg_target_col = alts[0] if alts else None
        if reg_target_col is None:
            raise KeyError(f"'{_REG_TARGET}' not found in DataFrame columns.")
    else:
        reg_target_col = _REG_TARGET

    y_raw = df[reg_target_col].clip(lower=0)
    y_reg = np.log1p(y_raw).values   # log1p for normality

    if verbose:
        print(f"  Regression target : '{reg_target_col}' (log1p-transformed)")
        print(f"  Regression features: {len(reg_features)}")
        print(f"  Leakage columns excluded: "
              f"{[c for c in _REG_EXCLUDE if c in df.columns]}")

    # Downsample for regression (memory / speed)
    if len(df) > _REG_SAMPLE:
        rng = np.random.default_rng(random_state)
        ridx = rng.choice(len(df), _REG_SAMPLE, replace=False)
        X_reg = df.iloc[ridx][reg_features].values
        y_reg = y_reg[ridx]
        if verbose:
            print(f"  Downsampled to {_REG_SAMPLE:,} rows for regression.")
    else:
        X_reg = df[reg_features].values

    Xr_train, Xr_test, yr_train, yr_test = train_test_split(
        X_reg, y_reg,
        test_size=test_size,
        random_state=random_state,
    )

    scaler_reg = StandardScaler()
    Xr_train_s = scaler_reg.fit_transform(Xr_train)
    Xr_test_s  = scaler_reg.transform(Xr_test)

    if verbose:
        print(f"\n  Reg Train: {Xr_train_s.shape[0]:,}  |  "
              f"Reg Test: {Xr_test_s.shape[0]:,}")
        print(f"  Target range (log1p): [{yr_train.min():.2f}, {yr_train.max():.2f}]")
        print(f"  Regression split complete.\n")

    return {
        "Xr_train":     Xr_train_s,
        "Xr_test":      Xr_test_s,
        "yr_train":     yr_train,
        "yr_test":      yr_test,
        "scaler_reg":   scaler_reg,
        "reg_features": reg_features,
    }


def _plot_smote(vc_before: pd.Series, vc_after: pd.Series, plots_dir: str) -> None:
    """Save side-by-side bar chart showing class balance before and after SMOTE."""
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    for ax, (vc, title) in zip(axes, [
        (vc_before, "Before SMOTE"),
        (vc_after,  "After SMOTE"),
    ]):
        bars = ax.bar(
            ["BENIGN", "ATTACK"],
            [vc.get(0, 0), vc.get(1, 0)],
            color=["steelblue", "salmon"],
            edgecolor="black",
        )
        ax.set_title(title, fontweight="bold")
        ax.set_ylabel("Sample Count")
        for bar in bars:
            h = bar.get_height()
            ax.annotate(
                f"{int(h):,}",
                xy=(bar.get_x() + bar.get_width() / 2, h),
                ha="center", va="bottom", fontweight="bold",
            )
    plt.suptitle(
        "Class Imbalance Handling — SMOTE (Training Set Only)",
        fontsize=13, fontweight="bold",
    )
    plt.tight_layout()
    out = os.path.join(plots_dir, "plot_smote_balancing.png")
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  [Plot] Saved: {out}")


if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from src.data_loader import load_cicids
    from src.preprocessing import clean
    from src.feature_engineering import engineer

    data_dir = sys.argv[1] if len(sys.argv) > 1 else ".."
    df_raw = load_cicids(data_dir=data_dir, verbose=False)
    df_clean = clean(df_raw, verbose=False)
    selected, _, _, _ = engineer(df_clean, verbose=False, save_plots=False)

    clf_data = split_classification(df_clean, selected)
    print("X_train (SMOTE):", clf_data["X_train"].shape)
    print("X_test          :", clf_data["X_test"].shape)

    reg_data = split_regression(df_clean, selected)
    print("Xr_train        :", reg_data["Xr_train"].shape)
