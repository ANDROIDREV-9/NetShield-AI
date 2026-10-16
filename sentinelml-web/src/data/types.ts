/** Where a number comes from. Surfaced in the UI so evaluators can tell project results from reconstructions. */
export type Provenance =
  | 'verified'      // supplied directly by the project owner / dataset audit
  | 'repo'          // taken from the project README / notebooks
  | 'reconstructed' // derived deterministically from reported metrics (e.g. confusion matrix)
  | 'illustrative'  // plausible placeholder until real exports are wired in

export type Status = 'complete' | 'in-progress' | 'planned'

export interface ClassRow { name: string; count: number; category: 'Benign' | 'DoS/DDoS' | 'Recon' | 'Brute force' | 'Web' | 'Botnet' | 'Other'; severity: 'none' | 'low' | 'medium' | 'high' | 'critical' }

export interface ClassifierMetrics {
  id: string; name: string; short: string; family: string
  accuracy: number; precision: number; recall: number; f1: number; attackF1: number; auc: number
  trainSec: number; fp: number; fn: number; tp: number; tn: number
  status: 'Production candidate' | 'Baseline' | 'Needs tuning' | 'Not recommended'
  provenance: Provenance; headline: Provenance
  params: string
}

export interface RegressorMetrics {
  id: string; name: string; family: string
  r2: number; rmse: number; mae: number; cv: number; cvStd: number; trainSec: number
  provenance: Provenance; headline: Provenance
}

export interface FeatureStat { name: string; type: 'float64' | 'int64'; group: string; min?: number; max?: number; mean?: number; median?: number; std?: number; missing: number; infinite: number; profiled: boolean; selected: boolean }

export interface Importance { feature: string; value: number; engineered?: boolean }
