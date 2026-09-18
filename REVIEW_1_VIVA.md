# 🎓 23CSE301 Machine Learning Capstone Project – Review 1 Viva Preparation Guide
## Project: Log File Parsing for Cybersecurity Intrusion Detection (CICIDS 2017)

---

### 1. Fundamentals & Dataset

#### Q1: What is the exact problem statement of your project?
> **Answer:** "Our project develops an end-to-end, reproducible machine learning pipeline for network log parsing and cybersecurity intrusion detection using the CICIDS 2017 benchmark dataset. For Review 1, we address two complementary learning tracks: (1) a **Regression Track** evaluating 10 distinct regression algorithms to model and forecast continuous network flow duration from non-temporal traffic telemetry, and (2) a **Classification Track (Part A)** implementing 5 foundational classification algorithms to discriminate between benign traffic and 14 malicious cyberattack categories under severe class imbalance."

#### Q2: Why did you specifically select the CICIDS 2017 dataset?
> **Answer:** "Legacy datasets such as KDD99 and NSL-KDD suffer from severe synthetic artifacts, outdated attack vectors, redundant records, and non-realistic traffic distributions. CICIDS 2017, created by the Canadian Institute for Cybersecurity at the University of New Brunswick, captures modern attack vectors (such as Heartbleed, DDoS LOIC, Botnets, and multi-stage Web attacks) executed over 5 full business days. It models realistic background human behavior across diverse protocols (HTTP, HTTPS, SSH, FTP) and provides 78 statistical network flow features extracted from raw `.pcap` files using CICFlowMeter."

#### Q3: What is an Intrusion Detection System (IDS)?
> **Answer:** "An Intrusion Detection System (IDS) is a hardware device or software application that monitors network traffic or system activities for policy violations, malicious activity, or unauthorized access. IDSs are traditionally categorized into **Signature-based IDS** (which match known byte sequences, failing against zero-day and polymorphic attacks) and **Anomaly-based IDS** (which model statistical traffic baselines to detect behavioral deviations, naturally suited for machine learning)."

#### Q4: What is network-flow / log telemetry data?
> **Answer:** "A network flow represents a sequence of packets passing between two endpoints during a communication session, uniquely identified by a 5-tuple: `(Source IP, Destination IP, Source Port, Destination Port, Protocol)`. Rather than analyzing raw packet payloads (which are often encrypted with TLS/SSL), flow telemetry summarizes statistical properties of the bidirectional conversation: packet inter-arrival times (IAT), forward and backward byte volumes, packet size distributions, TCP flag counts, and connection duration."

#### Q5: What is your target variable in the Regression Track? Why is it justifiable?
> **Answer:** "Our regression target is **`log1p(Flow Duration)`** (session duration in microseconds). In cybersecurity, connection lifespan is a vital physical metric. For example, DoS attacks and hung connections hold sockets open for prolonged intervals (exhausting thread pools), while reconnaissance port scans and brute-force attempts generate microsecond-scale burst connections. We did not fabricate a continuous target; `Flow Duration` is an authentic physical property of the network stack."

#### Q6: What are the most important features in network flow logs?
> **Answer:** "Empirical feature importance and correlation analysis reveal three primary feature groups:
> 1. **Temporal Dynamics:** `Flow IAT Mean`, `Flow IAT Max`, `Fwd IAT Mean` (inter-arrival times dictate flow pacing).
> 2. **Packet & Byte Volumes:** `Total Length of Fwd Packets`, `Average Packet Size`, and our engineered feature `bytes_per_fwd_pkt`.
> 3. **TCP Protocol State Flags & Window Size:** `Init_Win_bytes_forward` and `PSH/ACK Flag Counts`, which characterize the handshake and transmission state."

---

### 2. Preprocessing, Data Cleaning & Feature Engineering

#### Q7: What data cleaning steps were performed?
> **Answer:** "We implemented a 6-stage data cleaning pipeline:
> 1. **Deduplication:** Audited and dropped 308,381 duplicate records caused by overlapping PCAP collection windows.
> 2. **Infinite Value Handling:** Replaced `+Inf` values in rate columns (`Flow Bytes/s`, `Flow Packets/s`)—caused by division by zero when duration is 0—with the finite column maximum.
> 3. **Missing Value Imputation:** Imputed 288 missing numerical entries using the feature median (robust to extreme network outliers).
> 4. **Constant Column Removal:** Dropped zero-variance features whose standard deviation was 0.
> 5. **Extreme Outlier Capping:** Clipped extreme values to safe float32 bounds to prevent numerical gradient overflow.
> 6. **String Normalization:** Stripped whitespace and removed non-ASCII corruption characters from attack labels."

#### Q8: Why use median imputation instead of mean or deletion?
> **Answer:** "Network traffic distributions exhibit extreme right-skewed power-law tails (e.g., a single file transfer can be $10^6$ times larger than an average packet). The sample mean is heavily biased by these extreme outliers. The median represents the true central tendency of the distribution and prevents introducing distributional shift. Deleting rows was unnecessary because missingness was confined to less than 0.01% of records."

#### Q9: How did you handle outliers?
> **Answer:** "In network intrusion detection, extreme feature values (such as sudden bursts of 100,000 packets) are often the actual signatures of volumetric cyberattacks (e.g., DDoS). Arbitrarily deleting statistical outliers using standard $3\\sigma$ or $1.5 \\times \\text{IQR}$ rules would discard the critical attack samples we are trying to detect! Therefore, we **retained valid domain outliers** and applied **logarithmic transformations** (`log1p`) and float32 clipping to stabilize variance without losing security evidence."

#### Q10: Why do we split data into training and testing sets?
> **Answer:** "To evaluate the generalizability of the trained model on unseen data. Training performance only measures how well a model memorizes the training data. Evaluating on an independent held-out test set estimates true real-world generalization error and detects overfitting."

#### Q11: What is data leakage, and how did you prevent it?
> **Answer:** "Data leakage occurs when information from outside the training dataset (specifically from the test or validation set) is used to create or tune the model. A common fatal flaw is fitting a scaler (e.g., `StandardScaler.fit()`) on the entire dataset prior to splitting, which leaks test mean and variance into the training process. We strictly prevented data leakage by:
> 1. Performing train/test splitting **first**.
> 2. Calling `scaler.fit_transform()` strictly on `X_train`.
> 3. Calling `scaler.transform()` on `X_test` using the training statistics."

#### Q12: Why must the scaler be fitted ONLY on the training data?
> **Answer:** "In production, an IDS processes network flows in real time as they arrive; future flow statistics are unknown. If the scaler sees the test data distribution during preprocessing, the model receives an unfair, unrealistic advantage, producing artificially inflated metrics that fail in real-world deployment."

#### Q13: Why did you use stratified splitting for classification?
> **Answer:** "The CICIDS 2017 dataset suffers from severe class imbalance (~80% Benign vs ~20% Attack, with sub-classes like Heartbleed having only 11 samples). Simple random sampling risks leaving zero samples of rare attack classes in the test partition. `StratifiedKFold` and `train_test_split(stratify=y)` guarantee that the exact proportion of each class is preserved across both training and test partitions."

#### Q14: Why did you set `random_state=42` everywhere?
> **Answer:** "`random_state=42` fixes the pseudo-random number generator (PRNG) seed across all stochastic operations (data splitting, k-fold partitioning, random forest bootstrap sampling, and hyperparameter search). This guarantees 100% academic reproducibility: any evaluator running our code will obtain the exact same numerical outputs, splits, and scores."

#### Q15: What engineered features did you create, and what is their cybersecurity rationale?
> **Answer:** "We engineered three domain-specific network flow metrics:
> 1. **`bytes_per_fwd_pkt`:** `Total Length of Fwd Packets / (Total Fwd Packets + 1)`. Measures payload density per packet. Scans and control probes have small payloads ($\approx 0$ bytes/pkt), whereas data exfiltration has high payload density.
> 2. **`fwd_bwd_pkt_ratio`:** `(Total Fwd Packets + 1) / (Total Backward Packets + 1)`. Measures traffic asymmetry. Benign TCP connections are balanced ($\approx 1.0$), while DoS and PortScan attacks send floods with zero victim responses (ratio $\gg 1$).
> 3. **`total_bytes`:** `Total Length of Fwd Packets + Total Length of Bwd Packets`. Aggregates total volumetric energy of the flow."

#### Q16: How did you prevent target leakage in feature engineering?
> **Answer:** "In the Regression Track, our target is `log1p(Flow Duration)`. Any feature containing `Flow Duration` in its calculation (such as `Flow Bytes/s = Total Bytes / Flow Duration` or `Flow Packets/s`) mathematically leaks the target! We audited the feature space and strictly excluded all duration-dependent rate features from the regression predictor matrix."

---

### 3. Regression Track (10 Algorithms)

#### Q17: Explain Linear Regression.
> **Answer:** "Linear Regression models the relationship between target $y$ and features $X$ as a linear hyperplane: $\hat{y} = w^T X + b$. It finds weights $w$ by minimizing Ordinary Least Squares (OLS) residual sum of squares: $\min_w \sum (y_i - \hat{y}_i)^2$. It serves as our linear baseline ($R^2 \approx 0.69$)."

#### Q18: Explain Ridge Regression and L2 regularization.
> **Answer:** "Ridge Regression adds an L2 penalty on weight magnitudes to the OLS loss: $\mathcal{L}_{\text{Ridge}} = \sum (y_i - \hat{y}_i)^2 + \alpha \sum w_j^2$. This shrinks correlated feature weights toward zero without setting them strictly to zero, mitigating multicollinearity among network header lengths."

#### Q19: Explain Lasso Regression and L1 regularization.
> **Answer:** "Lasso (Least Absolute Shrinkage and Selection Operator) adds an L1 penalty: $\mathcal{L}_{\text{Lasso}} = \sum (y_i - \hat{y}_i)^2 + \alpha \sum |w_j|$. Due to the geometry of the $L_1$ diamond constraint, it forces less informative weights strictly to zero, performing automatic embedded feature selection."

#### Q20: Explain ElasticNet.
> **Answer:** "ElasticNet combines both L1 and L2 penalties: $\mathcal{L}_{\text{ElasticNet}} = \text{RSS} + \alpha \left[ \rho ||w||_1 + \frac{1-\rho}{2} ||w||_2^2 \right]$. When multiple network features are highly correlated (e.g. forward header length and forward packet count), Lasso arbitrarily selects one; ElasticNet retains the group stability of Ridge while preserving sparsity from Lasso."

#### Q21: What is the fundamental difference between L1 and L2 regularization?
> **Answer:** "L1 uses the absolute sum of weights ($|w|$), creating non-differentiable corners at axes that produce exact sparse solutions ($w_j = 0$). L2 uses squared weights ($w^2$), which shrinks weights proportionally but never sets them to exactly zero. L1 performs feature selection; L2 handles multicollinearity."

#### Q22: Explain Polynomial Regression.
> **Answer:** "Polynomial Regression extends linear models by creating non-linear combinations and interaction terms ($x_1^2, x_1 x_2, x_2^2$) using `PolynomialFeatures(degree=2)`. In our dataset, it captures multiplicative interactions between packet volume and inter-arrival intervals, improving $R^2$ over the linear baseline."

#### Q23: Explain Decision Tree Regression.
> **Answer:** "Decision Tree Regressor recursively partitions the feature space into orthogonal hyper-rectangles by selecting feature splits that maximize Mean Squared Error (MSE) reduction. In each terminal leaf node, it predicts the mean value of the training instances falling within that region."

#### Q24: Explain Random Forest Regressor.
> **Answer:** "Random Forest is a bagging (Bootstrap Aggregating) ensemble of decision trees. It draws $B$ bootstrap samples from training data and grows unpruned trees, considering a random subset of $\sqrt{p}$ features at each split. Averaging predictions across 100 decorrelated trees dramatically reduces variance without increasing bias ($R^2 > 0.88$)."

#### Q25: Explain Gradient Boosting Regressor.
> **Answer:** "Gradient Boosting builds trees sequentially in an additive stage-wise manner: $F_m(x) = F_{m-1}(x) + \eta h_m(x)$. Each new tree $h_m(x)$ is fitted to the negative gradient (pseudo-residuals) of the loss function. It reduces bias iteratively, achieving top-tier regression performance."

#### Q26: Explain Support Vector Regressor (SVR).
> **Answer:** "SVR finds a function that has at most $\epsilon$ deviation from actual targets while remaining as flat as possible. Errors within the $\epsilon$-insensitive tube are ignored. Using the Radial Basis Function (RBF) kernel, it projects non-linear network patterns into infinite-dimensional Hilbert space."

#### Q27: Explain KNN Regressor and why scaling is mandatory.
> **Answer:** "KNN Regressor predicts the target as the distance-weighted average of the $k$ nearest training neighbors in feature space: $\hat{y} = \frac{\sum w_i y_i}{\sum w_i}$. Because distance is computed via Euclidean metric $d(p, q) = \sqrt{\sum (p_j - q_j)^2}$, unscaled features with large ranges (e.g., `Total Bytes` in millions) would completely overpower features with small ranges (e.g., flag counts $\in [0, 1]$). Feature scaling is mathematically essential."

---

### 4. Evaluation Metrics & Validation

#### Q28: What is $R^2$ (Coefficient of Determination)?
> **Answer:** "$R^2 = 1 - \frac{\text{SS}_{\text{res}}}{\text{SS}_{\text{tot}}} = 1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2}$. It represents the proportion of target variance explained by the model relative to a naive horizontal line predicting the sample mean $\bar{y}$. $R^2 = 1.0$ indicates a perfect fit, $0.0$ equals baseline mean prediction, and negative values indicate performance worse than the mean."

#### Q29: What is RMSE and MAE? What is the key difference?
> **Answer:** 
> - **MAE:** $\frac{1}{n} \sum |y_i - \hat{y}_i|$. Treats all errors linearly.
> - **RMSE:** $\sqrt{\frac{1}{n} \sum (y_i - \hat{y}_i)^2}$. Squares errors before averaging, heavily penalizing large outliers.
> In network engineering, RMSE is preferred when large prediction errors are disproportionately risky (e.g. underestimating an attack flow by 60 seconds vs 1 second)."

#### Q30: Why use 5-fold cross-validation?
> **Answer:** "A single train/test split can produce an unrepresentative performance score due to random sampling luck. 5-fold cross-validation splits data into 5 equal subsets, training on 4 and testing on 1 iteratively across all 5 folds. Reporting the Mean CV $R^2$ and standard deviation ($\sigma$) provides an unbiased estimate of true generalizability."

#### Q31: What is hyperparameter tuning, and why use GridSearchCV?
> **Answer:** "Hyperparameters (e.g., `n_estimators`, `max_depth`, `alpha`) cannot be learned directly by gradient descent and must be set prior to training. `GridSearchCV` systematically explores an exhaustive cartesian product of parameter grids using internal cross-validation on the training set, finding the optimal configuration without test set contamination."

#### Q32: Explain the Bias-Variance Tradeoff.
> **Answer:** "Total expected test error is decomposed into: $\text{Error} = \text{Bias}^2 + \text{Variance} + \sigma_{\text{irreducible}}^2$. 
> - **Bias:** Error from erroneous assumptions (e.g., fitting a linear model to non-linear network data causes underfitting).
> - **Variance:** Error from sensitivity to small training fluctuations (e.g., deep unpruned decision trees memorize noise).
> Ensembles like Random Forest reduce variance through bagging, while regularization (Ridge/Lasso) reduces variance by trading a small amount of bias."

---

### 5. Classification Track (Part A)

#### Q33: Explain Logistic Regression for intrusion classification.
> **Answer:** "Logistic Regression estimates the posterior probability of a flow being malicious using the logistic sigmoid function: $P(y=1|x) = \frac{1}{1 + e^{-(w^T x + b)}}$. It sets a decision boundary where $P \ge 0.5$. We configured `class_weight='balanced'` to inversely scale weights by class frequencies, preventing benign bias."

#### Q34: Explain Gaussian Naive Bayes and its limitation on network data.
> **Answer:** "Gaussian Naive Bayes applies Bayes' Theorem with the strong assumption that all features are conditionally independent given the class: $P(x|C) = \prod P(x_i|C)$. In network telemetry, this assumption is heavily violated (packet lengths, header lengths, and byte counts are strongly correlated), which causes Naive Bayes to output overconfident probability estimates and higher false alarms."

#### Q35: Explain Support Vector Classifier (SVC).
> **Answer:** "SVC constructs an optimal hyperplane that maximizes the geometric margin $\frac{2}{||w||}$ between benign and attack vectors in a transformed feature space. Samples lying on the margin boundaries are the *Support Vectors*. We used the RBF kernel: $K(x, x') = \exp(-\gamma ||x - x'||^2)$, which projects non-linear network boundaries into infinite dimensions."

#### Q36: Explain Accuracy vs Precision vs Recall vs F1-score.
> **Answer:**
> - **Accuracy:** $\frac{TP + TN}{TP + TN + FP + FN}$. Misleading under imbalance (predicting all Benign = 80.3% accuracy, 0% attacks caught).
> - **Precision:** $\frac{TP}{TP + FP}$. Of all flows flagged as attacks, how many were truly attacks? (Measures False Alarm rate).
> - **Recall (Sensitivity):** $\frac{TP}{TP + FN}$. Of all actual attacks occurring, how many did our system catch? (Measures Miss rate).
> - **F1-score:** $2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$. Harmonic mean giving equal weight to precision and recall."

#### Q37: In cybersecurity, which is more dangerous: False Positives or False Negatives?
> **Answer:** "**False Negatives are catastrophically worse.** 
> - A False Positive (FP) generates a false alarm; an analyst spends time investigating benign traffic.
> - A False Negative (FN) misses an active cyberattack, allowing malware execution, data exfiltration, lateral movement, or ransomware deployment undetected.
> Therefore, in our classification track, **Recall (detection rate) is the most vital metric**."

#### Q38: What is ROC-AUC?
> **Answer:** "The Receiver Operating Characteristic (ROC) curve plots True Positive Rate (Recall) vs False Positive Rate ($FPR = \frac{FP}{FP+TN}$) across all possible classification probability thresholds $\in [0, 1]$. The Area Under the Curve (AUC) measures threshold-independent ranking capability: an AUC of 0.99 means a randomly chosen attack has a 99% probability of receiving a higher anomaly score than a randomly chosen benign flow."

---

### 6. Results, Limitations & Review 2 Roadmap

#### Q39: Which regression model performed best, and why?
> **Answer:** "**Random Forest Regressor** and **Gradient Boosting Regressor** performed best ($R^2 > 0.88$, RMSE $< 1.9$). Network flow durations follow non-linear physical rules (fixed timeout intervals, maximum transmission units, TCP window limits) that cannot be modeled by a straight hyperplane. Tree ensembles partition these step-function boundaries naturally."

#### Q40: Which classification model performed best in Part A, and why?
> **Answer:** "**Decision Tree Classifier** ($F1 = 0.9914$, Recall $= 0.9914$, AUC $= 0.9959$) and **K-Nearest Neighbors** ($F1 = 0.9933$) performed best. The Decision Tree creates exact threshold rules on initial window size and packet lengths, achieving near-zero false negatives. KNN succeeds because identical attack tools (e.g. LOIC) generate tightly packed clusters in normalized feature space."

#### Q41: What are the current limitations of the Review 1 implementation?
> **Answer:** 
> 1. **Binary Target in Part A:** Grouped all 14 attacks into a single 'ATTACK' label for foundational evaluation.
> 2. **Subsampling on Kernel Methods:** SVR and SVC were trained on calibrated 15,000-instance subsets due to their $O(N^2)$ algorithmic complexity.
> 3. **Static Batch Learning:** Does not yet ingest live streaming PCAP packets via packet capture libraries."

#### Q42: What is your concrete technical plan for Review 2?
> **Answer:**
> 1. **Full Multi-Class Classification:** Classify each of the 14 individual attack types separately.
> 2. **Advanced Ensemble Boosting:** Train XGBoost, LightGBM, and CatBoost.
> 3. **Imbalance Remediation:** Implement SMOTE (Synthetic Minority Over-sampling Technique).
> 4. **Unsupervised Track:** Execute the prepared `clustering.ipynb` using K-Means, DBSCAN, and Isolation Forests to detect zero-day anomalies without labels.
> 5. **Deployment:** Build a lightweight FastAPI/Streamlit microservice for live flow scoring."
