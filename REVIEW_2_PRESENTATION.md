# 🎤 Review 2 Presentation Guide – 23CSE301 Machine Learning Capstone
## "NetShield-AI: Advanced Ensembles, Neural Classifiers, Unsupervised Clustering & Full-Stack Deployment"
> **Canadian Institute for Cybersecurity — CICIDS 2017 Dataset**  
> **Course:** 23CSE301 — Machine Learning, Academic Year 2026–27  
> **Author:** Aniruddha Mandal  

---

## Slide 1 — Title & Review 2 Scope

### What to Show
- **Project Title:** NetShield-AI: Automated Network Intrusion Detection & Telemetry Analytics
- **Review 2 Scope:**
  1. **Classification Part B:** 5 Advanced Non-Linear & Ensemble Models (RF, AdaBoost, Gradient Boosting, Bagging, MLP)
  2. **Consolidated 10-Algorithm Benchmark:** Single unified comparison table across Part A & Part B (Deliverable D6)
  3. **Champion Model Selection & Justification:** Multi-metric and latency trade-off analysis
  4. **Clustering Track:** K-Means (Elbow) & Agglomerative Hierarchical (Dendrogram & Linkage Comparison)
  5. **Unsupervised Evaluation Metrics:** Silhouette Score, Davies-Bouldin Index, Calinski-Harabasz Index
  6. **Dimensionality Reduction:** 2D Projections via PCA & t-SNE
  7. **Bonus Full-Stack Application (+2 Marks):** FastAPI REST backend + Streamlit SOC Dashboard

### What to Say
> *"Good morning/afternoon evaluators. In Review 1, we established our data cleaning pipeline, completed the 10-model regression track on flow duration, and built our baseline Part A classifiers. Today in Review 2, we present our complete advanced classification benchmark with 5 ensemble and deep learning architectures, consolidate the full 10-algorithm comparison, implement the mandatory unsupervised clustering track with K-Means and Agglomerative Hierarchical clustering, and demonstrate our bonus full-stack web application with FastAPI and Streamlit."*

---

## Slide 2 — Review 1 Recap to Review 2 Bridge

### What to Show
- **Review 1 Accomplishments:**
  - Ingestion of 2.83M rows across 8 PCAP CSV captures; 6-stage cleaning pipeline with zero data leakage.
  - Regression Track: 10 algorithms predicting `log1p(Flow Duration)`, with Random Forest ($R^2 = 0.9999$) and 5-fold CV.
  - Classification Part A: Logistic Regression, KNN, Gaussian Naive Bayes, Decision Tree, and Support Vector Classifier.
- **Review 2 Objectives:**
  - Overcome the high variance of individual decision trees and linear boundary limits of Part A models.
  - Train 5 advanced ensemble and deep learning architectures on the identical held-out test split.
  - Implement unsupervised cluster discovery to detect latent attack structure without labels.

### What to Say
> *"In Review 1, our baseline decision tree achieved strong accuracy but exhibited high sensitivity to noise and single-tree variance. In Review 2, we introduce variance-reduction and bias-reduction ensembles: Random Forest, Bagging, AdaBoost, Gradient Boosting, and a Multi-Layer Perceptron neural network. Crucially, all models are evaluated on the exact same held-out test partition to guarantee absolute scientific fairness."*

---

## Slide 3 — Classification Part B: Algorithms & Architectures

### What to Show
Table of the 5 Part B models:
1. **Random Forest Classifier:** Ensemble of 100 decorrelated decision trees using bootstrap aggregation and random feature subspacing ($\sqrt{p}$).
2. **AdaBoost Classifier:** Stage-wise boosting with 100 decision stumps adaptively re-weighting misclassified network records.
3. **Gradient Boosting Classifier (GBM / XGBoost):** Stage-wise additive gradient tree boosting optimizing negative log-likelihood with learning rate $\eta = 0.1$.
4. **Bagging Classifier:** Bootstrap aggregation wrapping deep Decision Tree base estimators to stabilize decision boundaries.
5. **Multi-Layer Perceptron (MLP):** Feedforward deep artificial neural network with hidden layers $(100, 50)$, ReLU non-linear activations, Adam optimizer, and early stopping.

### Key Technical Points
- **Bagging vs. Boosting:** Bagging reduces *variance* through parallel decorrelated averaging; Boosting reduces *bias* through sequential gradient correction.
- **Neural Network Scaling:** Standard scaling fit strictly on training data; prevents gradient explosion in backpropagation.

---

## Slide 4 — Consolidated 10-Algorithm Classification Benchmark (Deliverable D6)

### What to Show
The official single consolidated comparison table sorted by Weighted F1-Score:

| Rank | Algorithm | Curriculum Scope | Accuracy | Precision | Recall | Weighted F1 | ROC-AUC |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **1** | **Random Forest Classifier** | **Review 2 (Part B)** | **0.9958** | **0.9804** | **0.9953** | **0.9878** | **0.9999** |
| **2** | **Gradient Boosting (GBM)** | **Review 2 (Part B)** | **0.9951** | **0.9742** | **0.9974** | **0.9857** | **0.9999** |
| **3** | **Decision Tree Classifier** | **Review 1 (Part A)** | 0.9946 | 0.9746 | 0.9941 | 0.9843 | 0.9990 |
| **4** | **Bagging Classifier (DT Base)** | **Review 2 (Part B)** | 0.9945 | 0.9737 | 0.9945 | 0.9840 | 0.9995 |
| **5** | **K-Nearest Neighbors (k=7)** | **Review 1 (Part A)** | 0.9831 | 0.9481 | 0.9520 | 0.9501 | 0.9959 |
| **6** | **MLP Neural Network** | **Review 2 (Part B)** | 0.9774 | 0.8915 | 0.9864 | 0.9365 | 0.9971 |
| **7** | **Support Vector Classifier (SVC)**| **Review 1 (Part A)** | 0.9599 | 0.8402 | 0.9414 | 0.8879 | 0.9854 |
| **8** | **AdaBoost Classifier** | **Review 2 (Part B)** | 0.9476 | 0.7937 | 0.9315 | 0.8571 | 0.9726 |
| **9** | **Logistic Regression** | **Review 1 (Part A)** | 0.9079 | 0.6587 | 0.9431 | 0.7757 | 0.9726 |
| **10**| **Gaussian Naive Bayes** | **Review 1 (Part A)** | 0.2566 | 0.1840 | 0.9907 | 0.3103 | 0.6403 |

### What to Say
> *"As shown in our consolidated 10-algorithm benchmark table, ensemble methods dominate the top tier. Random Forest leads with a Weighted F1 of 0.9878 and ROC-AUC of 0.9999, followed closely by Gradient Boosting at 0.9857. Naive Bayes performs poorly (0.3103 F1) because network telemetry violates its core assumption of feature independence. The neural network achieves 0.9365 F1, demonstrating strong non-linear boundary modeling but requiring more tuning than tree ensembles."*

---

## Slide 5 — Diagnostic Plots: ROC Curves & Feature Importance

### What to Show
- **Consolidated 10-Model ROC Curve:** Shows all 10 ROC curves plotted simultaneously. Random Forest and Gradient Boosting hug the top-left coordinate $(0, 1)$ with near-perfect AUC (0.9999).
- **Feature Importance Comparison (RF vs. GBM):**
  - **Random Forest (Mean Decrease in Impurity):** Highlights `bytes_per_fwd_pkt`, `Init_Win_bytes_forward`, `Flow IAT Mean`.
  - **Gradient Boosting (Relative Gain):** Heavily weights `Total Length of Fwd Packets` and TCP handshake window sizes.

### What to Say
> *"The ROC curves reveal the true discrimination power of our models across all operating thresholds. Both tree ensembles achieve an AUC of 0.9999. In the feature importance plot, we observe that our engineered domain feature `bytes_per_fwd_pkt` is consistently ranked in the top 3 most predictive features by both Random Forest and Gradient Boosting."*

---

## Slide 6 — Champion Model Selection & Trade-Off Analysis (Criterion A3)

### What to Show
- **Selected Champion:** **Random Forest Classifier**
- **Trade-Off Comparison:**

| Architectural Metric | Random Forest (Champion) | Gradient Boosting | MLP Neural Network | Decision Tree |
|---|---|---|---|---|
| **Weighted F1-Score** | **0.9878** (Top Tier) | 0.9857 | 0.9365 | 0.9843 |
| **Detection Recall** | **0.9953** (Minimizes Misses) | **0.9974** | 0.9864 | 0.9941 |
| **Inference Latency** | **< 0.05 ms / flow** | < 0.10 ms / flow | 0.40 ms / flow | **< 0.01 ms / flow** |
| **Overfitting Resistance** | **High** (Variance Averaging) | Medium (Needs shrinkage) | Medium (Needs dropout) | Low (Single tree) |
| **Line-Rate Deployability**| **10 Gbps Ready** | 5 Gbps | Requires GPU | 10 Gbps |

### Justification Summary
1. **Superior Detection & Reliability:** High F1 and 0.9999 ROC-AUC drastically reduce False Negatives on stealth attacks (PortScan, Slowloris).
2. **Fast Parallel Inference:** Forest tree traversals are embarrassingly parallel ($O(M \log N)$), enabling line-rate inspection in our FastAPI REST engine.
3. **Robustness to Noisy Flows:** Averaging decorrelated trees cancels transient network noise without overfitting.

---

## Slide 7 — Clustering Track: K-Means & Elbow Method

### What to Show
- **K-Means Clustering:** Partitioning $N$ network flow vectors into $k$ disjoint clusters minimizing within-cluster sum of squares (inertia):
  $$J = \sum_{j=1}^{k} \sum_{x_i \in C_j} \|x_i - \mu_j\|^2$$
- **Elbow Curve:** Evaluated across $k \in [2, 8]$. Marked inflection point (elbow) occurs at **$k = 3$**, after which inertia reduction flattens significantly.
- **Unsupervised Evaluation Metrics ($k = 3$):**
  - **Silhouette Score:** **0.9946** (Near-perfect cluster cohesion and separation).
  - **Davies-Bouldin Index:** **0.1305** (Low index confirms compact, well-separated clusters).
  - **Calinski-Harabasz Index:** **205,079.63** (Extremely high between-to-within variance ratio).

---

## Slide 8 — Clustering Track: Agglomerative Hierarchical & Linkage Comparison

### What to Show
- **Agglomerative Hierarchical Clustering:** Bottom-up linkage progressively merging closest clusters.
- **Truncated Dendrogram:** Top 30 truncated branches using Ward linkage; reveals 3 dominant natural root branches at Euclidean distance $> 200$.
- **Linkage Strategy Comparison:**

| Linkage Method | Criterion | Silhouette Score | Davies-Bouldin | Calinski-Harabasz | Cluster Balance |
|---|---|:---:|:---:|:---:|---|
| **Ward Linkage** | Minimizes total within-cluster variance | **0.9946** | **0.1305** | **205,079.63** | **Optimal** |
| **Complete Linkage** | Maximum pairwise distance | 0.9782 | 0.2140 | 142,310.12 | Moderate |
| **Average Linkage** | Mean pairwise distance | 0.9810 | 0.1895 | 168,940.45 | Moderate |

### Key Insight
> *"Ward linkage explicitly minimizes within-cluster variance, matching the natural spherical clusters of network flow profiles and producing identical optimal performance to K-Means."*

---

## Slide 9 — Dimensionality Reduction: PCA & t-SNE Projections

### What to Show
- **Dual PCA 2D Projection:**
  - Principal Component 1 (PC1) accounts for **27.4%** variance; PC2 accounts for **15.3%** variance (Cumulative: **42.7%**).
  - Plots show clear segregation between dense normal operational traffic and anomalous volumetric bursts.
  - Both K-Means and Agglomerative cluster labels map consistently to identical sub-regions.
- **Non-Linear t-SNE Projection (Perplexity = 30):**
  - Confirms dense, separated cluster manifolds corresponding to automated scanning and flood traffic.
- **Post-Hoc Ground-Truth Validation:**
  - Cross-tabulation shows Cluster 0 captures **99.8%** of benign flows, while Clusters 1 & 2 isolate volumetric DDoS and PortScan floods without ever seeing training labels!

---

## Slide 10 — Bonus Deliverable (+2 Marks): Full-Stack Interactive IDS Application

### What to Show
- **System Architecture:**
  - **Backend (FastAPI):** High-performance asynchronous REST microservice running on port 8000. Implements Pydantic schema validation, real-time feature normalization, and sub-millisecond inference.
  - **Frontend (Streamlit):** Interactive Security Operations Center (SOC) dashboard running on port 8501.
- **Live Capabilities Demonstrated:**
  1. Real-time telemetry input with pre-configured attack presets (DDoS, PortScan, DoS Hulk, Benign).
  2. Model switcher comparing predictions across Random Forest, Gradient Boosting, Decision Tree, and MLP.
  3. Continuous regression duration forecasting alongside attack risk probabilities.
  4. Decision threshold sensitivity sliders and radar feature visualizer.
- **Automated App Verification:**
  - `python tests/test_app.py` passes 100% of real attack vector test samples with zero false classifications.

---

## Slide 11 — Repository Quality & Guidelines Compliance

### What to Show
- **Official Rubric Compliance:**
  - 100% cell execution across all 4 notebooks with all 39 plots embedded inline (no loose files).
  - 20 modular git commits tracking milestones from Review 1 to Review 2.
  - Open-source MIT License, comprehensive `README.md`, and clean directory structure.
  - Strict zero-leakage protocol across all tracks.

---

## Slide 12 — Conclusion & Key Findings

### Summary
1. **Ensemble Supremacy:** Random Forest and Gradient Boosting achieve $\approx 0.99$ F1 and $0.9999$ ROC-AUC, proving that variance reduction is critical for noisy network telemetry.
2. **Unsupervised Validation:** K-Means and Agglomerative clustering successfully isolate cyber intrusions ($0.9946$ Silhouette) in pure unsupervised settings.
3. **Full-Stack Deployment:** The bonus FastAPI + Streamlit application delivers production-ready sub-millisecond inference for enterprise SOC environments.
