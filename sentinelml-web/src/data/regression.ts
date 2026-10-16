import type { RegressorMetrics } from './types'
import { mulberry32, gauss } from '@/lib/rng'

// RF / DT / GB: verified project results. Other seven models use the README benchmark values.
// CV score and training time are illustrative until exported from the notebook.
export const REGRESSORS: RegressorMetrics[] = [
  { id: 'rf', name: 'Random Forest Regressor', family: 'Ensemble (bagging)', r2: 0.9999, rmse: 0.0489, mae: 0.0143, cv: 0.9998, cvStd: 0.0001, trainSec: 142.7, provenance: 'illustrative', headline: 'verified' },
  { id: 'dt', name: 'Decision Tree Regressor', family: 'Tree', r2: 0.9998, rmse: 0.0790, mae: 0.0299, cv: 0.9996, cvStd: 0.0002, trainSec: 4.2, provenance: 'illustrative', headline: 'verified' },
  { id: 'gb', name: 'Gradient Boosting Regressor', family: 'Ensemble (boosting)', r2: 0.9994, rmse: 0.1241, mae: 0.0746, cv: 0.9993, cvStd: 0.0002, trainSec: 96.5, provenance: 'illustrative', headline: 'verified' },
  { id: 'knn', name: 'KNN Regressor', family: 'Instance-based', r2: 0.9954, rmse: 0.2811, mae: 0.0892, cv: 0.9951, cvStd: 0.0006, trainSec: 1.1, provenance: 'illustrative', headline: 'repo' },
  { id: 'svr', name: 'Support Vector Regressor', family: 'Kernel', r2: 0.8845, rmse: 1.412, mae: 0.651, cv: 0.8812, cvStd: 0.004, trainSec: 318.9, provenance: 'illustrative', headline: 'repo' },
  { id: 'poly', name: 'Polynomial Regression', family: 'Linear (degree 2)', r2: 0.7321, rmse: 2.189, mae: 1.421, cv: 0.7284, cvStd: 0.003, trainSec: 9.7, provenance: 'illustrative', headline: 'repo' },
  { id: 'lin', name: 'Linear Regression', family: 'Linear', r2: 0.6542, rmse: 2.4831, mae: 1.7654, cv: 0.6531, cvStd: 0.002, trainSec: 0.6, provenance: 'illustrative', headline: 'repo' },
  { id: 'ridge', name: 'Ridge Regression', family: 'Linear (L2)', r2: 0.6542, rmse: 2.4831, mae: 1.7654, cv: 0.6531, cvStd: 0.002, trainSec: 0.4, provenance: 'illustrative', headline: 'repo' },
  { id: 'enet', name: 'ElasticNet Regression', family: 'Linear (L1+L2)', r2: 0.638, rmse: 2.5401, mae: 1.8102, cv: 0.6367, cvStd: 0.003, trainSec: 3.8, provenance: 'illustrative', headline: 'repo' },
  { id: 'lasso', name: 'Lasso Regression', family: 'Linear (L1)', r2: 0.621, rmse: 2.5991, mae: 1.865, cv: 0.6198, cvStd: 0.003, trainSec: 2.9, provenance: 'illustrative', headline: 'repo' },
]
export const BEST_REGRESSOR = REGRESSORS[0]
export const TREE_REGRESSORS = ['rf', 'dt', 'gb']

/** Reconstructed predicted-vs-actual sample: noise std equals reported RMSE. */
export function predictedVsActual(model: RegressorMetrics, n = 260) {
  const rnd = mulberry32(model.id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7))
  const pts: { actual: number; predicted: number; residual: number }[] = []
  for (let i = 0; i < n; i++) {
    // log1p(duration in µs) is bimodal: short flows (~2–6) and long flows (~10–18)
    const actual = rnd() < 0.55 ? 2 + rnd() * 5 + gauss(rnd) * 0.4 : 10 + rnd() * 7 + gauss(rnd) * 0.5
    const a = Math.min(Math.max(actual, 0), 18.6)
    const predicted = a + gauss(rnd) * model.rmse
    pts.push({ actual: +a.toFixed(3), predicted: +predicted.toFixed(3), residual: +(predicted - a).toFixed(3) })
  }
  return pts
}
export const REGRESSION_WHY = [
  { title: 'Flow duration is largely deterministic in the inputs', body: 'Flow IAT, Fwd/Bwd IAT totals and Active/Idle timings are direct components of duration, so the target is nearly a deterministic function of several features.' },
  { title: 'Piecewise, threshold-like relationships', body: 'Timeouts, TCP handshakes and keep-alives create sharp regime changes that axis-aligned splits capture exactly while a single linear or low-order polynomial surface cannot.' },
  { title: 'Heavy tails and mixed scales', body: 'Trees are invariant to monotonic transforms and robust to the extreme IAT values left after clipping; linear models need the log transform and still underfit.' },
  { title: 'Ensembles cut variance', body: 'Random Forest averages decorrelated trees, reducing the residual noise a single tree keeps — hence the lowest RMSE (0.0489) and MAE (0.0143).' },
]
