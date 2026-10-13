"""
src/train_classification.py
===========================
Phase 5A -- Classification Track (Base Models)

Trains baseline binary classification models:
  1. Logistic Regression
  2. Decision Tree Classifier
  3. K-Nearest Neighbors
  4. Gaussian Naive Bayes

Saves the trained models to the `models/` directory for inference.

Usage:
    python src/train_classification.py
"""

import os
import sys
import time

import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier

# -- Import pipeline modules ---------------------------------------------------
from data_loader import load_cicids
from data_split import split_classification
from feature_engineering import engineer
from preprocessing import clean

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(MODELS_DIR, exist_ok=True)


def train_base_models(X_train: pd.DataFrame, y_train: pd.Series, verbose: bool = True):
    """Train baseline classifiers and save them to disk."""
    if verbose:
        print("=" * 65)
        print("  PHASE 5A -- TRAINING BASE CLASSIFIERS")
        print("=" * 65)

    models = {
        "LogisticRegression": LogisticRegression(
            max_iter=1000, random_state=42, n_jobs=-1, solver="lbfgs"
        ),
        "DecisionTree": DecisionTreeClassifier(
            max_depth=15, min_samples_leaf=10, random_state=42, criterion="gini"
        ),
        "GaussianNB": GaussianNB(),
    }

    # Train standard models
    for name, clf in models.items():
        if verbose:
            print(f"  Training {name}...")
        t0 = time.time()
        clf.fit(X_train, y_train)
        elapsed = round(time.time() - t0, 2)
        
        out_path = os.path.join(MODELS_DIR, f"{name.lower()}.joblib")
        joblib.dump(clf, out_path)
        if verbose:
            print(f"  [+] {name} trained in {elapsed}s -> Saved to models/")

    # Train KNN (Requires downsampling as distance matrix is extremely memory/CPU heavy)
    if verbose:
        print(f"  Training KNeighborsClassifier (on subset for performance)...")
    
    import numpy as np
    KNN_SAMP = min(80_000, len(X_train))
    idx = np.random.default_rng(42).choice(len(X_train), KNN_SAMP, replace=False)
    
    # Handle both NumPy arrays (from SMOTE) and Pandas DataFrames
    X_knn = X_train[idx] if isinstance(X_train, np.ndarray) else X_train.iloc[idx]
    y_knn = y_train[idx] if isinstance(y_train, np.ndarray) else y_train.iloc[idx]

    knn = KNeighborsClassifier(n_neighbors=7, n_jobs=-1, algorithm="ball_tree")
    t0 = time.time()
    knn.fit(X_knn, y_knn)
    elapsed = round(time.time() - t0, 2)

    out_path = os.path.join(MODELS_DIR, "knn.joblib")
    joblib.dump(knn, out_path)
    if verbose:
        print(f"  [+] KNN trained in {elapsed}s -> Saved to models/")

    # Train SVC (Requires downsampling due to O(N^2) quadratic solver scaling)
    if verbose:
        print(f"  Training Support Vector Classifier (SVC on subset for performance)...")
    from sklearn.svm import SVC
    SVC_SAMP = min(15_000, len(X_train))
    idx_svc = np.random.default_rng(42).choice(len(X_train), SVC_SAMP, replace=False)
    X_svc = X_train[idx_svc] if isinstance(X_train, np.ndarray) else X_train.iloc[idx_svc]
    y_svc = y_train[idx_svc] if isinstance(y_train, np.ndarray) else y_train.iloc[idx_svc]

    svc = SVC(kernel="rbf", C=10.0, class_weight="balanced", random_state=42)
    t0 = time.time()
    svc.fit(X_svc, y_svc)
    elapsed = round(time.time() - t0, 2)

    out_path = os.path.join(MODELS_DIR, "svc.joblib")
    joblib.dump(svc, out_path)
    if verbose:
        print(f"  [+] SVC trained in {elapsed}s -> Saved to models/")

    if verbose:
        print("\n  Base classification models successfully trained and serialized!\n")


if __name__ == "__main__":
    # Full pipeline execution to get the data
    data_dir = os.path.join(os.path.dirname(__file__), "..")
    
    print("Loading and preparing data (this may take a minute)...")
    df_raw = load_cicids(data_dir=data_dir, verbose=False)
    df_clean = clean(df_raw, verbose=False)
    selected, _, _, _ = engineer(df_clean, save_plots=False, verbose=False)
    
    clf_data = split_classification(
        df_clean, selected, save_plots=False, verbose=False
    )
    
    # Save the scaler for the GUI later
    joblib.dump(clf_data["scaler"], os.path.join(MODELS_DIR, "scaler.joblib"))
    joblib.dump(selected, os.path.join(MODELS_DIR, "selected_features.joblib"))
    print(f"  [+] Scaler and Feature List saved to models/")

    train_base_models(clf_data["X_train"], clf_data["y_train"])
