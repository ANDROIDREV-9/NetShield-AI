import type { ClassifierMetrics } from './types'
import { DATASET } from './dataset'

/** Held-out test set: 20% stratified split of the cleaned data. */
export const TEST_SIZE = Math.round(DATASET.recordsAfterClean * DATASET.testFraction)
export const TEST_ATTACK_FRACTION = 0.197
export const TEST_ATTACK = Math.round(TEST_SIZE * TEST_ATTACK_FRACTION)
export const TEST_BENIGN = TEST_SIZE - TEST_ATTACK

interface Seed {
  id: string; name: string; short: string; family: string; params: string
  accuracy: number; attackRecall: number; f1: number | null; auc: number; trainSec: number
  status: ClassifierMetrics['status']; headline: ClassifierMetrics['headline']
}

// accuracy / weighted F1 / ROC-AUC for KNN and Decision Tree are the project's verified results.
// LR, GNB and SVC accuracy / AUC come from the repository README (its F1 column is ATTACK-class F1, so weighted F1
// is recomputed here from the reconstructed confusion matrix). Attack recall and training times are
// reconstructed/illustrative; the matrix is derived from (accuracy, attack recall) on the 20% test split.
const SEEDS: Seed[] = [
  { id: 'knn', name: 'K-Nearest Neighbors', short: 'KNN', family: 'Instance-based', params: 'k=7, ball_tree, distance on scaled features', accuracy: 0.9934, attackRecall: 0.9868, f1: 0.9933, auc: 0.9942, trainSec: 6.8, status: 'Production candidate', headline: 'verified' },
  { id: 'dt', name: 'Decision Tree', short: 'DT', family: 'Tree', params: 'max_depth=15, min_samples_leaf=10', accuracy: 0.9914, attackRecall: 0.9821, f1: 0.9914, auc: 0.9959, trainSec: 38.6, status: 'Production candidate', headline: 'verified' },
  { id: 'svc', name: 'Support Vector Classifier', short: 'SVC', family: 'Kernel', params: 'RBF kernel, C=1.0 (sub-sampled training)', accuracy: 0.9599, attackRecall: 0.9414, f1: null, auc: 0.9854, trainSec: 612.3, status: 'Needs tuning', headline: 'repo' },
  { id: 'lr', name: 'Logistic Regression', short: 'LR', family: 'Linear', params: 'lbfgs, C=1.0, max_iter=1000', accuracy: 0.9079, attackRecall: 0.9431, f1: null, auc: 0.9726, trainSec: 21.4, status: 'Baseline', headline: 'repo' },
  { id: 'gnb', name: 'Gaussian Naive Bayes', short: 'GNB', family: 'Probabilistic', params: 'var_smoothing=1e-9', accuracy: 0.2566, attackRecall: 0.9907, f1: null, auc: 0.6403, trainSec: 1.9, status: 'Not recommended', headline: 'repo' },
]

function build(s: Seed): ClassifierMetrics {
  const fn = Math.round(TEST_ATTACK * (1 - s.attackRecall))
  const errors = Math.round((1 - s.accuracy) * TEST_SIZE)
  const fp = Math.max(0, errors - fn)
  const tp = TEST_ATTACK - fn
  const tn = TEST_BENIGN - fp
  const f = (p: number, r: number) => (p + r === 0 ? 0 : (2 * p * r) / (p + r))
  const p1 = tp / (tp + fp), r1 = tp / (tp + fn), p0 = tn / (tn + fn), r0 = tn / (tn + fp)
  const attackF1 = f(p1, r1)
  const weighted = (f(p0, r0) * TEST_BENIGN + attackF1 * TEST_ATTACK) / TEST_SIZE
  return {
    id: s.id, name: s.name, short: s.short, family: s.family, params: s.params,
    accuracy: s.accuracy, f1: s.f1 ?? weighted, attackF1, auc: s.auc, trainSec: s.trainSec, status: s.status,
    recall: r1, precision: p1, tp, fp, fn, tn,
    headline: s.headline, provenance: 'reconstructed',
  }
}

export const CLASSIFIERS: ClassifierMetrics[] = SEEDS.map(build)
export const BEST_CLASSIFIER = [...CLASSIFIERS].sort((a, b) => b.f1 - a.f1)[0]

/** Reconstructed ROC: power-curve TPR = FPR^a with a = 1/AUC - 1 (area under the curve equals the reported AUC). */
export function rocCurve(auc: number, n = 48) {
  const a = 1 / auc - 1
  const pts: { fpr: number; tpr: number }[] = [{ fpr: 0, tpr: 0 }]
  for (let i = 1; i <= n; i++) {
    const f = Math.pow(i / n, 3)
    pts.push({ fpr: f, tpr: Math.pow(f, a) })
  }
  return pts
}

export const ROC_GRID = (() => {
  const grid = Array.from({ length: 61 }, (_, i) => Math.pow(i / 60, 2.2))
  return grid.map((fpr) => {
    const row: Record<string, number> = { fpr }
    for (const m of CLASSIFIERS) row[m.id] = Math.pow(fpr, 1 / m.auc - 1)
    return row
  })
})()

export const MODEL_NOTES: Record<string, { explanation: string; strengths: string[]; weaknesses: string[]; useCase: string }> = {
  knn: {
    explanation: 'Classifies a flow by majority vote among its 7 nearest neighbours in standardised feature space. Highest weighted F1 in the project.',
    strengths: ['Best F1 (0.9933) with no training assumptions', 'Captures local clusters such as repetitive scan patterns', 'Very high recall on volumetric attacks'],
    weaknesses: ['Inference cost grows with training-set size', 'Needs scaling; sensitive to irrelevant features', 'Large model artefact (~10 MB joblib) to ship'],
    useCase: 'Offline or batch triage where highest F1 matters more than per-flow latency.',
  },
  dt: {
    explanation: 'Axis-aligned splits on flow statistics. Slightly lower F1 than KNN but the highest ROC-AUC (0.9959) and fully inspectable rules.',
    strengths: ['Highest ROC-AUC (0.9959)', 'Human-readable rules for analysts', 'Microsecond inference'],
    weaknesses: ['High variance on rare classes', 'Single tree can overfit noisy flows', 'Less stable than ensembles'],
    useCase: 'Inline filtering where explainability and latency matter; interpretable fall-back model.',
  },
  svc: {
    explanation: 'RBF-kernel margin classifier. Strong AUC but trained on a sub-sample because kernel training is quadratic in sample count.',
    strengths: ['Good ranking quality (AUC 0.9854)', 'Robust to moderate noise'],
    weaknesses: ['Training time dominates all other models', 'Weaker precision at the chosen threshold', 'Poor scaling to millions of flows'],
    useCase: 'Small-scale comparisons; not suited to the full 2.8M-row dataset.',
  },
  lr: {
    explanation: 'Linear log-odds model — the probabilistic baseline. Recall is high but many benign flows are flagged, so precision suffers.',
    strengths: ['Calibrated probabilities', 'Fast, tiny model', 'Transparent coefficients'],
    weaknesses: ['Linear boundary misses non-linear attack structure', 'Many false positives (benign flagged as attack)'],
    useCase: 'Probabilistic baseline and threshold-tuning reference.',
  },
  gnb: {
    explanation: 'Assumes features are conditionally independent and Gaussian. Network flow features are strongly correlated and heavy-tailed, so the assumption fails.',
    strengths: ['Near-instant training', 'High attack recall (0.99)'],
    weaknesses: ['Accuracy 0.2566 — flags most benign traffic', 'Independence assumption violated by flow statistics'],
    useCase: 'Not recommended for deployment; useful to demonstrate why assumptions matter.',
  },
}
