"""
src/train_regression.py
========================
Phase 6 -- Regression Track (All 10 Algorithms)

Part B of the capstone: predict log1p(Flow Duration) using 10 regression
algorithms spanning linear, tree-based, ensemble, and distance-based families.

Linear Models  (Part 8):
  B1 - Linear Regression
  B2 - Ridge Regression (L2)
  B3 - Lasso Regression (L1)
  B4 - ElasticNet (L1+L2)

Advanced Models (Part 9):
  B5 - Decision Tree Regressor
  B6 - Random Forest Regressor
  B7 - Gradient Boosting Regressor
  B8 - XGBoost Regressor
  B9 - LightGBM Regressor
  B10 - KNN Regressor

Usage (standalone):
    python src/train_regression.py
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
    GradientBoostingRegressor,
    RandomForestRegressor,
)
from sklearn.linear_model import ElasticNet, Lasso, LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.neighbors import KNeighborsRegressor
from sklearn.tree import DecisionTreeRegressor

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "..", "results")
RANDOM_STATE = 42


def _eval(name: str, model, Xtr, ytr, Xte, yte, results: dict, verbose: bool):
    """Train a regressor, compute metrics, store results."""
    t0 = time.time()
    model.fit(Xtr, ytr)
    t_train = round(time.time() - t0, 2)
    yp = model.predict(Xte)
    mae  = mean_absolute_error(yte, yp)
    mse  = mean_squared_error(yte, yp)
    rmse = np.sqrt(mse)
    r2   = r2_score(yte, yp)
    results[name] = {
        "MAE": round(mae, 4), "MSE": round(mse, 4),
        "RMSE": round(rmse, 4), "R2": round(r2, 4),
        "Train(s)": t_train, "y_pred": yp, "model": model,
    }
    if verbose:
        print(f"  [{name:<38s}] R2={r2:.4f}  RMSE={rmse:.4f}  "
              f"MAE={mae:.4f}  ({t_train}s)")
    return results


def train_linear_models(
    Xr_train: np.ndarray,
    yr_train: np.ndarray,
    Xr_test: np.ndarray,
    yr_test: np.ndarray,
    verbose: bool = True,
) -> dict:
    """
    Train the 4 linear regression models (B1-B4).

    Returns
    -------
    dict
        {model_name: {MAE, MSE, RMSE, R2, y_pred, model, ...}}
    """
    if verbose:
        print("=" * 65)
        print("  PHASE 6A -- REGRESSION: LINEAR MODELS (B1-B4)")
        print("=" * 65)

    os.makedirs(MODELS_DIR, exist_ok=True)
    results = {}

    # B1 -- Linear Regression
    _eval("B1 - Linear Regression",
          LinearRegression(n_jobs=-1),
          Xr_train, yr_train, Xr_test, yr_test, results, verbose)

    # B2 -- Ridge Regression (L2)
    _eval("B2 - Ridge Regression",
          Ridge(alpha=1.0),
          Xr_train, yr_train, Xr_test, yr_test, results, verbose)

    # B3 -- Lasso Regression (L1)
    _eval("B3 - Lasso Regression",
          Lasso(alpha=0.01, max_iter=2000),
          Xr_train, yr_train, Xr_test, yr_test, results, verbose)

    # B4 -- ElasticNet (L1+L2)
    _eval("B4 - ElasticNet",
          ElasticNet(alpha=0.01, l1_ratio=0.5, max_iter=2000),
          Xr_train, yr_train, Xr_test, yr_test, results, verbose)

    # Save linear models
    for name, res in results.items():
        safe = name.split(" - ")[1].lower().replace(" ", "_")
        joblib.dump(res["model"], os.path.join(MODELS_DIR, f"reg_{safe}.joblib"))

    if verbose:
        print(f"\n  4 linear models trained and saved to models/\n")
    return results


def train_advanced_models(
    Xr_train: np.ndarray,
    yr_train: np.ndarray,
    Xr_test: np.ndarray,
    yr_test: np.ndarray,
    results: dict = None,
    verbose: bool = True,
) -> dict:
    """
    Train the 6 advanced regression models (B5-B10).

    Parameters
    ----------
    results : dict, optional
        Existing results from train_linear_models(). If provided,
        advanced model results are appended.

    Returns
    -------
    dict
        Complete results dict for all 10 regressors.
    """
    if results is None:
        results = {}

    if verbose:
        print("=" * 65)
        print("  PHASE 6B -- REGRESSION: ADVANCED MODELS (B5-B10)")
        print("=" * 65)

    os.makedirs(MODELS_DIR, exist_ok=True)

    # B5 -- Decision Tree Regressor
    _eval("B5 - Decision Tree Regressor",
          DecisionTreeRegressor(max_depth=15, min_samples_leaf=10,
                                random_state=RANDOM_STATE),
          Xr_train, yr_train, Xr_test, yr_test, results, verbose)

    # B6 -- Random Forest Regressor
    _eval("B6 - Random Forest Regressor",
          RandomForestRegressor(n_estimators=100, max_depth=20,
                                min_samples_leaf=5, n_jobs=-1,
                                random_state=RANDOM_STATE),
          Xr_train, yr_train, Xr_test, yr_test, results, verbose)

    # B7 -- Gradient Boosting Regressor
    _eval("B7 - Gradient Boosting Regressor",
          GradientBoostingRegressor(n_estimators=200, max_depth=5,
                                    learning_rate=0.1, subsample=0.8,
                                    random_state=RANDOM_STATE),
          Xr_train, yr_train, Xr_test, yr_test, results, verbose)

    # B8 -- XGBoost Regressor
    try:
        import xgboost as xgb
        _eval("B8 - XGBoost Regressor",
              xgb.XGBRegressor(n_estimators=200, max_depth=8,
                               learning_rate=0.1, subsample=0.8,
                               colsample_bytree=0.8, random_state=RANDOM_STATE,
                               n_jobs=-1, tree_method="hist", eval_metric="rmse"),
              Xr_train, yr_train, Xr_test, yr_test, results, verbose)
    except ImportError:
        if verbose:
            print("  [WARN] xgboost not installed, skipping B8.")

    # B9 -- LightGBM Regressor
    try:
        import lightgbm as lgb
        _eval("B9 - LightGBM Regressor",
              lgb.LGBMRegressor(n_estimators=200, max_depth=10,
                                learning_rate=0.05, num_leaves=63,
                                subsample=0.8, colsample_bytree=0.8,
                                random_state=RANDOM_STATE, n_jobs=-1, verbose=-1),
              Xr_train, yr_train, Xr_test, yr_test, results, verbose)
    except ImportError:
        if verbose:
            print("  [WARN] lightgbm not installed, skipping B9.")

    # B10 -- KNN Regressor (subsample for speed)
    KNN_SAMPLE = min(60_000, len(Xr_train))
    rng = np.random.default_rng(RANDOM_STATE)
    idx = rng.choice(len(Xr_train), KNN_SAMPLE, replace=False)
    _eval("B10 - KNN Regressor",
          KNeighborsRegressor(n_neighbors=7, n_jobs=-1, algorithm="ball_tree"),
          Xr_train[idx], yr_train[idx], Xr_test, yr_test, results, verbose)

    # Save advanced models
    for name, res in results.items():
        if name.startswith("B5") or name.startswith("B6") or name.startswith("B7") \
           or name.startswith("B8") or name.startswith("B9") or name.startswith("B10"):
            safe = name.split(" - ")[1].lower().replace(" ", "_")
            joblib.dump(res["model"], os.path.join(MODELS_DIR, f"reg_{safe}.joblib"))

    if verbose:
        print(f"\n  Advanced models trained and saved to models/\n")
    return results


def evaluate_regression(
    results: dict,
    yr_test: np.ndarray,
    save_plots: bool = True,
    plots_dir: str = None,
    verbose: bool = True,
) -> pd.DataFrame:
    """
    Generate comparison table and diagnostic plots for all 10 regressors.

    Returns
    -------
    pd.DataFrame
        Comparison table sorted by R2 descending.
    """
    if plots_dir is None:
        plots_dir = RESULTS_DIR
    os.makedirs(plots_dir, exist_ok=True)

    if verbose:
        print("=" * 65)
        print("  REGRESSION EVALUATION -- ALL 10 MODELS")
        print("=" * 65)

    # -- Comparison Table ------------------------------------------------------
    metric_cols = ["R2", "RMSE", "MAE", "MSE", "Train(s)"]
    rows = [{**{"Model": n}, **{k: v for k, v in r.items() if k in metric_cols}}
            for n, r in results.items()]
    rdf = pd.DataFrame(rows).set_index("Model").sort_values("R2", ascending=False)

    if verbose:
        print("\n  === REGRESSION MODEL COMPARISON (SORTED BY R2) ===")
        print(rdf.to_string())
        best = rdf["R2"].idxmax()
        print(f"\n  Best Regressor (R2): {best}  (R2={rdf.loc[best, 'R2']:.4f})")

    if save_plots:
        _plot_reg_comparison(rdf, plots_dir)
        _plot_actual_vs_predicted(results, yr_test, plots_dir)
        _plot_residuals(results, yr_test, plots_dir)

    return rdf


# -- Private plotting functions ------------------------------------------------

def _plot_reg_comparison(rdf: pd.DataFrame, plots_dir: str) -> None:
    """Bar chart comparing all regressors on R2, MAE, RMSE, MSE."""
    fig, axes = plt.subplots(1, 4, figsize=(22, 5))
    for ax, metric in zip(axes, ["R2", "MAE", "RMSE", "MSE"]):
        data = rdf[metric].sort_values(ascending=(metric != "R2"))
        bars = ax.barh(data.index, data.values,
                       color=sns.color_palette("plasma", len(data)), edgecolor="black")
        ax.set_title(metric, fontweight="bold")
        for bar, val in zip(bars, data.values):
            ax.text(val + abs(data.values.max()) * 0.01,
                    bar.get_y() + bar.get_height() / 2,
                    f"{val:.4f}", va="center", fontsize=7)
        ax.invert_yaxis()
    plt.suptitle("Regression Model Comparison -- 10 Algorithms",
                 fontsize=13, fontweight="bold")
    plt.tight_layout()
    out = os.path.join(plots_dir, "reg_model_comparison.png")
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  [Plot] Saved: {out}")


def _plot_actual_vs_predicted(results: dict, yr_test: np.ndarray, plots_dir: str) -> None:
    """Scatter: Actual vs Predicted for the best model."""
    best_name = max(results, key=lambda n: results[n]["R2"])
    yp_best = results[best_name]["y_pred"]
    sample_n = min(5000, len(yr_test))
    si = np.random.default_rng(RANDOM_STATE).choice(len(yr_test), sample_n, replace=False)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # Actual vs Predicted
    axes[0].scatter(yr_test[si], yp_best[si], alpha=0.3, s=5, color="steelblue")
    lo = min(yr_test.min(), yp_best.min())
    hi = max(yr_test.max(), yp_best.max())
    axes[0].plot([lo, hi], [lo, hi], "r--", lw=2, label="Perfect fit")
    axes[0].set_xlabel("Actual log1p(Flow Duration)")
    axes[0].set_ylabel("Predicted log1p(Flow Duration)")
    short = best_name.split(" - ")[-1] if " - " in best_name else best_name
    axes[0].set_title(f"Actual vs Predicted -- {short}", fontweight="bold")
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)

    # Residual histogram
    residuals = yr_test - yp_best
    axes[1].hist(residuals, bins=80, color="steelblue", edgecolor="black", alpha=0.7)
    axes[1].axvline(0, color="red", linestyle="--", lw=2)
    axes[1].set_title(f"Residuals Distribution -- {short}", fontweight="bold")
    axes[1].set_xlabel("Residual (Actual - Predicted)")
    axes[1].set_ylabel("Frequency")
    axes[1].grid(True, alpha=0.3)

    plt.tight_layout()
    out = os.path.join(plots_dir, "reg_actual_vs_predicted.png")
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  [Plot] Saved: {out}")


def _plot_residuals(results: dict, yr_test: np.ndarray, plots_dir: str) -> None:
    """Residual scatter plot (predicted vs residual) for top 3 models."""
    sorted_names = sorted(results, key=lambda n: results[n]["R2"], reverse=True)[:3]
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    for ax, name in zip(axes, sorted_names):
        yp = results[name]["y_pred"]
        residuals = yr_test - yp
        sample_n = min(5000, len(yr_test))
        si = np.random.default_rng(42).choice(len(yr_test), sample_n, replace=False)
        ax.scatter(yp[si], residuals[si], alpha=0.3, s=5, color="steelblue")
        ax.axhline(0, color="red", linestyle="--", lw=2)
        short = name.split(" - ")[-1] if " - " in name else name
        ax.set_title(f"Residuals -- {short}", fontweight="bold", fontsize=10)
        ax.set_xlabel("Predicted")
        ax.set_ylabel("Residual")
        ax.grid(True, alpha=0.3)
    plt.suptitle("Residual Analysis -- Top 3 Regressors", fontweight="bold")
    plt.tight_layout()
    out = os.path.join(plots_dir, "reg_residual_analysis.png")
    plt.savefig(out, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  [Plot] Saved: {out}")


if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(__file__))
    from data_loader import load_cicids
    from data_split import split_regression
    from feature_engineering import engineer
    from preprocessing import clean

    data_dir = os.path.join(os.path.dirname(__file__), "..")

    print("Loading pipeline...")
    df_raw = load_cicids(data_dir=data_dir, verbose=False)
    df_clean = clean(df_raw, verbose=False)
    selected, _, _, _ = engineer(df_clean, save_plots=False, verbose=False)
    reg_data = split_regression(df_clean, selected, verbose=False)

    # Part 8: Linear models
    results = train_linear_models(
        reg_data["Xr_train"], reg_data["yr_train"],
        reg_data["Xr_test"], reg_data["yr_test"],
    )

    # Part 9: Advanced models
    results = train_advanced_models(
        reg_data["Xr_train"], reg_data["yr_train"],
        reg_data["Xr_test"], reg_data["yr_test"],
        results=results,
    )

    # Evaluate all 10
    rdf = evaluate_regression(results, reg_data["yr_test"])
    print("\nRegression pipeline complete.")
