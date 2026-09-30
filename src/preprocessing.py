"""
src/preprocessing.py
====================
Phase 2 — Data Cleaning Pipeline

Applies a 5-stage cleaning process to the raw CICIDS DataFrame:
  1. Missing Values  — drop cols >50% NaN; median-impute remainder
  2. Infinite Values — replace Inf with column finite maximum (CICFlowMeter artifact)
  3. Float Clipping  — clip to [-1e15, 1e15] to prevent sklearn float32 overflow
  4. Duplicate Rows  — exact duplicate removal
  5. Zero-Variance   — drop constant numerical columns
  6. Label Normalisation — fix Unicode label names, create binary & multiclass targets

Usage (standalone):
    python src/preprocessing.py

Returns (when imported):
    clean(df) -> pd.DataFrame
"""

import re
import sys
import time

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder


# ── Label name normalisation map ───────────────────────────────────────────────
# CICFlowMeter sometimes writes "Web Attack  Brute Force" with two spaces.
_LABEL_MAP = {
    "Web Attack  Brute Force":   "Web Attack-Brute Force",
    "Web Attack  XSS":           "Web Attack-XSS",
    "Web Attack  Sql Injection": "Web Attack-SQL Injection",
    "Web Attack Brute Force":    "Web Attack-Brute Force",
    "Web Attack XSS":            "Web Attack-XSS",
    "Web Attack Sql Injection":  "Web Attack-SQL Injection",
}

# ── Columns known to produce Inf (rate = bytes / Flow Duration; dur=0 → Inf) ──
_KNOWN_INF_COLS = ["Flow Bytes/s", "Flow Packets/s"]


def clean(df: pd.DataFrame, verbose: bool = True) -> pd.DataFrame:
    """
    Full 5-stage cleaning pipeline for CICIDS 2017.

    Parameters
    ----------
    df : pd.DataFrame
        Raw DataFrame returned by ``data_loader.load_cicids()``.
    verbose : bool
        Print before/after audit table if True.

    Returns
    -------
    pd.DataFrame
        Cleaned DataFrame with added columns:
          - ``label_binary`` (int): 0=BENIGN, 1=ATTACK
          - ``label_multi``  (int): 0..N encoded attack categories
    """
    if verbose:
        print("=" * 65)
        print("  PHASE 2 — DATA CLEANING PIPELINE")
        print("=" * 65)

    before = _snapshot(df)
    t_start = time.time()

    # ── Stage 1: Missing Values ──────────────────────────────────────────────
    missing = df.isnull().sum()
    cols_miss = missing[missing > 0]
    if len(cols_miss):
        drop_50 = cols_miss[cols_miss / len(df) > 0.50].index.tolist()
        if drop_50:
            df = df.drop(columns=drop_50)
            if verbose:
                print(f"  [1] Dropped (>50% NaN): {drop_50}")
        num_cols = df.select_dtypes(include=[np.number]).columns
        df[num_cols] = df[num_cols].fillna(df[num_cols].median())
        if verbose:
            miss_remaining = int(df.isnull().sum().sum())
            print(f"  [1] Remaining NaN after median fill: {miss_remaining}")
    else:
        if verbose:
            print("  [1] No missing values detected.")

    # ── Stage 2 & 3: Infinite Values + Clipping ──────────────────────────────
    num_cols = df.select_dtypes(include=[np.number]).columns
    inf_report = {}
    for c in num_cols:
        n_inf = int(np.isinf(df[c]).sum())
        if n_inf > 0:
            inf_report[c] = n_inf
            finite_max = float(df[c][np.isfinite(df[c])].max())
            df[c] = df[c].apply(lambda v: finite_max if not np.isfinite(v) else v)

    if verbose:
        if inf_report:
            print(f"  [2] Inf values replaced in {len(inf_report)} column(s):")
            for c, n in inf_report.items():
                print(f"        {c}: {n:,} values → replaced with finite max")
        else:
            print("  [2] No Inf values detected.")

    # Clip to prevent float32 overflow inside sklearn
    num_cols = df.select_dtypes(include=[np.number]).columns
    df[num_cols] = df[num_cols].clip(lower=-1e15, upper=1e15)
    if verbose:
        remaining_inf = sum(int(np.isinf(df[c]).sum()) for c in num_cols)
        print(f"  [3] Post-clip Inf count: {remaining_inf}")

    # ── Stage 4: Duplicate Rows ───────────────────────────────────────────────
    n_before_dup = len(df)
    df = df.drop_duplicates()
    n_removed = n_before_dup - len(df)
    if verbose:
        print(f"  [4] Removed {n_removed:,} duplicate rows  "
              f"({100*n_removed/n_before_dup:.2f}%)")

    # ── Stage 5: Zero-Variance Columns ───────────────────────────────────────
    num_cols = df.select_dtypes(include=[np.number]).columns
    zv_cols = num_cols[df[num_cols].std() == 0].tolist()
    if zv_cols:
        df = df.drop(columns=zv_cols)
        if verbose:
            print(f"  [5] Dropped {len(zv_cols)} zero-variance columns: {zv_cols}")
    else:
        if verbose:
            print("  [5] No zero-variance columns found.")

    # ── Stage 6: Label Normalisation ─────────────────────────────────────────
    df = _encode_labels(df, verbose)

    elapsed = round(time.time() - t_start, 2)
    after = _snapshot(df)

    if verbose:
        _print_audit_table(before, after)
        print(f"\n  Cleaning complete in {elapsed}s. Final shape: {df.shape}\n")

    return df


def _encode_labels(df: pd.DataFrame, verbose: bool) -> pd.DataFrame:
    """Fix label strings, create binary (0/1) and multiclass (0..N) targets."""
    # Strip whitespace + non-ASCII characters (CICFlowMeter Unicode artifact)
    df["Label"] = df["Label"].str.strip()
    df["Label"] = df["Label"].apply(
        lambda x: re.sub(r"[^\x00-\x7F]+", "", str(x)).strip()
    )
    df["Label"] = df["Label"].replace(_LABEL_MAP)

    # Binary: 0 = BENIGN, 1 = ATTACK
    df["label_binary"] = (df["Label"] != "BENIGN").astype(int)

    # Multiclass: integer-encoded attack category
    le = LabelEncoder()
    df["label_multi"] = le.fit_transform(df["Label"])

    if verbose:
        vc_b = df["label_binary"].value_counts()
        ratio = vc_b.get(0, 0) / max(vc_b.get(1, 1), 1)
        print(f"  [6] Binary  → BENIGN: {vc_b.get(0,0):,}  |  "
              f"ATTACK: {vc_b.get(1,0):,}  (ratio {ratio:.1f}:1)")
        print(f"  [6] Multiclass → {df['label_multi'].nunique()} unique classes")

    return df


def _snapshot(df: pd.DataFrame) -> dict:
    num_cols = df.select_dtypes(include=[np.number]).columns
    return {
        "rows":      len(df),
        "cols":      df.shape[1],
        "missing":   int(df.isnull().sum().sum()),
        "duplicates":int(df.duplicated().sum()),
        "infinite":  sum(int(np.isinf(df[c]).sum()) for c in num_cols),
    }


def _print_audit_table(before: dict, after: dict) -> None:
    print("\n  ── CLEANING AUDIT TABLE ──────────────────────────────────────")
    header = f"  {'':25s}  {'Before':>10s}  {'After':>10s}  {'Δ':>10s}"
    print(header)
    print("  " + "─" * 58)
    for key in before:
        b, a = before[key], after.get(key, "—")
        delta = (a - b) if isinstance(a, int) else "—"
        print(f"  {key.capitalize():25s}  {b:>10,}  {a:>10,}  {delta:>+10,}")
    print("  " + "─" * 58)


if __name__ == "__main__":
    import os
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from src.data_loader import load_cicids

    data_dir = sys.argv[1] if len(sys.argv) > 1 else ".."
    df_raw = load_cicids(data_dir=data_dir, verbose=False)
    df_clean = clean(df_raw)
    print(f"\nClean DataFrame ready: {df_clean.shape}")
