"""
scripts/train_and_export_models.py
==================================
Trains and exports serialized production model artifacts to `models/`
for both the REST API backend (FastAPI) and the interactive GUI (Streamlit).

Exported artifacts:
  1. models/scaler.joblib              - StandardScaler fitted on training features
  2. models/selected_features.joblib   - List of 30 engineered feature names
  3. models/rf_classifier.joblib       - Production Random Forest intrusion detector
  4. models/dt_classifier.joblib       - Production Decision Tree intrusion detector
  5. models/lr_classifier.joblib       - Production Logistic Regression baseline
  6. models/rf_regressor.joblib        - Production Random Forest flow duration regressor
  7. models/feature_metadata.json      - Feature statistics for UI sliders & default inputs
  8. models/sample_test_records.json   - Real network flow samples (Benign, DoS, PortScan, etc.)
"""

import os
import sys
import json
import time
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

# Setup paths
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)
from src.data_loader import load_cicids
from src.preprocessing import clean
from src.feature_engineering import engineer

MODELS_DIR = os.path.join(PROJECT_ROOT, "models")
os.makedirs(MODELS_DIR, exist_ok=True)
RANDOM_STATE = 42

def train_and_export():
    print("=" * 65)
    print("  TRAINING & EXPORTING PRODUCTION ARTIFACTS FOR APP / GUI")
    print("=" * 65)

    # 1. Load and clean dataset
    print("\n[1/5] Ingesting and cleaning CICIDS 2017 dataset...")
    df_raw = load_cicids(data_dir=PROJECT_ROOT, verbose=False)
    df = clean(df_raw, verbose=False)
    print(f"      Cleaned dataset shape: {df.shape}")

    # 2. Feature selection
    print("\n[2/5] Selecting top features...")
    selected_features, _, _, _ = engineer(df, top_n=30, random_state=RANDOM_STATE, save_plots=False, verbose=False)
    print(f"      Selected {len(selected_features)} features.")

    # 3. Prepare data splits
    print("\n[3/5] Preparing training samples...")
    SAMPLE_SIZE = min(120_000, len(df))
    df_sample = df.sample(n=SAMPLE_SIZE, random_state=RANDOM_STATE)

    X = df_sample[selected_features].copy()
    y_cls = df_sample["label_binary"].copy()
    
    # Target for regression: log1p(Flow Duration)
    # Ensure no leakage column is in selected_features for regression
    reg_features = [c for c in selected_features if c not in ["Flow Duration", "Flow Bytes/s", "Flow Packets/s"]]
    y_reg = np.log1p(df_sample["Flow Duration"].clip(lower=0).values)

    X_train, X_test, y_cls_train, y_cls_test, y_reg_train, y_reg_test = train_test_split(
        X, y_cls, y_reg, test_size=0.2, random_state=RANDOM_STATE, stratify=y_cls
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    from imblearn.over_sampling import SMOTE
    print("      Applying SMOTE to balance attack vs benign classes...")
    smote = SMOTE(random_state=RANDOM_STATE, k_neighbors=5)
    X_train_smote, y_cls_train_smote = smote.fit_resample(X_train_scaled, y_cls_train)

    # 4. Train models
    print("\n[4/5] Training models...")
    # Classifier 1: Random Forest
    print("      Training Random Forest Classifier (Production IDS)...")
    rf_cls = RandomForestClassifier(n_estimators=100, max_depth=16, min_samples_leaf=3, random_state=RANDOM_STATE, n_jobs=-1)
    rf_cls.fit(X_train_smote, y_cls_train_smote)
    train_acc = rf_cls.score(X_test_scaled, y_cls_test)
    print(f"      -> RF Classifier Test Accuracy: {train_acc:.4f}")

    # Classifier 2: Decision Tree
    print("      Training Decision Tree Classifier...")
    dt_cls = DecisionTreeClassifier(max_depth=12, min_samples_leaf=5, random_state=RANDOM_STATE)
    dt_cls.fit(X_train_smote, y_cls_train_smote)

    # Classifier 3: Logistic Regression
    print("      Training Logistic Regression...")
    lr_cls = LogisticRegression(max_iter=1000, random_state=RANDOM_STATE, n_jobs=-1)
    lr_cls.fit(X_train_scaled, y_cls_train)

    # Regressor: Random Forest Regressor
    print("      Training Random Forest Regressor (Flow Duration)...")
    rf_reg = RandomForestRegressor(n_estimators=60, max_depth=16, min_samples_leaf=4, random_state=RANDOM_STATE, n_jobs=-1)
    # Fit only on non-leakage columns
    reg_col_indices = [selected_features.index(c) for c in reg_features]
    rf_reg.fit(X_train_scaled[:, reg_col_indices], y_reg_train)
    reg_r2 = rf_reg.score(X_test_scaled[:, reg_col_indices], y_reg_test)
    print(f"      -> RF Regressor Test R2: {reg_r2:.4f}")

    # 5. Export artifacts
    print("\n[5/5] Serializing artifacts to 'models/'...")
    joblib.dump(scaler, os.path.join(MODELS_DIR, "scaler.joblib"))
    joblib.dump(selected_features, os.path.join(MODELS_DIR, "selected_features.joblib"))
    joblib.dump(reg_features, os.path.join(MODELS_DIR, "reg_features.joblib"))
    joblib.dump(rf_cls, os.path.join(MODELS_DIR, "rf_classifier.joblib"))
    joblib.dump(dt_cls, os.path.join(MODELS_DIR, "dt_classifier.joblib"))
    joblib.dump(lr_cls, os.path.join(MODELS_DIR, "lr_classifier.joblib"))
    joblib.dump(rf_reg, os.path.join(MODELS_DIR, "rf_regressor.joblib"))

    # Feature statistics for UI sliders
    feature_meta = {}
    for col in selected_features:
        s = df[col]
        feature_meta[col] = {
            "min": float(np.round(s.min(), 4)),
            "max": float(np.round(s.quantile(0.99), 4)), # 99th percentile to avoid crazy slider ranges
            "median": float(np.round(s.median(), 4)),
            "mean": float(np.round(s.mean(), 4)),
            "std": float(np.round(s.std(), 4)),
        }
    with open(os.path.join(MODELS_DIR, "feature_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(feature_meta, f, indent=2)

    # Sample test records for 1-click testing in GUI
    sample_records = []
    for lbl in ["BENIGN", "DoS Hulk", "PortScan", "DDoS", "FTP-Patator"]:
        sub = df[df["Label"] == lbl]
        if len(sub) > 0:
            target_cls = 0 if lbl == "BENIGN" else 1
            # Find a representative row correctly predicted
            sub_feats = sub[selected_features].head(100)
            sub_scaled = scaler.transform(sub_feats)
            preds = rf_cls.predict(sub_scaled)
            match_indices = np.where(preds == target_cls)[0]
            best_idx = match_indices[0] if len(match_indices) > 0 else 0

            row = sub.iloc[best_idx]
            rec = {
                "label": lbl,
                "is_attack": int(row["label_binary"]),
                "flow_duration_actual_log": float(np.round(np.log1p(max(0, row.get("Flow Duration", 0))), 4)),
                "features": {col: float(row[col]) for col in selected_features}
            }
            sample_records.append(rec)

    with open(os.path.join(MODELS_DIR, "sample_test_records.json"), "w", encoding="utf-8") as f:
        json.dump(sample_records, f, indent=2)

    print("      All models and metadata successfully saved in 'models/'!")
    print("=" * 65)

if __name__ == "__main__":
    train_and_export()
