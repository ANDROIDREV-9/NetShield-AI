import type { Importance } from './types'

// Relative importances are illustrative (shape follows the RF/GBM plots in the project; export real values
// from the notebook into this file to replace them). `engineered` marks domain-derived ratio features.
export const CLF_IMPORTANCE: Importance[] = [
  { feature: 'Init_Win_bytes_backward', value: 0.112 },
  { feature: 'Destination Port', value: 0.094 },
  { feature: 'bytes_per_fwd_pkt', value: 0.088, engineered: true },
  { feature: 'Packet Length Std', value: 0.081 },
  { feature: 'Bwd Packet Length Mean', value: 0.074 },
  { feature: 'Total Length of Bwd Packets', value: 0.066 },
  { feature: 'Average Packet Size', value: 0.061 },
  { feature: 'Flow IAT Max', value: 0.055 },
  { feature: 'Packet Length Variance', value: 0.049 },
  { feature: 'Flow IAT Std', value: 0.044 },
  { feature: 'Bwd Packets/s', value: 0.04 },
  { feature: 'Fwd IAT Std', value: 0.036 },
  { feature: 'Max Packet Length', value: 0.033 },
  { feature: 'Avg Bwd Segment Size', value: 0.03 },
  { feature: 'ACK Flag Count', value: 0.024 },
]

export const REG_IMPORTANCE: Importance[] = [
  { feature: 'Flow IAT Max', value: 0.31 },
  { feature: 'Idle Min', value: 0.22 },
  { feature: 'Fwd IAT Std', value: 0.14 },
  { feature: 'Flow IAT Std', value: 0.11 },
  { feature: 'Bwd Packets/s', value: 0.052 },
  { feature: 'Total Fwd Packets', value: 0.034 },
  { feature: 'Init_Win_bytes_backward', value: 0.027 },
  { feature: 'Total Length of Bwd Packets', value: 0.022 },
  { feature: 'Packet Length Std', value: 0.019 },
  { feature: 'Destination Port', value: 0.016 },
]

/** Signed contribution toward the ATTACK class (positive = pushes toward attack). */
export const SIGNED_EFFECTS: { feature: string; effect: number; plain: string }[] = [
  { feature: 'Packet Length Variance', effect: 0.19, plain: 'High packet-length variance may indicate unusual traffic structure, e.g. a mix of tiny probes and large payload bursts.' },
  { feature: 'Bwd Packets/s', effect: 0.16, plain: 'A high backward packet rate with little forward payload is typical of scanning and flooding behaviour.' },
  { feature: 'Flow IAT Max', effect: 0.12, plain: 'Very long maximum inter-arrival time suggests persistent or slow connections (Slowloris, Slowhttptest).' },
  { feature: 'PSH Flag Count', effect: 0.1, plain: 'PSH set on short request/response bursts is common in HTTP-layer DoS tools such as Hulk.' },
  { feature: 'Init_Win_bytes_backward', effect: 0.09, plain: 'Unusual initial TCP window sizes betray scripted clients that do not mimic real stacks.' },
  { feature: 'Total Length of Bwd Packets', effect: 0.07, plain: 'Large response volume relative to the request is a signature of amplification and flooding.' },
  { feature: 'Destination Port', effect: -0.06, plain: 'Well-known service ports (443, 53) with ordinary payload patterns lean benign.' },
  { feature: 'Fwd IAT Std', effect: -0.08, plain: 'Irregular, human-paced request spacing leans benign; automated attacks are far more regular or far more bursty.' },
  { feature: 'ACK Flag Count', effect: -0.11, plain: 'Established, acknowledged conversations are strongly associated with ordinary sessions.' },
  { feature: 'Average Packet Size', effect: -0.14, plain: 'Moderate average packet size consistent with ordinary web or DNS usage lowers attack likelihood.' },
]

export const EXPLANATIONS = [
  { feature: 'Packet Length Variance', text: 'High packet-length variance may indicate unusual traffic structure.' },
  { feature: 'Fwd/Bwd imbalance', text: 'High forward/backward packet imbalance may indicate scanning or flooding behaviour.' },
  { feature: 'Flow Duration', text: 'High flow duration may indicate persistent or slow connections.' },
  { feature: 'Flow IAT Max', text: 'A large gap between packets inside one flow can reveal low-and-slow denial-of-service tools.' },
  { feature: 'Init_Win_bytes', text: 'Atypical TCP initial window sizes can indicate scripted or crafted packets.' },
]
