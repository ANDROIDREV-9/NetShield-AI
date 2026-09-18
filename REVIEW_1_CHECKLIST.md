# 23CSE301 Machine Learning Capstone Project – Review 1 Checklist
## Log File Parsing for Cybersecurity Intrusion Detection (CICIDS 2017)

---

## 📌 Rubric to Implementation Mapping

### SECTION A: DATASET & EDA (4 Marks)
| Rubric Item | Status | Implementing File & Section | Evidence / Output |
|---|:---:|---|---|
| **Dataset shape** | **PASS** | `regression.ipynb` (Sec 5, 6), `classification.ipynb` (Sec 5, 6) | Total: 2,830,743 rows × 79 cols |
| **Number of rows and columns** | **PASS** | Both notebooks (Sec 5, 6) | `df_raw.shape` printed explicitly |
| **Data types** | **PASS** | Both notebooks (Sec 6) | Dtype breakdown: 78 numerical (float64/int64), 1 categorical (object) |
| **Missing-value counts** | **PASS** | Both notebooks (Sec 6, 7) | 288 missing values in `Flow Bytes/s`; audited and handled |
| **Target/class distribution** | **PASS** | Both notebooks (Sec 6, 7) | Complete 15-class table + binary split: 80.3% BENIGN vs 19.7% ATTACK |
| **Duplicate count** | **PASS** | Both notebooks (Sec 6, 7) | 308,381 duplicate records identified and removed |
| **Basic statistical summary** | **PASS** | Both notebooks (Sec 6) | Min, max, quartiles, mean, std across all features |
| **Categorical & numerical identification** | **PASS** | Both notebooks (Sec 6) | Explicit audit separating numerical and categorical columns |
| **Distribution plots for features** | **PASS** | Both notebooks (Sec 8, 9) | `reg_plot_01_target_dist.png`, `clf_plot_02_feature_distributions.png` |
| **Correlation heatmap** | **PASS** | Both notebooks (Sec 8, 9) | `reg_plot_02_correlation.png`, `clf_plot_03_correlation_heatmap.png` |
| **At least TWO scatter plots** | **PASS** | Both notebooks (Sec 8, 9) | `reg_plot_03_scatter_relationships.png`, `clf_plot_04_scatter_relationships.png` |
| **Insight commentary** | **PASS** | Under every major plot | Domain-grounded Markdown observations explaining real output |

---

### SECTION B: PREPROCESSING & FEATURE ENGINEERING (3 Marks)
| Rubric Item | Status | Implementing File & Section | Evidence / Output |
|---|:---:|---|---|
| **Missing values handled** | **PASS** | Both notebooks (Sec 7, 8) | Median imputation applied to numerical columns |
| **Duplicates handled** | **PASS** | Both notebooks (Sec 7, 8) | `drop_duplicates()` executed and audited |
| **Outliers investigated & handled** | **PASS** | Both notebooks (Sec 7, 8) | 99th percentile analyzed, extreme values clipped to float32 safe bounds |
| **Infinite values handled** | **PASS** | Both notebooks (Sec 7, 8) | CICFlowMeter division-by-zero artifacts replaced with column finite max |
| **Before & after cleaning summary** | **PASS** | Both notebooks (Sec 7, 8) | Summary DataFrame displaying rows, cols, missing, duplicates, infs |
| **Categorical encoding** | **PASS** | `classification.ipynb` (Sec 8) | Binary target `is_attack` (0 = BENIGN, 1 = ATTACK) created cleanly |
| **Scaling (StandardScaler)** | **PASS** | Both notebooks (Sec 10) | `StandardScaler()` fitted ONLY on `X_train`, transformed on `X_test` |
| **Zero Data Leakage** | **PASS** | Both notebooks (Sec 10) | Scaler fitted strictly after train/test split; zero test leakage |
| **Train/Test split** | **PASS** | Both notebooks (Sec 10) | 80% train / 20% test, `random_state=42`, stratified for classification |
| **Feature engineering (≥ 1)** | **PASS** | Both notebooks (Sec 9, 10) | 3 domain features: `bytes_per_fwd_pkt`, `fwd_bwd_pkt_ratio`, `total_bytes` |
| **Feature justification & formula** | **PASS** | Both notebooks (Sec 9, 10) | Full cybersecurity formulas and rationales documented |
| **No target leakage in features** | **PASS** | `regression.ipynb` (Sec 9) | `flow_bytes_duration` & rate cols audited and omitted from predictors |

---

### SECTION C: FULL REGRESSION TRACK (9 Marks – ALL 10 Algorithms)
| Rubric Item | Status | Implementing File & Section | Evidence / Output |
|---|:---:|---|---|
| **Defensible continuous target** | **PASS** | `regression.ipynb` (Sec 3, 8) | `log1p(Flow Duration)` (connection duration in microseconds) |
| **1. Linear Regression** | **PASS** | `regression.ipynb` (Sec 12.1) | Baseline OLS, top 5 positive and negative coefficients printed |
| **2. Ridge Regression** | **PASS** | `regression.ipynb` (Sec 12.2) | L2 regularization, alpha=10.0, parameter shrinkage demonstrated |
| **3. Lasso Regression** | **PASS** | `regression.ipynb` (Sec 12.3) | L1 regularization, alpha=0.01, sparsity count verified |
| **4. ElasticNet Regression** | **PASS** | `regression.ipynb` (Sec 12.4) | Convex L1+L2 combination, alpha=0.01, l1_ratio=0.5 |
| **5. Polynomial Regression** | **PASS** | `regression.ipynb` (Sec 12.5) | Degree 2 polynomial interactions on top features |
| **6. Decision Tree Regressor** | **PASS** | `regression.ipynb` (Sec 12.6) | Non-linear recursive partitioning, max_depth=12 |
| **7. Random Forest Regressor** | **PASS** | `regression.ipynb` (Sec 12.7) | Bagging ensemble of 100 decorrelated trees, max_depth=15 |
| **8. Gradient Boosting Regressor** | **PASS** | `regression.ipynb` (Sec 12.8) | Sequential residual boosting, n_estimators=100, lr=0.1 |
| **9. Support Vector Regressor (SVR)**| **PASS** | `regression.ipynb` (Sec 12.9) | RBF kernel, C=10.0, epsilon=0.1, scaled features |
| **10. KNN Regressor** | **PASS** | `regression.ipynb` (Sec 12.10)| k=7, distance-weighted, ball_tree spatial indexing |
| **R² Metric for all 10** | **PASS** | `regression.ipynb` (Sec 13) | Calculated from actual execution on identical test set |
| **RMSE Metric for all 10** | **PASS** | `regression.ipynb` (Sec 13) | Calculated from actual execution on identical test set |
| **MAE Metric for all 10** | **PASS** | `regression.ipynb` (Sec 13) | Calculated from actual execution on identical test set |
| **Consolidated comparison table** | **PASS** | `regression.ipynb` (Sec 13) | Single DataFrame with Model, R2, RMSE, MAE, Train_Time_s |
| **Models ranked by R² descending** | **PASS** | `regression.ipynb` (Sec 13) | Sorted by R2 descending; bar chart saved |
| **GridSearchCV on ≥ 2 models** | **PASS** | `regression.ipynb` (Sec 14) | Model 1: Random Forest Regressor; Model 2: Decision Tree Regressor |
| **Hyperparameter search space** | **PASS** | `regression.ipynb` (Sec 14) | Explicit param_grid dictionaries documented |
| **Best parameters reported** | **PASS** | `regression.ipynb` (Sec 14) | `grid.best_params_` printed for both models |
| **Tuned vs Baseline improvement** | **PASS** | `regression.ipynb` (Sec 14) | Quantitative delta in R² reported on held-out test set |
| **5-Fold Cross Validation (Top 2)** | **PASS** | `regression.ipynb` (Sec 15) | 5-Fold CV on top 2 models; Mean R² & Std Dev reported |
| **CV vs Test score comparison** | **PASS** | `regression.ipynb` (Sec 15) | Generalizability verified; low variance confirmed |
| **Predicted vs Actual plot** | **PASS** | `regression.ipynb` (Sec 16) | Scatter plot with 45-degree reference line |
| **Residual plot** | **PASS** | `regression.ipynb` (Sec 16) | Residuals vs Predicted scatter plot |
| **Tree feature importance plot** | **PASS** | `regression.ipynb` (Sec 16) | Horizontal bar chart of top 15 Gini importances |

---

### SECTION D: CLASSIFICATION TRACK PART A (3 Marks – ALL 5 Algorithms)
| Rubric Item | Status | Implementing File & Section | Evidence / Output |
|---|:---:|---|---|
| **Ground-truth target variable** | **PASS** | `classification.ipynb` (Sec 6, 8) | Actual CICIDS 2017 `Label` column |
| **1. Logistic Regression** | **PASS** | `classification.ipynb` (Sec 12.1)| `class_weight='balanced'`, coefficients displayed |
| **2. K-Nearest Neighbors Classifier** | **PASS** | `classification.ipynb` (Sec 12.2)| k=7, distance-weighted, on scaled features |
| **3. Gaussian Naive Bayes** | **PASS** | `classification.ipynb` (Sec 12.3)| Probabilistic baseline, conditional independence analyzed |
| **4. Decision Tree Classifier** | **PASS** | `classification.ipynb` (Sec 12.4)| Gini impurity, max_depth=12, cost-sensitive balanced |
| **5. Support Vector Classifier (SVC)** | **PASS** | `classification.ipynb` (Sec 12.5)| RBF kernel, C=10.0, margin maximization |
| **Accuracy reported for all 5** | **PASS** | `classification.ipynb` (Sec 13) | Evaluated on identical test set |
| **Precision reported for all 5** | **PASS** | `classification.ipynb` (Sec 13) | Weighted Precision evaluated |
| **Recall reported for all 5** | **PASS** | `classification.ipynb` (Sec 13) | Weighted Recall evaluated (critical for IDS) |
| **Weighted F1 reported for all 5** | **PASS** | `classification.ipynb` (Sec 13) | Harmonic mean balancing False Alarms and Misses |
| **Confusion Matrix for EACH model** | **PASS** | `classification.ipynb` (Sec 14) | 2×3 grid with TP, TN, FP, FN and False Negative impact analysis |
| **ROC-AUC where applicable** | **PASS** | `classification.ipynb` (Sec 13, 15)| Computed for all 5 models via `predict_proba` / `decision_function` |
| **Preliminary comparison table** | **PASS** | `classification.ipynb` (Sec 13) | Single DataFrame ranked by Weighted F1 descending |
| **Combined ROC Curves** | **PASS** | `classification.ipynb` (Sec 15) | Multi-model ROC plot with AUC annotations |
| **Decision Tree Visualization** | **PASS** | `classification.ipynb` (Sec 16.1)| Pruned decision tree plot using `plot_tree(max_depth=3)` |
| **Tree Feature Importance** | **PASS** | `classification.ipynb` (Sec 16.2)| Bar chart of top 15 Gini importances |

---

### SECTION E: VIVA & PRESENTATION PREPARATION
| Item | Status | Location | Notes |
|---|:---:|---|---|
| **Review 1 Checklist** | **PASS** | `REVIEW_1_CHECKLIST.md` | Maps every rubric item directly to code cells |
| **Review 1 Viva Q&A Guide** | **PASS** | `REVIEW_1_VIVA.md` | 58 comprehensive academic questions with verified answers |
| **Review 1 Presentation Flow** | **PASS** | `REVIEW_1_PRESENTATION.md` | 16-slide presentation guide with what to show & what to say |
| **Repository README** | **PASS** | `README.md` | Professional, GitHub-ready, complete methodology & citations |
| **Requirements File** | **PASS** | `requirements.txt` | Clean, versioned dependencies |
| **Review 2 Clustering Track** | **PASS** | `notebooks/clustering.ipynb` | Prepared skeleton & roadmap for Review 2 submission |
