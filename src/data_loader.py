"""
src/data_loader.py
==================
Phase 1 -- Data Collection & Understanding

Loads all 8 CICIDS 2017 CSV files, concatenates them into a single
DataFrame, standardises column names, and prints a full dataset audit.

Usage (standalone):
    python src/data_loader.py

Returns (when imported):
    load_cicids(data_dir) -> pd.DataFrame
"""

import os
import sys
import time

import numpy as np
import pandas as pd

# -- Default data directory ------------------------------------------------------
_DEFAULT_DIR = os.path.join(os.path.dirname(__file__), "..")

# All 8 CICIDS 2017 capture files in chronological order
CICIDS_FILES = [
    "Monday-WorkingHours.pcap_ISCX.csv",
    "Tuesday-WorkingHours.pcap_ISCX.csv",
    "Wednesday-workingHours.pcap_ISCX.csv",
    "Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv",
    "Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv",
    "Friday-WorkingHours-Morning.pcap_ISCX.csv",
    "Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv",
    "Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv",
]


def load_cicids(data_dir: str = _DEFAULT_DIR, verbose: bool = True) -> pd.DataFrame:
    """
    Load and concatenate all CICIDS 2017 CSV files.

    Parameters
    ----------
    data_dir : str
        Directory containing the 8 CICIDS 2017 CSV files.
    verbose : bool
        If True, print ingestion progress for each file.

    Returns
    -------
    pd.DataFrame
        Concatenated raw DataFrame with stripped column names.
        Shape ~= (2,830,743 rows, 79 columns).
    """
    dfs = []
    total_start = time.time()

    print("=" * 65)
    print("  PHASE 1 -- DATA COLLECTION & UNDERSTANDING")
    print("  Dataset: CICIDS 2017 (Canadian Institute for Cybersecurity)")
    print("=" * 65)

    for fname in CICIDS_FILES:
        fpath = os.path.join(data_dir, fname)
        if not os.path.exists(fpath):
            print(f"  [WARN] File not found, skipping: {fname}")
            continue

        t0 = time.time()
        tmp = pd.read_csv(
            fpath,
            low_memory=False,
            encoding="utf-8",
            encoding_errors="replace",
        )
        elapsed = round(time.time() - t0, 2)

        if verbose:
            print(
                f"  [+] {fname:<58s}  "
                f"{tmp.shape[0]:>9,} rows | {tmp.shape[1]:>2} cols | {elapsed}s"
            )
        dfs.append(tmp)

    if not dfs:
        raise FileNotFoundError(
            f"No CICIDS CSV files found in '{data_dir}'. "
            "Download from https://www.unb.ca/cic/datasets/ids-2017.html"
        )

    # Concatenate all files
    df = pd.concat(dfs, ignore_index=True)

    # Strip leading/trailing whitespace from all column names
    # (CICFlowMeter produces headers with leading spaces, e.g. " Flow Duration")
    df.columns = df.columns.str.strip()

    total_elapsed = round(time.time() - total_start, 2)
    print(f"\n  Ingested {len(dfs)} files in {total_elapsed}s.")
    print(f"  Aggregate raw dataset: {df.shape[0]:,} rows x {df.shape[1]} columns.\n")

    # -- Dataset Audit ---------------------------------------------------------
    _print_audit(df)

    return df


def _print_audit(df: pd.DataFrame) -> None:
    """Print a structured dataset audit report."""
    n_num = df.select_dtypes(include=[np.number]).shape[1]
    n_cat = df.select_dtypes(exclude=[np.number]).shape[1]
    n_miss = int(df.isnull().sum().sum())
    n_dup = int(df.duplicated().sum())

    num_cols = df.select_dtypes(include=[np.number]).columns
    n_inf = sum(int(np.isinf(df[c]).sum()) for c in num_cols)

    print("-- DATASET AUDIT ----------------------------------------------")
    print(f"  Total Rows          : {df.shape[0]:>12,}")
    print(f"  Total Columns       : {df.shape[1]:>12,}")
    print(f"  Numerical Features  : {n_num:>12,}")
    print(f"  Categorical Features: {n_cat:>12,}")
    print(f"  Missing Values      : {n_miss:>12,}")
    print(f"  Duplicate Rows      : {n_dup:>12,}  ({100*n_dup/len(df):.2f}%)")
    print(f"  Infinite Values     : {n_inf:>12,}")

    if "Label" in df.columns:
        label_counts = df["Label"].value_counts()
        print(f"\n  Label Column: 'Label'  |  Unique classes: {len(label_counts)}")
        print("  Class Distribution:")
        for lbl, cnt in label_counts.items():
            bar = "#" * int(cnt / label_counts.max() * 30)
            lbl_clean = str(lbl).encode("ascii", errors="replace").decode("ascii")
            print(f"    {lbl_clean[:35]:<35s}  {cnt:>9,}  {bar}")

    print("-" * 65)


if __name__ == "__main__":
    # Allow passing data directory as CLI arg
    data_dir = sys.argv[1] if len(sys.argv) > 1 else _DEFAULT_DIR
    df = load_cicids(data_dir=data_dir)
    print(f"\nDataFrame ready: {df.shape}")
