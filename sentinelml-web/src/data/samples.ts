export interface FlowField { key: string; label: string; unit: string; min: number; max: number; step: number; hint: string; integer?: boolean }
export type FlowValues = Record<string, number>

export const FLOW_FIELDS: FlowField[] = [
  { key: 'destinationPort', label: 'Destination Port', unit: 'port', min: 0, max: 65535, step: 1, integer: true, hint: 'TCP/UDP destination port (0–65535).' },
  { key: 'flowDuration', label: 'Flow Duration', unit: 'µs', min: 0, max: 120_000_000, step: 1, integer: true, hint: 'Total flow lifetime in microseconds (max ≈ 120 s in CICIDS).' },
  { key: 'totalFwdPackets', label: 'Total Fwd Packets', unit: 'pkts', min: 1, max: 200_000, step: 1, integer: true, hint: 'Packets sent client → server.' },
  { key: 'totalBwdPackets', label: 'Total Backward Packets', unit: 'pkts', min: 0, max: 200_000, step: 1, integer: true, hint: 'Packets sent server → client.' },
  { key: 'totalLenFwd', label: 'Total Length of Fwd Packets', unit: 'bytes', min: 0, max: 200_000_000, step: 1, integer: true, hint: 'Sum of forward payload sizes.' },
  { key: 'totalLenBwd', label: 'Total Length of Bwd Packets', unit: 'bytes', min: 0, max: 200_000_000, step: 1, integer: true, hint: 'Sum of backward payload sizes.' },
  { key: 'fwdPktLenMean', label: 'Fwd Packet Length Mean', unit: 'bytes', min: 0, max: 6000, step: 0.01, hint: 'Mean forward packet size.' },
  { key: 'bwdPktLenMean', label: 'Bwd Packet Length Mean', unit: 'bytes', min: 0, max: 6000, step: 0.01, hint: 'Mean backward packet size.' },
  { key: 'flowBytesPerS', label: 'Flow Bytes/s', unit: 'B/s', min: 0, max: 1_500_000_000, step: 1, hint: 'Throughput. Derived from duration — excluded from regression inputs.' },
  { key: 'flowPacketsPerS', label: 'Flow Packets/s', unit: 'pkt/s', min: 0, max: 4_000_000, step: 0.01, hint: 'Packet rate. Derived from duration — excluded from regression inputs.' },
  { key: 'flowIatMean', label: 'Flow IAT Mean', unit: 'µs', min: 0, max: 120_000_000, step: 0.01, hint: 'Mean inter-arrival time between packets.' },
  { key: 'flowIatMax', label: 'Flow IAT Max', unit: 'µs', min: 0, max: 120_000_000, step: 1, integer: true, hint: 'Longest gap between packets.' },
  { key: 'fwdIatMean', label: 'Fwd IAT Mean', unit: 'µs', min: 0, max: 120_000_000, step: 0.01, hint: 'Mean forward inter-arrival time.' },
  { key: 'initWinFwd', label: 'Init_Win_bytes_forward', unit: 'bytes', min: -1, max: 65535, step: 1, integer: true, hint: 'Initial TCP window size forward (-1 if no handshake seen).' },
  { key: 'avgPacketSize', label: 'Average Packet Size', unit: 'bytes', min: 0, max: 3000, step: 0.01, hint: 'Mean packet size across both directions.' },
  { key: 'pktLenVariance', label: 'Packet Length Variance', unit: 'bytes²', min: 0, max: 100_000_000, step: 0.01, hint: 'Variance of packet sizes.' },
  { key: 'activeMean', label: 'Active Mean', unit: 'µs', min: 0, max: 120_000_000, step: 0.01, hint: 'Mean time the flow was active before going idle.' },
  { key: 'idleMean', label: 'Idle Mean', unit: 'µs', min: 0, max: 120_000_000, step: 0.01, hint: 'Mean time the flow was idle.' },
]
/** Fields excluded from regression because they are direct functions of the target (anti-leakage). */
export const REGRESSION_EXCLUDED = ['flowDuration', 'flowBytesPerS', 'flowPacketsPerS']

export interface Preset { id: string; label: string; truth: 'BENIGN' | string; source: string; values: FlowValues }

const zero = Object.fromEntries(FLOW_FIELDS.map((f) => [f.key, 0])) as FlowValues
const mk = (v: FlowValues): FlowValues => ({ ...zero, ...v })

export const PRESETS: Preset[] = [
  { id: 'benign', label: 'Benign — HTTPS browsing', truth: 'BENIGN', source: 'Typical flow (illustrative)',
    values: mk({ destinationPort: 443, flowDuration: 1_240_000, totalFwdPackets: 14, totalBwdPackets: 17, totalLenFwd: 1_820, totalLenBwd: 24_300, fwdPktLenMean: 130, bwdPktLenMean: 1_430, flowBytesPerS: 21_100, flowPacketsPerS: 25, flowIatMean: 41_300, flowIatMax: 410_000, fwdIatMean: 95_000, initWinFwd: 29_200, avgPacketSize: 845, pktLenVariance: 358_000, activeMean: 0, idleMean: 0 }) },
  { id: 'hulk', label: 'Attack — DoS Hulk', truth: 'DoS Hulk', source: 'sample_test_records.json (+ approximated fields)',
    values: mk({ destinationPort: 80, flowDuration: 1_878, totalFwdPackets: 3, totalBwdPackets: 6, totalLenFwd: 382, totalLenBwd: 11_595, fwdPktLenMean: 127.33, bwdPktLenMean: 1_932.5, flowBytesPerS: 6_373_000, flowPacketsPerS: 4_792, flowIatMean: 235, flowIatMax: 577, fwdIatMean: 940, initWinFwd: 8_192, avgPacketSize: 1_330.78, pktLenVariance: 3_558_249.79, activeMean: 0, idleMean: 0 }) },
  { id: 'portscan', label: 'Attack — PortScan', truth: 'PortScan', source: 'sample_test_records.json (+ approximated fields)',
    values: mk({ destinationPort: 80, flowDuration: 70, totalFwdPackets: 1, totalBwdPackets: 1, flowPacketsPerS: 28_571, flowIatMean: 70, flowIatMax: 70, initWinFwd: 1_024 }) },
  { id: 'ddos', label: 'Attack — DDoS', truth: 'DDoS', source: 'sample_test_records.json (+ approximated fields)',
    values: mk({ destinationPort: 80, flowDuration: 1_293_807, totalFwdPackets: 3, totalBwdPackets: 7, totalLenFwd: 26, totalLenBwd: 11_607, fwdPktLenMean: 8.67, bwdPktLenMean: 1_658.14, flowBytesPerS: 9_000, flowPacketsPerS: 7.7, flowIatMean: 143_756, flowIatMax: 1_292_730, fwdIatMean: 646_900, initWinFwd: 8_192, avgPacketSize: 1_163.3, pktLenVariance: 3_435_230.67 }) },
  { id: 'ftp', label: 'Attack — FTP-Patator', truth: 'FTP-Patator', source: 'sample_test_records.json (+ approximated fields)',
    values: mk({ destinationPort: 21, flowDuration: 5_216_305, totalFwdPackets: 3, totalBwdPackets: 1, flowPacketsPerS: 0.77, flowIatMean: 1_304_076, flowIatMax: 5_214_882, fwdIatMean: 2_608_152, initWinFwd: 29_200 }) },
]
export const DEFAULT_BENIGN = PRESETS[0]
export const DEFAULT_ATTACK = PRESETS[1]
