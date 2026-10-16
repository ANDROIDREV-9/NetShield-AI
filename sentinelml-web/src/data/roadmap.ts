import type { Status } from './types'
export interface RoadmapItem { id: string; title: string; group: 'Modelling' | 'Unsupervised' | 'Platform'; status: Status; quarter: string; detail: string }
export const ROADMAP: RoadmapItem[] = [
  { id: 'binary', title: 'Binary classification (5 models)', group: 'Modelling', status: 'complete', quarter: 'Review 1', detail: 'LR, KNN, GNB, DT, SVC on BENIGN vs ATTACK.' },
  { id: 'regression', title: 'Flow-duration regression (10 models)', group: 'Modelling', status: 'complete', quarter: 'Review 1', detail: 'log1p(Flow Duration) with 5-fold CV and tuning.' },
  { id: 'multiclass', title: 'Multiclass classification', group: 'Modelling', status: 'in-progress', quarter: 'Review 2', detail: 'Identify the exact attack family across 15 classes.' },
  { id: 'smote', title: 'SMOTE and imbalance handling', group: 'Modelling', status: 'in-progress', quarter: 'Review 2', detail: 'Applied to training split only; class weights for rare attacks.' },
  { id: 'xgb', title: 'XGBoost', group: 'Modelling', status: 'planned', quarter: 'Next', detail: 'Gradient-boosted trees with histogram splits.' },
  { id: 'lgbm', title: 'LightGBM', group: 'Modelling', status: 'planned', quarter: 'Next', detail: 'Leaf-wise boosting for fast training on 2.5M rows.' },
  { id: 'cat', title: 'CatBoost', group: 'Modelling', status: 'planned', quarter: 'Next', detail: 'Ordered boosting with robust defaults.' },
  { id: 'kmeans', title: 'K-Means + Agglomerative clustering', group: 'Unsupervised', status: 'complete', quarter: 'Now', detail: 'k = 3, silhouette 0.9946 — see the Clustering page.' },
  { id: 'dbscan', title: 'DBSCAN', group: 'Unsupervised', status: 'planned', quarter: 'Next', detail: 'Density-based discovery of dense attack bursts and noise.' },
  { id: 'iforest', title: 'Isolation Forest', group: 'Unsupervised', status: 'planned', quarter: 'Next', detail: 'Zero-day oriented anomaly scoring.' },
  { id: 'ingest', title: 'Real-time packet ingestion', group: 'Platform', status: 'planned', quarter: 'Later', detail: 'CICFlowMeter / Zeek streaming into the model.' },
  { id: 'fastapi', title: 'FastAPI deployment', group: 'Platform', status: 'planned', quarter: 'Later', detail: 'POST /api/predict/classification and /regression.' },
  { id: 'streamlit', title: 'Streamlit interface', group: 'Platform', status: 'complete', quarter: 'Now', detail: 'This React console is packaged as a single-file bundle for Streamlit Community Cloud.' },
  { id: 'monitor', title: 'Model monitoring', group: 'Platform', status: 'planned', quarter: 'Later', detail: 'Track precision/recall and false-negative rate in production.' },
  { id: 'drift', title: 'Drift detection', group: 'Platform', status: 'planned', quarter: 'Later', detail: 'PSI / KS tests on feature distributions.' },
]
