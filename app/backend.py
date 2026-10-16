"""
app/backend.py
==============
FastAPI REST Inference Backend for NetShield-AI

Endpoints:
  GET  /health                   - Healthcheck & model readiness
  GET  /features                 - List expected input features & stats
  GET  /samples                  - Pre-loaded test samples (Benign, DoS, PortScan, etc.)
  POST /predict/classification   - Real-time intrusion detection (Benign vs Attack)
  POST /predict/regression       - Flow duration prediction (Anomaly magnitude)
  POST /predict/batch            - Batch CSV/flow records prediction

Run:
  uvicorn app.backend:app --reload --port 8000
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Setup paths
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(PROJECT_ROOT, "models")

app = FastAPI(
    title="NetShield-AI: Intrusion Detection & Log Analysis API",
    description="Production Machine Learning Inference API for Network Intrusion Detection & Flow Duration Regression",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global artifacts storage
ARTIFACTS = {
    "scaler": None,
    "selected_features": [],
    "reg_features": [],
    "rf_classifier": None,
    "dt_classifier": None,
    "rf_regressor": None,
    "feature_metadata": {},
    "sample_records": [],
    "models": {},
}

def load_artifacts():
    try:
        scaler_path = os.path.join(MODELS_DIR, "scaler.joblib")
        feat_path = os.path.join(MODELS_DIR, "selected_features.joblib")
        reg_feat_path = os.path.join(MODELS_DIR, "reg_features.joblib")
        rf_cls_path = os.path.join(MODELS_DIR, "rf_classifier.joblib")
        dt_cls_path = os.path.join(MODELS_DIR, "dt_classifier.joblib")
        rf_reg_path = os.path.join(MODELS_DIR, "rf_regressor.joblib")
        meta_path = os.path.join(MODELS_DIR, "feature_metadata.json")
        samples_path = os.path.join(MODELS_DIR, "sample_test_records.json")

        if os.path.exists(scaler_path):
            ARTIFACTS["scaler"] = joblib.load(scaler_path)
        if os.path.exists(feat_path):
            ARTIFACTS["selected_features"] = joblib.load(feat_path)
        if os.path.exists(reg_feat_path):
            ARTIFACTS["reg_features"] = joblib.load(reg_feat_path)
        if os.path.exists(rf_cls_path):
            ARTIFACTS["rf_classifier"] = joblib.load(rf_cls_path)
        if os.path.exists(dt_cls_path):
            ARTIFACTS["dt_classifier"] = joblib.load(dt_cls_path)
        if os.path.exists(rf_reg_path):
            ARTIFACTS["rf_regressor"] = joblib.load(rf_reg_path)
        if os.path.exists(meta_path):
            with open(meta_path, "r", encoding="utf-8") as f:
                ARTIFACTS["feature_metadata"] = json.load(f)
        if os.path.exists(samples_path):
            with open(samples_path, "r", encoding="utf-8") as f:
                ARTIFACTS["sample_records"] = json.load(f)

        MODEL_REGISTRY = {
            "Random Forest": "rf_classifier.joblib",
            "Gradient Boosting": "gradient_boosting.joblib",
            "Decision Tree": "dt_classifier.joblib",
            "Bagging": "bagging.joblib",
            "AdaBoost": "adaboost.joblib",
            "MLP": "mlp.joblib",
            "KNN": "knn.joblib",
            "SVC": "svc.joblib",
            "Logistic Regression": "lr_classifier.joblib",
            "Gaussian Naive Bayes": "gaussiannb.joblib",
        }
        for name, fname in MODEL_REGISTRY.items():
            m_path = os.path.join(MODELS_DIR, fname)
            if os.path.exists(m_path):
                ARTIFACTS["models"][name] = joblib.load(m_path)
    except Exception as e:
        print(f"[WARN] Error loading artifacts during startup: {e}")

load_artifacts()

class FlowFeatures(BaseModel):
    features: Dict[str, float] = Field(
        ...,
        description="Key-value mapping of network flow features",
        example={
            "Fwd Packet Length Max": 220.0,
            "Total Length of Fwd Packets": 450.0,
            "Packet Length Mean": 78.5,
            "Bwd Packet Length Max": 1460.0
        }
    )
    model_choice: Optional[str] = Field("Random Forest", description="Classifier choice across all 10 models (e.g. 'Random Forest', 'Gradient Boosting', 'Decision Tree', 'Bagging', 'AdaBoost', 'MLP', 'KNN', 'SVC', 'Logistic Regression', 'Gaussian Naive Bayes')")

class BatchRequest(BaseModel):
    records: List[Dict[str, float]]
    model_choice: Optional[str] = "Random Forest"

@app.get("/health")
def healthcheck():
    loaded = ARTIFACTS["rf_classifier"] is not None and ARTIFACTS["scaler"] is not None
    return {
        "status": "healthy" if loaded else "degraded",
        "models_loaded": loaded,
        "selected_features_count": len(ARTIFACTS["selected_features"]),
        "has_regressor": ARTIFACTS["rf_regressor"] is not None,
    }

@app.get("/models")
def get_models():
    if not ARTIFACTS["models"]:
        load_artifacts()
    return {
        "available_models": list(ARTIFACTS["models"].keys()),
        "champion_model": "Random Forest",
        "total_models": len(ARTIFACTS["models"]),
    }

@app.get("/features")
def get_features():
    if not ARTIFACTS["selected_features"]:
        load_artifacts()
    return {
        "features": ARTIFACTS["selected_features"],
        "metadata": ARTIFACTS["feature_metadata"],
    }

@app.get("/samples")
def get_samples():
    if not ARTIFACTS["sample_records"]:
        load_artifacts()
    return {"samples": ARTIFACTS["sample_records"]}

def _resolve_model(model_name: Optional[str]):
    if not ARTIFACTS["models"]:
        load_artifacts()
    if not model_name:
        return ARTIFACTS.get("rf_classifier") or ARTIFACTS.get("models", {}).get("Random Forest")
    
    clean_req = model_name.strip().lower()
    for name, m in ARTIFACTS.get("models", {}).items():
        if name.lower() == clean_req or name.lower() in clean_req or clean_req in name.lower():
            return m
    if "decision" in clean_req:
        return ARTIFACTS.get("dt_classifier")
    return ARTIFACTS.get("rf_classifier")

def _prepare_vector(feature_dict: Dict[str, float]) -> np.ndarray:
    selected = ARTIFACTS["selected_features"]
    if not selected:
        load_artifacts()
        selected = ARTIFACTS["selected_features"]
    
    if not selected:
        raise HTTPException(status_code=503, detail="Models/feature definitions not yet generated. Run training first.")

    # Fill defaults from metadata if missing
    vector = []
    meta = ARTIFACTS["feature_metadata"]
    for feat in selected:
        if feat in feature_dict:
            val = float(feature_dict[feat])
        elif feat in meta:
            val = float(meta[feat].get("median", 0.0))
        else:
            val = 0.0
        vector.append(val)
    
    df_vec = pd.DataFrame([vector], columns=selected)
    scaled_arr = ARTIFACTS["scaler"].transform(df_vec)
    return scaled_arr

@app.post("/predict/classification")
def predict_classification(req: FlowFeatures):
    if ARTIFACTS["rf_classifier"] is None:
        load_artifacts()
        if ARTIFACTS["rf_classifier"] is None:
            raise HTTPException(status_code=503, detail="Classifier model is not ready.")

    scaled_vec = _prepare_vector(req.features)
    model = _resolve_model(req.model_choice)

    pred = int(model.predict(scaled_vec)[0])
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(scaled_vec)[0]
        benign_prob = float(probs[0])
        attack_prob = float(probs[1]) if len(probs) > 1 else (1.0 - benign_prob)
    elif hasattr(model, "decision_function"):
        df_val = float(model.decision_function(scaled_vec)[0])
        attack_prob = float(1.0 / (1.0 + np.exp(-df_val)))
        benign_prob = 1.0 - attack_prob
    else:
        attack_prob = float(pred)
        benign_prob = 1.0 - attack_prob

    if attack_prob > 0.75:
        risk = "CRITICAL"
    elif attack_prob > 0.40:
        risk = "ELEVATED"
    else:
        risk = "NORMAL"

    return {
        "prediction": "ATTACK" if pred == 1 else "BENIGN",
        "is_attack": pred,
        "attack_probability": round(attack_prob, 4),
        "benign_probability": round(benign_prob, 4),
        "risk_level": risk,
        "model_used": type(model).__name__,
    }

@app.post("/predict/regression")
def predict_regression(req: FlowFeatures):
    if ARTIFACTS["rf_regressor"] is None:
        load_artifacts()
        if ARTIFACTS["rf_regressor"] is None:
            raise HTTPException(status_code=503, detail="Regressor model is not ready.")

    scaled_vec = _prepare_vector(req.features)
    
    # Filter only regression features
    selected = ARTIFACTS["selected_features"]
    reg_features = ARTIFACTS["reg_features"]
    reg_indices = [selected.index(c) for c in reg_features if c in selected]
    
    reg_scaled_vec = scaled_vec[:, reg_indices]
    log_duration = float(ARTIFACTS["rf_regressor"].predict(reg_scaled_vec)[0])
    raw_duration_microsec = float(np.expm1(log_duration))

    return {
        "predicted_log1p_duration": round(log_duration, 4),
        "predicted_duration_microseconds": round(max(0.0, raw_duration_microsec), 2),
        "predicted_duration_seconds": round(max(0.0, raw_duration_microsec) / 1e6, 4),
    }

@app.post("/predict/batch")
def predict_batch(req: BatchRequest):
    if ARTIFACTS["rf_classifier"] is None:
        load_artifacts()
        if ARTIFACTS["rf_classifier"] is None:
            raise HTTPException(status_code=503, detail="Classifier model is not ready.")

    model = _resolve_model(req.model_choice)
    results = []
    for item in req.records:
        scaled_vec = _prepare_vector(item)
        pred = int(model.predict(scaled_vec)[0])
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(scaled_vec)[0]
            p1 = float(probs[1]) if len(probs) > 1 else float(probs[0])
        elif hasattr(model, "decision_function"):
            df_val = float(model.decision_function(scaled_vec)[0])
            p1 = float(1.0 / (1.0 + np.exp(-df_val)))
        else:
            p1 = float(pred)
        results.append({
            "prediction": "ATTACK" if pred == 1 else "BENIGN",
            "is_attack": pred,
            "attack_probability": round(p1, 4),
        })

    attack_count = sum(r["is_attack"] for r in results)
    return {
        "total_records": len(results),
        "detected_attacks": attack_count,
        "detected_benign": len(results) - attack_count,
        "attack_ratio": round(attack_count / max(1, len(results)), 4),
        "predictions": results,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
