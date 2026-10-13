"""
app/frontend.py
===============
Interactive Streamlit Dashboard for NetShield-AI
Cybersecurity Intrusion Detection & Log Analysis

Features:
  1. Real-Time Flow Inspector (with 1-click attack/benign sample presets)
  2. Batch Log File Parsing (Upload CSV & detect attacks)
  3. Continuous Flow Duration Anomaly Regression
  4. Model Benchmark Explorer & Performance Visualizations
"""

import os
import sys
import json
import time
import joblib
import numpy as np
import pandas as pd
import streamlit as st

# Setup paths
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(PROJECT_ROOT, "models")
RESULTS_DIR = os.path.join(PROJECT_ROOT, "results")

st.set_page_config(
    page_title="NetShield-AI | Intrusion Detection System",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown("""
<style>
    .main-title {
        font-size: 2.3rem;
        font-weight: 800;
        color: #1E3A8A;
        margin-bottom: 0px;
    }
    .sub-title {
        font-size: 1.1rem;
        color: #4B5563;
        margin-bottom: 1.5rem;
    }
    .metric-card {
        background-color: #F8FAFC;
        padding: 1.2rem;
        border-radius: 10px;
        border: 1px solid #E2E8F0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .status-badge-benign {
        background-color: #DEF7EC;
        color: #03543F;
        padding: 6px 16px;
        border-radius: 20px;
        font-weight: 700;
        font-size: 1.2rem;
        display: inline-block;
    }
    .status-badge-attack {
        background-color: #FDE8E8;
        color: #9B1C1C;
        padding: 6px 16px;
        border-radius: 20px;
        font-weight: 700;
        font-size: 1.2rem;
        display: inline-block;
    }
</style>
""", unsafe_allow_html=True)

@st.cache_resource
def load_models():
    artifacts = {}
    try:
        scaler_path = os.path.join(MODELS_DIR, "scaler.joblib")
        feat_path = os.path.join(MODELS_DIR, "selected_features.joblib")
        reg_feat_path = os.path.join(MODELS_DIR, "reg_features.joblib")
        rf_cls_path = os.path.join(MODELS_DIR, "rf_classifier.joblib")
        dt_cls_path = os.path.join(MODELS_DIR, "dt_classifier.joblib")
        rf_reg_path = os.path.join(MODELS_DIR, "rf_regressor.joblib")
        meta_path = os.path.join(MODELS_DIR, "feature_metadata.json")
        samples_path = os.path.join(MODELS_DIR, "sample_test_records.json")

        if os.path.exists(scaler_path): artifacts["scaler"] = joblib.load(scaler_path)
        if os.path.exists(feat_path): artifacts["selected_features"] = joblib.load(feat_path)
        if os.path.exists(reg_feat_path): artifacts["reg_features"] = joblib.load(reg_feat_path)
        if os.path.exists(rf_cls_path): artifacts["rf_cls"] = joblib.load(rf_cls_path)
        if os.path.exists(dt_cls_path): artifacts["dt_cls"] = joblib.load(dt_cls_path)
        if os.path.exists(rf_reg_path): artifacts["rf_reg"] = joblib.load(rf_reg_path)
        if os.path.exists(meta_path):
            with open(meta_path, "r", encoding="utf-8") as f:
                artifacts["meta"] = json.load(f)
        if os.path.exists(samples_path):
            with open(samples_path, "r", encoding="utf-8") as f:
                artifacts["samples"] = json.load(f)
    except Exception as e:
        st.error(f"Error loading models: {e}")
    return artifacts

artifacts = load_models()

# Sidebar
st.sidebar.image("https://img.icons8.com/fluency/96/shield.png", width=70)
st.sidebar.title("NetShield-AI")
st.sidebar.markdown("**Intrusion Detection System**")
st.sidebar.markdown("---")

app_mode = st.sidebar.radio(
    "Navigation Mode",
    ["🔍 Live Flow Inspector", "📂 Batch Log File Parsing", "📊 Benchmark & Analytics", "ℹ️ Project Info"]
)

model_choice = st.sidebar.selectbox(
    "Classifier Engine",
    ["Random Forest (Production)", "Decision Tree (Fast)"]
)

st.sidebar.markdown("---")
st.sidebar.info(
    "**Author:** Aniruddha Mandal\n\n"
    "**Dataset:** CICIDS 2017 (Canadian Institute for Cybersecurity)\n\n"
    "**Course:** 23CSE301 ML Capstone"
)

# Check readiness
if "rf_cls" not in artifacts or artifacts["rf_cls"] is None:
    st.warning("⚠️ Model artifacts not detected in `models/`. Please train them using `python scripts/train_and_export_models.py`.")
    if st.button("🚀 Train & Export Models Now"):
        with st.spinner("Training models and exporting artifacts..."):
            os.system(f"{sys.executable} {os.path.join(PROJECT_ROOT, 'scripts', 'train_and_export_models.py')}")
            st.cache_resource.clear()
            st.rerun()
    st.stop()

selected_features = artifacts.get("selected_features", [])
meta = artifacts.get("meta", {})
samples = artifacts.get("samples", [])
scaler = artifacts.get("scaler")
reg_features = artifacts.get("reg_features", [])

# =========================================================================
# MODE 1: LIVE FLOW INSPECTOR
# =========================================================================
if app_mode == "🔍 Live Flow Inspector":
    st.markdown('<div class="main-title">🛡️ Real-Time Network Flow Inspector</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-title">Inspect individual network packet flows to detect cyber intrusions and predict connection durations.</div>', unsafe_allow_html=True)

    # 1-Click Preset Selector
    st.markdown("#### ⚡ 1-Click Attack Preset Selector")
    preset_names = [f"{s['label']} (Ground Truth: {'ATTACK' if s['is_attack']==1 else 'BENIGN'})" for s in samples] if samples else []
    preset_idx = st.selectbox("Select a benchmark traffic pattern:", ["Custom Manual Input"] + preset_names)

    feature_values = {}
    if preset_idx != "Custom Manual Input" and samples:
        sel_sample = samples[preset_names.index(preset_idx)]
        feature_values = sel_sample.get("features", {})
        st.info(f"Loaded preset for **{sel_sample['label']}**. You can modify parameters below before classification.")

    st.markdown("---")
    st.markdown("#### 🎛️ Network Flow Feature Parameters")

    # Split top features into 3 columns
    cols = st.columns(3)
    display_features = selected_features[:15] if selected_features else []

    for i, feat in enumerate(display_features):
        col_idx = i % 3
        feat_info = meta.get(feat, {"min": 0.0, "max": 1000.0, "median": 10.0})
        min_v = float(feat_info.get("min", 0.0))
        max_v = max(float(feat_info.get("max", 100.0)), min_v + 1.0)
        default_v = float(feature_values.get(feat, feat_info.get("median", min_v)))

        with cols[col_idx]:
            val = st.number_input(
                f"{feat}",
                min_value=min_v,
                max_value=max(max_v, default_v * 1.5 + 10.0),
                value=float(default_v),
                key=f"input_{feat}"
            )
            feature_values[feat] = val

    # Fill any remaining selected features with median
    for feat in selected_features:
        if feat not in feature_values:
            feature_values[feat] = float(meta.get(feat, {}).get("median", 0.0))

    st.markdown("<br>", unsafe_allow_html=True)
    if st.button("🚀 Analyze Network Flow", type="primary", use_container_width=True):
        # Prepare vector
        vec = np.array([feature_values[f] for f in selected_features]).reshape(1, -1)
        scaled_vec = scaler.transform(vec)

        # Run Classifier
        clf = artifacts["rf_cls"] if "Random Forest" in model_choice else artifacts["dt_cls"]
        pred = int(clf.predict(scaled_vec)[0])
        probs = clf.predict_proba(scaled_vec)[0] if hasattr(clf, "predict_proba") else [0.0, 1.0]

        # Run Regressor
        reg = artifacts.get("rf_reg")
        reg_pred_log, reg_pred_sec = None, None
        if reg and reg_features:
            reg_idx = [selected_features.index(c) for c in reg_features if c in selected_features]
            reg_vec = scaled_vec[:, reg_idx]
            reg_pred_log = float(reg.predict(reg_vec)[0])
            reg_pred_sec = max(0.0, float(np.expm1(reg_pred_log))) / 1e6

        # Display Results
        st.markdown("---")
        st.markdown("### 📋 Intrusion Detection Analysis Result")
        
        res_col1, res_col2, res_col3 = st.columns([1.5, 1.5, 2])

        with res_col1:
            st.markdown("##### Verdict")
            if pred == 1:
                st.markdown('<div class="status-badge-attack">🚨 INTRUSION DETECTED</div>', unsafe_allow_html=True)
                st.error("Malicious network flow signature identified.")
            else:
                st.markdown('<div class="status-badge-benign">✅ BENIGN TRAFFIC</div>', unsafe_allow_html=True)
                st.success("Normal communication pattern verified.")

        with res_col2:
            st.markdown("##### Threat Confidence")
            attack_prob = probs[1]
            st.metric("Attack Probability", f"{attack_prob * 100:.2f}%")
            st.progress(float(attack_prob))

        with res_col3:
            st.markdown("##### Flow Duration Regressor")
            if reg_pred_sec is not None:
                st.metric("Predicted Flow Duration", f"{reg_pred_sec:.4f} sec", f"log1p: {reg_pred_log:.2f}")
                if reg_pred_sec < 0.001 and pred == 1:
                    st.caption("⚡ Extremely rapid connection length (typical for PortScan or SYN floods).")
                elif reg_pred_sec > 10.0 and pred == 1:
                    st.caption("⏳ Prolonged connection length (typical for Slowloris or persistent DoS).")

# =========================================================================
# MODE 2: BATCH LOG FILE PARSING
# =========================================================================
elif app_mode == "📂 Batch Log File Parsing":
    st.markdown('<div class="main-title">📂 Batch Network Log File Parser</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-title">Upload raw or pre-processed network flow CSV logs to scan an entire traffic capture.</div>', unsafe_allow_html=True)

    uploaded_file = st.file_uploader("Upload Network Flow Log CSV", type=["csv"])

    demo_btn = st.button("🧪 Or Load 500-Flow Benchmark Sample")

    df_batch = None
    if uploaded_file is not None:
        try:
            df_batch = pd.read_csv(uploaded_file, low_memory=False)
            df_batch.columns = df_batch.columns.str.strip()
            st.success(f"Uploaded log file with {len(df_batch):,} records.")
        except Exception as e:
            st.error(f"Error reading CSV: {e}")
    elif demo_btn:
        # Load sample from raw file if present
        try:
            raw_file = os.path.join(PROJECT_ROOT, "Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv")
            if os.path.exists(raw_file):
                df_batch = pd.read_csv(raw_file, nrows=500, low_memory=False)
                df_batch.columns = df_batch.columns.str.strip()
                st.info("Loaded 500 benchmark flows from Friday PortScan capture.")
        except Exception as e:
            st.warning("Could not load sample file directly.")

    if df_batch is not None:
        st.dataframe(df_batch.head(5), use_container_width=True)

        if st.button("🔍 Scan All Records for Cyber Threats", type="primary"):
            with st.spinner("Processing network flow batch..."):
                # Align columns
                aligned_df = pd.DataFrame(index=df_batch.index)
                for feat in selected_features:
                    if feat in df_batch.columns:
                        aligned_df[feat] = pd.to_numeric(df_batch[feat], errors="coerce").fillna(0.0)
                    else:
                        aligned_df[feat] = float(meta.get(feat, {}).get("median", 0.0))

                scaled_batch = scaler.transform(aligned_df)
                clf = artifacts["rf_cls"] if "Random Forest" in model_choice else artifacts["dt_cls"]
                preds = clf.predict(scaled_batch)
                probs = clf.predict_proba(scaled_batch)[:, 1] if hasattr(clf, "predict_proba") else preds

                df_batch["Prediction"] = np.where(preds == 1, "ATTACK", "BENIGN")
                df_batch["Threat_Confidence"] = np.round(probs, 4)

                attack_count = int(np.sum(preds == 1))
                benign_count = int(np.sum(preds == 0))
                total = len(df_batch)

                st.markdown("### 📊 Scan Summary")
                m1, m2, m3, m4 = st.columns(4)
                m1.metric("Total Flows", f"{total:,}")
                m2.metric("Attacks Detected", f"{attack_count:,}", f"{(attack_count/total)*100:.1f}%", delta_color="inverse")
                m3.metric("Benign Flows", f"{benign_count:,}")
                m4.metric("Threat Status", "ELEVATED" if attack_count > 0 else "NORMAL")

                # Results Table
                st.markdown("#### Detailed Scan Findings")
                st.dataframe(df_batch[["Prediction", "Threat_Confidence"] + [c for c in df_batch.columns if c not in ["Prediction", "Threat_Confidence"]][:8]], use_container_width=True)

                # Export
                csv_data = df_batch.to_csv(index=False).encode("utf-8")
                st.download_button("💾 Download Annotated Threat Log", csv_data, "threat_detected_logs.csv", "text/csv")

# =========================================================================
# MODE 3: BENCHMARK & ANALYTICS
# =========================================================================
elif app_mode == "📊 Benchmark & Analytics":
    st.markdown('<div class="main-title">📊 Model Benchmark & Analytics</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-title">Empirical evaluation metrics and visual comparisons across all models.</div>', unsafe_allow_html=True)

    tab1, tab2, tab3 = st.tabs(["Regression Track (10 Models)", "Classification Track", "Diagnostic Visualizations"])

    with tab1:
        st.markdown("#### 📈 Review 1: 10 Regression Algorithms Performance")
        reg_table = pd.DataFrame([
            {"Algorithm": "Random Forest Regressor", "R2 Score": 0.9999, "RMSE": 0.0489, "MAE": 0.0143, "Status": "Top Performer"},
            {"Algorithm": "Decision Tree Regressor", "R2 Score": 0.9998, "RMSE": 0.0790, "MAE": 0.0299, "Status": "Runner-Up"},
            {"Algorithm": "Gradient Boosting Regressor", "R2 Score": 0.9994, "RMSE": 0.1241, "MAE": 0.0746, "Status": "High Accuracy"},
            {"Algorithm": "XGBoost Regressor", "R2 Score": 0.9993, "RMSE": 0.1382, "MAE": 0.0812, "Status": "High Accuracy"},
            {"Algorithm": "LightGBM Regressor", "R2 Score": 0.9989, "RMSE": 0.1754, "MAE": 0.1042, "Status": "Fast Gradient Boost"},
            {"Algorithm": "KNN Regressor (k=5)", "R2 Score": 0.9561, "RMSE": 1.1062, "MAE": 0.4715, "Status": "Distance-Based"},
            {"Algorithm": "Support Vector Regressor (SVR)", "R2 Score": 0.8043, "RMSE": 2.3350, "MAE": 1.5042, "Status": "Kernel Scaled"},
            {"Algorithm": "Ridge Regression (alpha=1.0)", "R2 Score": 0.6547, "RMSE": 3.1013, "MAE": 2.4778, "Status": "L2 Regularized"},
            {"Algorithm": "Linear Regression", "R2 Score": 0.6547, "RMSE": 3.1014, "MAE": 2.4778, "Status": "Baseline"},
            {"Algorithm": "Lasso Regression", "R2 Score": 0.6455, "RMSE": 3.1422, "MAE": 2.4987, "Status": "L1 Sparse"},
            {"Algorithm": "ElasticNet Regression", "R2 Score": 0.6442, "RMSE": 3.1482, "MAE": 2.4978, "Status": "Combined L1+L2"},
            {"Algorithm": "Polynomial Regression (Deg 3)", "R2 Score": 0.6428, "RMSE": 3.1546, "MAE": 2.6712, "Status": "Feature Expansion"},
        ])
        st.dataframe(reg_table, use_container_width=True)

    with tab2:
        st.markdown("#### 🛡️ Classification Track Performance")
        clf_table = pd.DataFrame([
            {"Algorithm": "Random Forest Classifier", "Accuracy": 0.9998, "Precision": 0.9998, "Recall": 0.9998, "F1-Score": 0.9998, "ROC-AUC": 0.9999},
            {"Algorithm": "XGBoost Classifier", "Accuracy": 0.9996, "Precision": 0.9996, "Recall": 0.9996, "F1-Score": 0.9996, "ROC-AUC": 0.9998},
            {"Algorithm": "K-Nearest Neighbors", "Accuracy": 0.9934, "Precision": 0.9933, "Recall": 0.9934, "F1-Score": 0.9933, "ROC-AUC": 0.9942},
            {"Algorithm": "Decision Tree Classifier", "Accuracy": 0.9914, "Precision": 0.9915, "Recall": 0.9914, "F1-Score": 0.9914, "ROC-AUC": 0.9959},
            {"Algorithm": "Gaussian Naive Bayes", "Accuracy": 0.8654, "Precision": 0.8669, "Recall": 0.8654, "F1-Score": 0.8661, "ROC-AUC": 0.8300},
            {"Algorithm": "Support Vector Classifier (SVC)", "Accuracy": 0.8644, "Precision": 0.9196, "Recall": 0.8644, "F1-Score": 0.8772, "ROC-AUC": 0.9667},
            {"Algorithm": "Logistic Regression", "Accuracy": 0.8253, "Precision": 0.9076, "Recall": 0.8253, "F1-Score": 0.8443, "ROC-AUC": 0.9440},
        ])
        st.dataframe(clf_table, use_container_width=True)

    with tab3:
        st.markdown("#### 🖼️ Diagnostic Plots from Pipeline")
        p_files = [f for f in os.listdir(PROJECT_ROOT) if f.startswith("plot_") and f.endswith(".png")]
        if p_files:
            sel_plot = st.selectbox("Select Generated Visualization:", p_files)
            st.image(os.path.join(PROJECT_ROOT, sel_plot), use_container_width=True)
        else:
            st.info("No plot PNGs found in root directory.")

# =========================================================================
# MODE 4: PROJECT INFO
# =========================================================================
elif app_mode == "ℹ️ Project Info":
    st.markdown('<div class="main-title">ℹ️ About NetShield-AI</div>', unsafe_allow_html=True)
    st.markdown("""
    **NetShield-AI** is an end-to-end Machine Learning pipeline designed for advanced network intrusion detection and automated log file parsing. Built on the benchmark CICIDS 2017 dataset, the system processes over 2.8 million network flows across 79 features.

    ### 🎓 Capstone Rubric Highlights (23CSE301)
    - **Dataset Audit & Cleaning:** Handled CICFlowMeter division-by-zero infinite values, zero-variance columns, and missing values.
    - **Leakage-Free Splitting:** StandardScaler and SMOTE applied strictly to training partitions.
    - **Regression Track (10 Models):** Evaluated linear, regularized, polynomial, boosting, and tree regressors predicting `log1p(Flow Duration)`.
    - **Classification Track:** Evaluated both base (Review 1 Part A) and ensemble (Review 2 Part B) models.
    - **Interactive GUI (Bonus Deliverable):** Production web application built with Streamlit and FastAPI.
    """)
