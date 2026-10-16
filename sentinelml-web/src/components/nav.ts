import { LayoutDashboard, Database, Workflow, ShieldAlert, LineChart, GitCompareArrows, Radar, Lightbulb, Presentation, Route, Network, type LucideIcon } from 'lucide-react'
export interface NavItem { path: string; label: string; icon: LucideIcon; desc: string }
export const NAV: NavItem[] = [
  { path: '/', label: 'Overview', icon: LayoutDashboard, desc: 'Executive dashboard and system status' },
  { path: '/dataset', label: 'Dataset Explorer', icon: Database, desc: 'Classes, files, data quality and features' },
  { path: '/preprocessing', label: 'Preprocessing', icon: Workflow, desc: '12-step leakage-aware pipeline' },
  { path: '/classification', label: 'Classification', icon: ShieldAlert, desc: 'Binary intrusion classification' },
  { path: '/regression', label: 'Regression', icon: LineChart, desc: 'log1p(Flow Duration) prediction' },
  { path: '/clustering', label: 'Clustering', icon: Network, desc: 'K-Means and Agglomerative traffic clusters' },
  { path: '/comparison', label: 'Model Comparison', icon: GitCompareArrows, desc: 'Compare, rank and export models' },
  { path: '/predictor', label: 'Live Predictor', icon: Radar, desc: 'Single-flow prediction demo' },
  { path: '/explainability', label: 'Explainability', icon: Lightbulb, desc: 'Feature importance and contributions' },
  { path: '/presentation', label: 'Review Presentation', icon: Presentation, desc: 'Evaluator presentation mode' },
  { path: '/roadmap', label: 'Future Roadmap', icon: Route, desc: 'Planned extensions and status' },
]
