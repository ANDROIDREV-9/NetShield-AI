# Log File Parsing for Cybersecurity Intrusion Detection
### 23CSE301 -- Machine Learning Capstone Project (Review 1)

---

## Team

| Name | Roll Number |
|------|-------------|
| [Student Name 1] | [Roll No] |

**Course:** 23CSE301 -- Machine Learning  
**Review:** Review 1 | September 2026

---

## Problem Statement

Traditional signature-based Intrusion Detection Systems (IDS) fail against zero-day exploits and polymorphic malware. This project applies machine learning to network flow telemetry from the CICIDS 2017 dataset to detect cyberattacks through statistical pattern recognition -- without relying on known signatures.

---

## Dataset

**Canadian Institute for Cybersecurity Intrusion Detection System 2017 (CICIDS 2017)**

| Property | Value |
|----------|-------|
| Source | https://www.unb.ca/cic/datasets/ids-2017.html |
| Total Records | 2,830,743 network flow records |
| Files | 8 PCAP-derived CSV captures (Monday-Friday) |
| Features | 78 statistical network-flow metrics (CICFlowMeter) |
| Attack Types | 14 categories including DDoS, PortScan, DoS variants, Web Attacks, Botnet |
| Citation | Sharafaldin et al., ICISSP 2018 |

---

## Repository Structure

`
MLREVIEW1/
|-- README.md
|-- requirements.txt
|-- REVIEW_1_CHECKLIST.md
|-- REVIEW_1_VIVA.md
|-- REVIEW_1_PRESENTATION.md
|-- data/
|   +-- README_data.txt
|-- notebooks/
|   |-- regression.ipynb       <- 10 Regression algorithms (EXECUTED)
|   |-- classification.ipynb   <- 5 Classification algorithms Part A (EXECUTED)
|   +-- clustering.ipynb       <- Review 2 roadmap
|-- models/
|-- scripts/
+-- app/
`

---

## Installation

`ash
pip install -r requirements.txt
`

## Run Notebooks

`ash
jupyter notebook notebooks/regression.ipynb
jupyter notebook notebooks/classification.ipynb
`

---

## Review 1 Results Summary

### Regression Track (Target: log1p(Flow Duration))

| Model | R2 | RMSE | MAE |
|-------|----|------|-----|
| Random Forest Regressor | 0.9999 | 0.0489 | 0.0143 |
| Decision Tree Regressor | 0.9998 | 0.0790 | 0.0299 |
| Gradient Boosting Regressor | 0.9994 | 0.1241 | 0.0746 |
| KNN Regressor | 0.9558 | 1.1100 | 0.4841 |
| Support Vector Regressor | 0.8043 | 2.3350 | 1.5042 |
| Linear Regression | 0.6547 | 3.1014 | 2.4778 |
| Ridge Regression | 0.6547 | 3.1014 | 2.4779 |
| Lasso Regression | 0.6455 | 3.1422 | 2.4987 |
| ElasticNet Regression | 0.6442 | 3.1482 | 2.4978 |
| Polynomial Regression (Deg 2) | 0.5762 | 3.4357 | 2.9526 |

### Classification Track Part A (Binary: BENIGN vs ATTACK)

| Model | Accuracy | Weighted F1 | ROC-AUC |
|-------|----------|-------------|---------|
| K-Nearest Neighbors | 0.9934 | 0.9933 | 0.9942 |
| Decision Tree Classifier | 0.9914 | 0.9914 | 0.9959 |
| Support Vector Classifier | 0.8644 | 0.8772 | 0.9667 |
| Gaussian Naive Bayes | 0.8654 | 0.8661 | 0.8300 |
| Logistic Regression | 0.8253 | 0.8443 | 0.9440 |

---

## Review 1 Scope

| Component | Status |
|-----------|--------|
| Dataset loading and EDA | PASS |
| Data cleaning and preprocessing | PASS |
| Feature engineering (3 features) | PASS |
| 10 Regression algorithms | PASS |
| Hyperparameter tuning (GridSearchCV on 2 models) | PASS |
| 5-Fold cross-validation | PASS |
| 5 Classification algorithms Part A | PASS |
| Confusion matrices and ROC curves | PASS |
| Clustering track | Prepared for Review 2 |

---

## AI Assistance Disclosure

AI code generation tools (Google Antigravity) were used for:
- Code scaffolding and boilerplate generation
- Repository structure and documentation templates

NOT used for:
- Fabricating model results or metrics
- Analysis interpretation (all observations from actual execution)

All numerical results are computed by executing code on the real CICIDS 2017 dataset.

---

## References

1. Sharafaldin, I., Habibi Lashkari, A., Ghorbani, A.A. (2018). Toward Generating a New Intrusion Detection Dataset and Intrusion Traffic Characterization. ICISSP 2018, pp. 108-116.
2. Canadian Institute for Cybersecurity. (2017). CIC-IDS-2017. University of New Brunswick.
3. Pedregosa, F. et al. Scikit-learn: Machine Learning in Python. JMLR 12, 2825-2830, 2011.
