import { mulberry32, gauss } from '@/lib/rng'
import type { Provenance } from './types'

export interface ClusterAlgo { id: string; name: string; k: number; silhouette: number; davies: number; calinski: number; note: string; provenance: Provenance }

/** Verified against the repo README / Review-2 deck (Track 3). K-Means and Ward produce identical partitions at k = 3. */
export const CLUSTER_ALGOS: ClusterAlgo[] = [
  { id: 'kmeans', name: 'K-Means', k: 3, silhouette: 0.9946, davies: 0.1305, calinski: 205079.63, note: 'Elbow inflection at k = 3', provenance: 'repo' },
  { id: 'agglo', name: 'Agglomerative (Ward)', k: 3, silhouette: 0.9946, davies: 0.1305, calinski: 205079.63, note: 'Dendrogram shows 3 root branches', provenance: 'repo' },
]

export const LINKAGES: { method: string; criterion: string; silhouette: number; davies: number; calinski: number; balance: string }[] = [
  { method: 'Ward', criterion: 'Minimises total within-cluster variance', silhouette: 0.9946, davies: 0.1305, calinski: 205079.63, balance: 'Optimal' },
  { method: 'Complete', criterion: 'Maximum pairwise distance', silhouette: 0.9782, davies: 0.2140, calinski: 142310.12, balance: 'Moderate' },
  { method: 'Average', criterion: 'Mean pairwise distance', silhouette: 0.9810, davies: 0.1895, calinski: 168940.45, balance: 'Moderate' },
]

/** Elbow curve, k = 2..8. Shape is illustrative (inflection at k = 3 is from the README); replace with exported inertia values. */
export const ELBOW = [
  { k: 2, inertia: 9.4e6 }, { k: 3, inertia: 4.1e6 }, { k: 4, inertia: 3.5e6 }, { k: 5, inertia: 3.1e6 },
  { k: 6, inertia: 2.8e6 }, { k: 7, inertia: 2.6e6 }, { k: 8, inertia: 2.45e6 },
]

export const CLUSTER_PROFILES = [
  { id: 0, name: 'Cluster 0', role: 'Normal operational traffic', detail: 'Captures 99.8% of benign flows (README post-hoc cross-tabulation).', tone: 'emerald' as const, share: 0.78 },
  { id: 1, name: 'Cluster 1', role: 'Volumetric flooding', detail: 'High-frequency DDoS-style bursts.', tone: 'red' as const, share: 0.13 },
  { id: 2, name: 'Cluster 2', role: 'Automated scanning', detail: 'PortScan-like short flows to many ports.', tone: 'amber' as const, share: 0.09 },
]

/** Post-hoc cross-tab (rows = cluster, cols = true class). Only the 99.8% benign-in-cluster-0 is from the project; rest illustrative. */
export const CROSSTAB = {
  classes: ['BENIGN', 'DDoS', 'PortScan', 'DoS (other)', 'Other attacks'],
  rows: [
    [99.8, 0.2, 0.6, 1.1, 38.0],
    [0.1, 96.0, 1.4, 62.0, 30.0],
    [0.1, 3.8, 98.0, 36.9, 32.0],
  ],
}

const CENTERS = [{ x: -2.2, y: 0.4, sx: 1.0, sy: 0.9 }, { x: 4.4, y: 3.2, sx: 0.7, sy: 0.8 }, { x: 3.2, y: -3.4, sx: 0.6, sy: 0.6 }]
/** Reconstructed 2-D projection sample (seeded). `kind` picks PCA (elongated) vs t-SNE (compact islands). */
export function projection(kind: 'pca' | 'tsne', n = 360) {
  const rnd = mulberry32(kind === 'pca' ? 11 : 29)
  const pts: { x: number; y: number; cluster: number }[] = []
  for (let i = 0; i < n; i++) {
    const r = rnd(); const c = r < CLUSTER_PROFILES[0].share ? 0 : r < CLUSTER_PROFILES[0].share + CLUSTER_PROFILES[1].share ? 1 : 2
    const m = CENTERS[c]; const s = kind === 'pca' ? 1 : 0.55; const spread = kind === 'pca' ? 1.15 : 1
    pts.push({ x: +(m.x * spread + gauss(rnd) * m.sx * s).toFixed(3), y: +(m.y * spread + gauss(rnd) * m.sy * s).toFixed(3), cluster: c })
  }
  return pts
}

/** SIMULATED nearest-centroid assignment for the demo; not the fitted K-Means model. */
export function assignCluster(attackScore: number): { cluster: number; distances: number[] } {
  const anchors = [0.08, 0.92, 0.72]
  const distances = anchors.map((a) => +Math.abs(attackScore - a).toFixed(3))
  return { cluster: distances.indexOf(Math.min(...distances)), distances }
}
