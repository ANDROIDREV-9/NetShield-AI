# 🛡️ Log File Parsing for Cybersecurity Intrusion Detection
> **Machine Learning Capstone Project — 23CSE301**  
> Canadian Institute for Cybersecurity IDS 2017 Dataset

[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://python.org)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.x-orange?logo=scikit-learn)](https://scikit-learn.org)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.x-green)](https://xgboost.readthedocs.io)
[![Streamlit](https://img.shields.io/badge/GUI-Streamlit-red?logo=streamlit)](https://streamlit.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 📌 Project Overview

This project builds a complete, production-grade **Machine Learning pipeline** for **network intrusion detection** using the CICIDS 2017 dataset — a real-world, labeled benchmark dataset of network traffic flows captured over five days at the Canadian Institute for Cybersecurity.

| Component | Details |
|---|---|
| **Domain** | Cybersecurity + Machine Learning |
| **Dataset** | [CICIDS 2017](https://www.unb.ca/cic/datasets/ids-2017.html) |
| **Records** | 2,830,743 network flows across 8 CSV files |
| **Features** | 79 raw → 30 selected after engineering |
| **Attack Types** | 14 categories (DoS, DDoS, PortScan, Web Attacks, etc.) |

---

## 🗂️ Repository Structure

```
MLREVIEW1/
├── IDS_ML_Project.ipynb       # Main capstone notebook (end-to-end)
├── notebooks/
│   ├── regression.ipynb       # 10 regression algorithms (deep-dive)
│   └── classification.ipynb   # 5 classification algorithms (deep-dive)
├── src/
│   ├── data_loader.py         # Phase 1: Data ingestion & merging
│   ├── preprocessing.py       # Phase 2: Cleaning (NaN, Inf, Dups)
│   ├── feature_engineering.py # Phase 3: Correlation pruning & RF importance
│   ├── data_split.py          # Phase 4: Leakage-free split + SMOTE
│   ├── train_classification.py# Phase 5: Part A — 5 classifiers
│   ├── train_regression.py    # Phase 6: Part B — 10 regressors
│   └── advanced_analytics.py  # Phase 7: PCA, CV, Multiclass
├── app/
│   ├── backend.py             # FastAPI inference API
│   └── frontend.py            # Streamlit interactive dashboard
├── models/                    # Saved model artifacts (.joblib)
├── results/                   # Generated plots and metrics
├── data/
│   └── README_data.txt        # Dataset citation & download guide
├── requirements.txt
└── README.md
```

---

## ⚙️ Pipeline

```
Raw CSVs  ──►  Data Ingestion  ──►  Cleaning  ──►  Feature Engineering
                                                           │
                                                    Train/Test Split
                                                           │
                                                         SMOTE
                                                    ┌──────┴──────┐
                                                 Part A         Part B
                                             (5 Classifiers) (10 Regressors)
                                                    └──────┬──────┘
                                                    Evaluation & GUI
```

---

## 🔬 Part A — Classification (Binary IDS)

**Objective:** Predict whether a network flow is **BENIGN (0)** or an **ATTACK (1)**.

| # | Algorithm | Best Metric |
|---|-----------|------------|
| A1 | Logistic Regression | F1 ≈ 0.84 |
| A2 | Decision Tree | F1 ≈ 0.99 |
| A3 | Random Forest | F1 ≈ 0.99 |
| A4 | XGBoost | F1 ≈ 0.99 |
| A5 | K-Nearest Neighbors | F1 ≈ 0.99 |

---

## 📈 Part B — Regression (Flow Duration Prediction)

**Objective:** Predict `log1p(Flow Duration)` — a continuous anomaly indicator.

| # | Algorithm | R² Score |
|---|-----------|---------|
| B1 | Linear Regression | ≈ 0.65 |
| B6 | Random Forest Regressor | ≈ 0.9999 |
| B8 | XGBoost Regressor | ≈ 0.9999 |
| B9 | LightGBM Regressor | ≈ 0.9999 |

---

## 🖥️ GUI — Live Intrusion Detection Dashboard

```bash
# Backend (FastAPI inference API)
uvicorn app.backend:app --reload --port 8000

# Frontend (Streamlit dashboard)
streamlit run app/frontend.py
```

Open **http://localhost:8501** to interact with the live IDS.

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/MLREVIEW1.git
cd MLREVIEW1

# 2. Install dependencies
pip install -r requirements.txt

# 3. Download the CICIDS 2017 dataset
# See data/README_data.txt for instructions

# 4. Run the full pipeline
python src/data_loader.py
python src/preprocessing.py
python src/feature_engineering.py
python src/data_split.py
python src/train_classification.py
python src/train_regression.py

# 5. Launch the GUI
streamlit run app/frontend.py
```

---

## 📦 Dependencies

```
pandas, numpy, scikit-learn, xgboost, lightgbm
imbalanced-learn, matplotlib, seaborn
fastapi, uvicorn, streamlit, joblib
```

---

## 📚 Dataset Citation

> Iman Sharafaldin, Arash Habibi Lashkari, and Ali A. Ghorbani,
> "Toward Generating a New Intrusion Detection Dataset and Intrusion Traffic Characterization",
> 4th International Conference on Information Systems Security and Privacy (ICISSP), 2018.

---

## 👤 Author

**Aniruddha Mandal — 23CSE301 Machine Learning Capstone**  
Dataset: [https://www.unb.ca/cic/datasets/ids-2017.html](https://www.unb.ca/cic/datasets/ids-2017.html)
