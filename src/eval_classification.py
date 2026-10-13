"""
src/eval_classification.py
===========================
Phase 5B -- Ensemble Classifiers + Full Classification Evaluation

Adds ensemble models (Random Forest, XGBoost) to the classification track,
then generates all evaluation metrics and plots:
  - Comparison table (Accuracy, Precision, Recall, F1, AUC-ROC)
  - ROC curves for all 5+ classifiers
  - Confusion matrices (2x3 grid)
  - Precision-Recall curves
  - Feature importance (tree-based models)
  - Metric bar charts

Usage (standalone):
    python src/eval_classification.py

Returns (when imported):
    train_ensembles(X_train, y_train, ...) -> dict of models
    evaluate_all(models_dict, X_test, y_test, ...) -> pd.DataFrame
"""

import os
import sys
import time

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.ensemble import (
    RandomForestClassifier,
    AdaBoostClassifier,
    GradientBoostingClassifier,
    BaggingClassifier,
)
from sklearn.neural_network import MLPClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "..", "results")
RANDOM_STATE = 42


def train_ensembles(
    X_train: np.ndarray,
    y_train: np.ndarray,
    verbose: bool = True,
) -> dict:
    """
    Train all 5 Review 2 Part B classifiers according to 23CSE301 Capstone Guidelines:
      B6. Random Forest Classifier (tuned n_estimators, max_depth)
      B7. AdaBoost Classifier (adaptive boosting with decision stumps)
      B8. Gradient Boosting Classifier (sequential residual boosting)
      B9. Bagging Classifier (bootstrap aggregating with Decision Tree base)
      B10. MLP Classifier (Multi-Layer Perceptron neural network)
    """
    if verbose:
        print("=" * 65)
        print("  PHASE 5B -- TRAINING REVIEW 2 PART B CLASSIFIERS (5 ALGORITHMS)")
        print("=" * 65)

    os.makedirs(MODELS_DIR, exist_ok=True)
    models = {}

    # Sample for models sensitive to massive training size to ensure swift, robust convergence
    N_SAMP = min(60_000, len(X_train))
    idx_sub = np.random.default_rng(RANDOM_STATE).choice(len(X_train), N_SAMP, replace=False)
    X_sub = X_train[idx_sub] if isinstance(X_train, np.ndarray) else X_train.iloc[idx_sub]
    y_sub = y_train[idx_sub] if isinstance(y_train, np.ndarray) else y_train.iloc[idx_sub]

    # -- B6: Random Forest ----------------------------------------------------
    if verbose:
        print("  [B6] Training Random Forest Classifier...")
    rf = RandomForestClassifier(
        n_estimators=100, max_depth=20, min_samples_leaf=5,
        n_jobs=-1, random_state=RANDOM_STATE, class_weight="balanced",
    )
    t0 = time.time()
    rf.fit(X_train, y_train)
    elapsed = round(time.time() - t0, 2)
    models["B6 - Random Forest"] = rf
    joblib.dump(rf, os.path.join(MODELS_DIR, "randomforest.joblib"))
    if verbose:
        print(f"       Trained in {elapsed}s -> Saved to models/")

    # -- B7: AdaBoost ---------------------------------------------------------
    if verbose:
        print("  [B7] Training AdaBoost Classifier...")
    ada = AdaBoostClassifier(
        n_estimators=80, learning_rate=0.1, random_state=RANDOM_STATE
    )
    t0 = time.time()
    ada.fit(X_sub, y_sub)
    elapsed = round(time.time() - t0, 2)
    models["B7 - AdaBoost"] = ada
    joblib.dump(ada, os.path.join(MODELS_DIR, "adaboost.joblib"))
    if verbose:
        print(f"       Trained in {elapsed}s -> Saved to models/")

    # -- B8: Gradient Boosting ------------------------------------------------
    try:
        import xgboost as xgb
        if verbose:
            print("  [B8] Training Gradient Boosting (XGBoost Classifier)...")
        gbm = xgb.XGBClassifier(
            n_estimators=150, max_depth=6, learning_rate=0.1,
            subsample=0.8, colsample_bytree=0.8,
            eval_metric="logloss", random_state=RANDOM_STATE,
            n_jobs=-1, tree_method="hist",
        )
        t0 = time.time()
        gbm.fit(X_train, y_train)
        elapsed = round(time.time() - t0, 2)
        models["B8 - Gradient Boosting (XGB)"] = gbm
        joblib.dump(gbm, os.path.join(MODELS_DIR, "gradient_boosting.joblib"))
        if verbose:
            print(f"       Trained in {elapsed}s -> Saved to models/")
    except ImportError:
        if verbose:
            print("  [B8] Training GradientBoostingClassifier (sklearn)...")
        gbm = GradientBoostingClassifier(
            n_estimators=100, max_depth=5, learning_rate=0.1,
            subsample=0.8, random_state=RANDOM_STATE
        )
        t0 = time.time()
        gbm.fit(X_sub, y_sub)
        elapsed = round(time.time() - t0, 2)
        models["B8 - Gradient Boosting"] = gbm
        joblib.dump(gbm, os.path.join(MODELS_DIR, "gradient_boosting.joblib"))
        if verbose:
            print(f"       Trained in {elapsed}s -> Saved to models/")

    # -- B9: Bagging Classifier (with Decision Tree base) ---------------------
    if verbose:
        print("  [B9] Training Bagging Classifier (DT base)...")
    bag = BaggingClassifier(
        estimator=DecisionTreeClassifier(max_depth=12, min_samples_leaf=5, random_state=RANDOM_STATE),
        n_estimators=40,
        n_jobs=-1,
        random_state=RANDOM_STATE,
    )
    t0 = time.time()
    bag.fit(X_sub, y_sub)
    elapsed = round(time.time() - t0, 2)
    models["B9 - Bagging Classifier"] = bag
    joblib.dump(bag, os.path.join(MODELS_DIR, "bagging.joblib"))
    if verbose:
        print(f"       Trained in {elapsed}s -> Saved to models/")

    # -- B10: MLP Classifier (Neural Network) ---------------------------------
    if verbose:
        print("  [B10] Training MLP Classifier (Neural Network)...")
    mlp = MLPClassifier(
        hidden_layer_sizes=(64, 32),
        activation="relu",
        max_iter=100,
        early_stopping=True,
        random_state=RANDOM_STATE,
    )
    t0 = time.time()
    mlp.fit(X_sub, y_sub)
    elapsed = round(time.time() - t0, 2)
    models["B10 - MLP Classifier"] = mlp
    joblib.dump(mlp, os.path.join(MODELS_DIR, "mlp.joblib"))
    if verbose:
        print(f"        Trained in {elapsed}s -> Saved to models/")

    if verbose:
        print("\n  All 5 Review 2 Part B classification models trained and serialized!\n")
    return models


def evaluate_all(
    models_dict: dict,
    X_test: np.ndarray,
    y_test: np.ndarray,
    feature_names: list = None,
    save_plots: bool = True,
    plots_dir: str = None,
    verbose: bool = True,
) -> pd.DataFrame:
    """
    Evaluate all classification models and generate plots.

    Parameters
    ----------
    models_dict : dict
        {name: fitted_model} for ALL classifiers (base + ensemble).
    X_test : np.ndarray
        Scaled test features.
    y_test : np.ndarray
        True binary labels for the test set.
    feature_names : list
        Feature names for importance plots.
    save_plots : bool
        If True, save all evaluation plots to plots_dir.
    plots_dir : str
        Output directory for plots (defaults to RESULTS_DIR).

    Returns
    -------
    pd.DataFrame
        Comparison table sorted by F1-Score descending.
    """
    if plots_dir is None:
        plots_dir = RESULTS_DIR
    os.makedirs(plots_dir, exist_ok=True)

    if verbose:
        print("=" * 65)
        print("  CLASSIFICATION EVALUATION -- ALL MODELS")
        print("=" * 65)

    results = {}

    for name, model in models_dict.items():
        t0 = time.time()
        y_pred = model.predict(X_test)
        t_pred = round(time.time() - t0, 4)

        acc  = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec  = recall_score(y_test, y_pred, zero_division=0)
        f1   = f1_score(y_test, y_pred, zero_division=0)

        # AUC-ROC
        auc = 0.0
        y_score = None
        if hasattr(model, "predict_proba"):
            y_score = model.predict_proba(X_test)[:, 1]
            auc = roc_auc_score(y_test, y_score)
        elif hasattr(model, "decision_function"):
            y_score = model.decision_function(X_test)
            auc = roc_auc_score(y_test, y_score)

        results[name] = {
            "Accuracy":  round(acc, 4),
            "Precision": round(prec, 4),
            "Recall":    round(rec, 4),
            "F1-Score":  round(f1, 4),
            "AUC-ROC":   round(auc, 4),
            "Pred(s)":   t_pred,
            "y_pred":    y_pred,
            "y_score":   y_score,
            "model":     model,
        }

        if verbose:
            print(f"  [{name:<35s}] Acc={acc:.4f}  F1={f1:.4f}  AUC={auc:.4f}")

    # -- Comparison Table ------------------------------------------------------
    metric_cols = ["Accuracy", "Precision", "Recall", "F1-Score", "AUC-ROC"]
    rows = [{**{"Model": n}, **{k: v for k, v in r.items() if k in metric_cols}}
            for n, r in results.items()]
    cdf = pd.DataFrame(rows).set_index("Model").sort_values("F1-Score", ascending=False)

    if verbose:
        print("\n  === CLASSIFICATION MODEL COMPARISON ===")
        print(cdf.to_string())
        best = cdf["F1-Score"].idxmax()
        print(f"\n  Best Classifier (F1): {best}  "
              f"(F1={cdf.loc[best, 'F1-Score']:.4f})")

    # -- Plots -----------------------------------------------------------------
    if save_plots:
        _plot_roc_curves(results, y_test, plots_dir)
        _plot_confusion_matrices(results, y_test, plots_dir)
        _plot_metric_bars(cdf, plots_dir)
        _plot_pr_curves(results, y_test, plots_dir)
        if feature_names:
            _plot_feature_importance(results, feature_names, plots_dir)

    return cdf


# -- Private plotting functions ------------------------------------------------

def _plot_roc_curves(results: dict, y_test: np.ndarray, plots_dir: str) -> None:
    fig, ax = plt.subplots(figsize=(10, 7))
    colors = plt.cm.tab10(np.linspace(0, 1, len(results)))
    for (name, res), color in zip(results.items(), colors):
        if res["y_score"] is not None:
            fpr, tpr, _ = roc_curve(y_test, res["y_score"])
            ax.plot(fpr, tpr, label=f"{name} (AUC={res['AUC-ROC']:.4f})",
                    color=color, lw=2)
    ax.plot([0, 1], [0, 1], "k--", lw=1.5, label="Random (0.50)")
    ax.set_xlabel("False Positive Rate", fontsize=12)
    ax.set_ylabel("True Positive Rate", fontsize=12)
    ax.set_title("ROC Curves -- All Classifiers", fontweight="bold", fontsize=13)
    ax.legend(loc="lower right", fontsize=9)
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    out = os.path.join(plots_dir, "clf_roc_curves.png")
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  [Plot] Saved: {out}")


def _plot_confusion_matrices(results: dict, y_test: np.ndarray, plots_dir: str) -> None:
    n = len(results)
    ncols = min(3, n)
    nrows = (n + ncols - 1) // ncols
    fig, axes = plt.subplots(nrows, ncols, figsize=(6 * ncols, 5 * nrows))
    axes = np.atleast_2d(axes).flatten()
    for ax, (name, res) in zip(axes, results.items()):
        cm = confusion_matrix(y_test, res["y_pred"])
        ConfusionMatrixDisplay(cm, display_labels=["BENIGN", "ATTACK"]).plot(
            ax=ax, colorbar=False, cmap="Blues", values_format="d")
        short_name = name.split(" - ")[-1] if " - " in name else name
        ax.set_title(short_name, fontweight="bold")
    for ax in axes[n:]:
        ax.set_visible(False)
    plt.suptitle("Confusion Matrices -- All Classifiers",
                 fontsize=13, fontweight="bold")
    plt.tight_layout()
    out = os.path.join(plots_dir, "clf_confusion_matrices.png")
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  [Plot] Saved: {out}")


def _plot_metric_bars(cdf: pd.DataFrame, plots_dir: str) -> None:
    metric_cols = [m for m in ["Accuracy", "Precision", "Recall", "F1-Score", "AUC-ROC"]
                   if m in cdf.columns]
    fig, axes = plt.subplots(1, len(metric_cols), figsize=(4 * len(metric_cols), 5))
    if len(metric_cols) == 1:
        axes = [axes]
    for ax, metric in zip(axes, metric_cols):
        data = cdf[metric].sort_values(ascending=False)
        bars = ax.barh(data.index, data.values,
                       color=sns.color_palette("viridis", len(data)), edgecolor="black")
        ax.set_title(metric, fontweight="bold")
        ax.set_xlim(max(0, data.min() - 0.05), 1.0)
        for bar, val in zip(bars, data.values):
            ax.text(val + 0.003, bar.get_y() + bar.get_height() / 2,
                    f"{val:.4f}", va="center", fontsize=8)
        ax.invert_yaxis()
    plt.suptitle("Classification Model Comparison", fontsize=13, fontweight="bold")
    plt.tight_layout()
    out = os.path.join(plots_dir, "clf_metric_comparison.png")
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  [Plot] Saved: {out}")


def _plot_pr_curves(results: dict, y_test: np.ndarray, plots_dir: str) -> None:
    fig, ax = plt.subplots(figsize=(10, 7))
    colors = plt.cm.tab10(np.linspace(0, 1, len(results)))
    for (name, res), color in zip(results.items(), colors):
        if res["y_score"] is not None:
            prec, rec, _ = precision_recall_curve(y_test, res["y_score"])
            ap = average_precision_score(y_test, res["y_score"])
            ax.plot(rec, prec, label=f"{name} (AP={ap:.4f})", color=color, lw=2)
    ax.set_xlabel("Recall", fontsize=12)
    ax.set_ylabel("Precision", fontsize=12)
    ax.set_title("Precision-Recall Curves", fontweight="bold", fontsize=13)
    ax.legend(loc="lower left", fontsize=9)
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    out = os.path.join(plots_dir, "clf_pr_curves.png")
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  [Plot] Saved: {out}")


def _plot_feature_importance(results: dict, feature_names: list, plots_dir: str) -> None:
    # Use Random Forest if available
    for name, res in results.items():
        model = res["model"]
        if hasattr(model, "feature_importances_"):
            imp = pd.Series(model.feature_importances_, index=feature_names)
            imp = imp.sort_values(ascending=False).head(20)
            fig, ax = plt.subplots(figsize=(10, 8))
            imp.plot(kind="barh", ax=ax, color="steelblue", edgecolor="black")
            ax.invert_yaxis()
            short = name.split(" - ")[-1] if " - " in name else name
            ax.set_title(f"Feature Importance -- {short}", fontweight="bold")
            ax.set_xlabel("Importance")
            ax.grid(axis="x", alpha=0.3)
            plt.tight_layout()
            out = os.path.join(plots_dir, "clf_feature_importance.png")
            plt.savefig(out, dpi=150, bbox_inches="tight")
            plt.close()
            print(f"  [Plot] Saved: {out}")
            break  # Only plot once


if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(__file__))
    from data_loader import load_cicids
    from data_split import split_classification
    from feature_engineering import engineer
    from preprocessing import clean

    data_dir = os.path.join(os.path.dirname(__file__), "..")

    print("Loading pipeline...")
    df_raw = load_cicids(data_dir=data_dir, verbose=False)
    df_clean = clean(df_raw, verbose=False)
    selected, _, _, _ = engineer(df_clean, save_plots=False, verbose=False)
    clf_data = split_classification(df_clean, selected, save_plots=False, verbose=False)

    # Load or train base models from Review 1 Part A (5 algorithms)
    base_models = {}
    base_spec = [
        ("logisticregression.joblib", "A1 - Logistic Regression"),
        ("knn.joblib",                "A2 - K-Nearest Neighbors"),
        ("gaussiannb.joblib",         "A3 - Gaussian Naive Bayes"),
        ("decisiontree.joblib",       "A4 - Decision Tree"),
        ("svc.joblib",                "A5 - Support Vector Machine (SVC)"),
    ]

    for fname, name in base_spec:
        fpath = os.path.join(MODELS_DIR, fname)
        if os.path.exists(fpath):
            base_models[name] = joblib.load(fpath)
        else:
            # Train if missing
            print(f"  [Notice] {name} artifact not found on disk, training...")
            if "Logistic" in name:
                from sklearn.linear_model import LogisticRegression
                m = LogisticRegression(max_iter=1000, random_state=RANDOM_STATE, n_jobs=-1).fit(clf_data["X_train"], clf_data["y_train"])
            elif "Neighbors" in name:
                from sklearn.neighbors import KNeighborsClassifier
                m = KNeighborsClassifier(n_neighbors=7, n_jobs=-1, algorithm="ball_tree").fit(clf_data["X_train"][:50000], clf_data["y_train"][:50000])
            elif "Naive Bayes" in name:
                from sklearn.naive_bayes import GaussianNB
                m = GaussianNB().fit(clf_data["X_train"], clf_data["y_train"])
            elif "Decision Tree" in name:
                from sklearn.tree import DecisionTreeClassifier
                m = DecisionTreeClassifier(max_depth=15, min_samples_leaf=10, random_state=RANDOM_STATE).fit(clf_data["X_train"], clf_data["y_train"])
            elif "Support Vector" in name:
                from sklearn.svm import SVC
                m = SVC(kernel="rbf", C=10.0, class_weight="balanced", random_state=RANDOM_STATE).fit(clf_data["X_train"][:15000], clf_data["y_train"][:15000])
            joblib.dump(m, fpath)
            base_models[name] = m

    # Train all 5 Review 2 Part B models
    part_b_models = train_ensembles(clf_data["X_train"], clf_data["y_train"])

    # Merge into consolidated 10-model dictionary
    all_models = {**base_models, **part_b_models}

    # Consolidated Evaluation across all 10 algorithms (Deliverable D6 & Rubric A2)
    cdf = evaluate_all(
        all_models, clf_data["X_test"], clf_data["y_test"],
        feature_names=clf_data["feature_names"],
    )
    print("\nConsolidated 10-Algorithm Classification Evaluation Complete.")
