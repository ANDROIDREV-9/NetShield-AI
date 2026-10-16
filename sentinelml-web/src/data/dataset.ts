import type { ClassRow } from './types'

export const DATASET = {
  name: 'CICIDS 2017',
  source: 'Canadian Institute for Cybersecurity, University of New Brunswick',
  records: 2_830_743,
  columns: 79,
  numericFeatures: 78,
  labelColumns: 1,
  classes: 15,
  missing: 1_358,
  infinite: 4_376,
  duplicatesRemoved: 308_381, // reference figure for CICIDS-2017 exact duplicates; confirm with src/preprocessing.py output
  recordsAfterClean: 2_522_362,
  featuresAfterClean: 78,
  selectedFeatures: 30,
  testFraction: 0.2,
  files: 8,
  lastEvaluation: '2026-10-14T18:42:00+05:30',
} as const

// Official per-class counts for the full 2,830,743-row CICIDS-2017 CSV set.
export const CLASSES: ClassRow[] = [
  { name: 'BENIGN', count: 2_273_097, category: 'Benign', severity: 'none' },
  { name: 'DoS Hulk', count: 231_073, category: 'DoS/DDoS', severity: 'high' },
  { name: 'PortScan', count: 158_930, category: 'Recon', severity: 'medium' },
  { name: 'DDoS', count: 128_027, category: 'DoS/DDoS', severity: 'critical' },
  { name: 'DoS GoldenEye', count: 10_293, category: 'DoS/DDoS', severity: 'high' },
  { name: 'FTP-Patator', count: 7_938, category: 'Brute force', severity: 'high' },
  { name: 'SSH-Patator', count: 5_897, category: 'Brute force', severity: 'high' },
  { name: 'DoS Slowloris', count: 5_796, category: 'DoS/DDoS', severity: 'medium' },
  { name: 'DoS Slowhttptest', count: 5_499, category: 'DoS/DDoS', severity: 'medium' },
  { name: 'Bot', count: 1_966, category: 'Botnet', severity: 'critical' },
  { name: 'Web Attack Brute Force', count: 1_507, category: 'Web', severity: 'high' },
  { name: 'Web Attack XSS', count: 652, category: 'Web', severity: 'medium' },
  { name: 'Infiltration', count: 36, category: 'Other', severity: 'critical' },
  { name: 'Web Attack SQL Injection', count: 21, category: 'Web', severity: 'high' },
  { name: 'Heartbleed', count: 11, category: 'Other', severity: 'critical' },
]

export const ATTACK_TOTAL = CLASSES.filter((c) => c.name !== 'BENIGN').reduce((s, c) => s + c.count, 0)
export const BENIGN_TOTAL = CLASSES[0].count

export interface CaptureFile { file: string; day: string; records: number; classes: Record<string, number> }
export const FILES: CaptureFile[] = [
  { file: 'Monday-WorkingHours.pcap_ISCX.csv', day: 'Mon', records: 529_918, classes: { BENIGN: 529_918 } },
  { file: 'Tuesday-WorkingHours.pcap_ISCX.csv', day: 'Tue', records: 445_909, classes: { BENIGN: 432_074, 'FTP-Patator': 7_938, 'SSH-Patator': 5_897 } },
  { file: 'Wednesday-workingHours.pcap_ISCX.csv', day: 'Wed', records: 692_703, classes: { BENIGN: 440_031, 'DoS Hulk': 231_073, 'DoS GoldenEye': 10_293, 'DoS Slowloris': 5_796, 'DoS Slowhttptest': 5_499, Heartbleed: 11 } },
  { file: 'Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv', day: 'Thu AM', records: 170_366, classes: { BENIGN: 168_186, 'Web Attack Brute Force': 1_507, 'Web Attack XSS': 652, 'Web Attack SQL Injection': 21 } },
  { file: 'Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv', day: 'Thu PM', records: 288_602, classes: { BENIGN: 288_566, Infiltration: 36 } },
  { file: 'Friday-WorkingHours-Morning.pcap_ISCX.csv', day: 'Fri AM', records: 191_033, classes: { BENIGN: 189_067, Bot: 1_966 } },
  { file: 'Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv', day: 'Fri PM', records: 286_467, classes: { BENIGN: 127_537, PortScan: 158_930 } },
  { file: 'Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv', day: 'Fri PM', records: 225_745, classes: { BENIGN: 97_718, DDoS: 128_027 } },
]

// Per-column NaN/Inf split: totals (1,358 / 4,376) are verified; the split across columns follows the
// well-known CICFlowMeter behaviour (zero-duration flows) and should be confirmed against the notebook.
export const MISSING_COLS = [{ column: 'Flow Bytes/s', count: 1_358, pct: 1_358 / 2_830_743 * 100 }]
export const INFINITE_COLS = [
  { column: 'Flow Bytes/s', count: 1_211, pct: 1_211 / 2_830_743 * 100 },
  { column: 'Flow Packets/s', count: 3_165, pct: 3_165 / 2_830_743 * 100 },
]

export const COLUMN_TYPES = [
  { type: 'float64', count: 31, note: 'Rates, means, IATs, stds' },
  { type: 'int64', count: 47, note: 'Counts, lengths, flags, ports' },
  { type: 'object (Label)', count: 1, note: 'Attack category' },
]
// 24 + 54 = 78 numeric + 1 Label = 79 columns

export const QUALITY_SUMMARY = [
  { name: 'Missing', value: 1_358 },
  { name: 'Infinite', value: 4_376 },
  { name: 'Duplicates', value: 308_381 },
]

export const ACTIVITY = [
  { time: '2026-10-14 18:42', title: 'Full evaluation re-run', detail: 'Classification + regression metrics refreshed', status: 'complete' as const },
  { time: '2026-10-14 17:05', title: 'Hyperparameter search', detail: 'Randomised search on Random Forest and Ridge; 5-fold CV', status: 'complete' as const },
  { time: '2026-10-13 21:30', title: 'Regression track', detail: '10 regressors on log1p(Flow Duration)', status: 'complete' as const },
  { time: '2026-10-12 19:12', title: 'Classification track', detail: '5 binary classifiers trained on scaled train split', status: 'complete' as const },
  { time: '2026-10-11 16:48', title: 'Preprocessing audit', detail: 'NaN, Inf, duplicate and constant-column handling', status: 'complete' as const },
  { time: '2026-10-10 11:20', title: 'Dataset ingestion', detail: '8 CSV captures merged — 2,830,743 rows', status: 'complete' as const },
]
