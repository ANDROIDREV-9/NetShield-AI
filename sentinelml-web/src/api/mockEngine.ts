import type { ClassificationRequest, ClassificationResponse, Contribution, RegressionRequest, RegressionResponse } from './types'
import type { FlowValues } from '@/data/samples'
import { FLOW_FIELDS } from '@/data/samples'
import { CLASSIFIERS } from '@/data/classification'
import { REGRESSORS } from '@/data/regression'

/**
 * DEMO ONLY. A hand-written, rule-based scorer that mimics how the trained models reason about flows.
 * It is NOT the trained scikit-learn model. Replace by calling a real endpoint (see api/client.ts).
 */
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
const lg = (x: number) => Math.log10(Math.max(0, x) + 1)
const label = (k: string) => FLOW_FIELDS.find((f) => f.key === k)?.label ?? k

export function scoreFlow(f: FlowValues): { z: number; terms: Contribution[] } {
  const t: Contribution[] = []
  const add = (key: string, c: number) => t.push({ feature: label(key), value: f[key], contribution: c, direction: c >= 0 ? 'attack' : 'benign' })

  add('pktLenVariance', clamp(0.55 * (lg(f.pktLenVariance) - 6), -0.4, 0.6))
  add('totalLenBwd', f.totalLenFwd + f.totalLenBwd === 0 ? 1.4 + ([21, 22].includes(f.destinationPort) ? 0.6 : 0) : 0)
  const w = f.initWinFwd
  add('initWinFwd', w >= 0 && w <= 8192 ? 0.9 : w < 0 ? 0.4 : w >= 26000 ? -0.8 : 0)
  add('flowPacketsPerS', clamp(0.5 * (lg(f.flowPacketsPerS) - 3), -1, 1.2))
  add('flowIatMax', f.flowIatMax > 1_000_000 ? 1.0 : 0)
  add('avgPacketSize', f.avgPacketSize > 1000 ? 0.6 : f.avgPacketSize > 0 && f.avgPacketSize < 60 ? 0.2 : 0)
  const p = f.destinationPort
  add('destinationPort', [443, 53, 8443].includes(p) ? -0.7 : [21, 22, 23, 3389].includes(p) ? 0.5 : p === 80 ? 0.2 : 0)
  add('totalFwdPackets', Math.abs(Math.log2((f.totalFwdPackets + 1) / (f.totalBwdPackets + 1))) >= 0.95 ? 0.4 : 0)
  add('activeMean', f.idleMean > 5_000_000 ? 0.5 : 0)
  const z = -0.6 + t.reduce((s, x) => s + x.contribution, 0)
  return { z, terms: t.filter((x) => Math.abs(x.contribution) > 1e-9).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)) }
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))
const hash = (f: FlowValues) => Object.values(f).reduce((a, v) => (a * 31 + Math.round(v * 100)) % 1_000_003, 7) / 1_000_003

export function mockClassify(req: ClassificationRequest): ClassificationResponse {
  const { z, terms } = scoreFlow(req.features)
  const model = CLASSIFIERS.find((m) => m.id === req.modelId) ?? CLASSIFIERS[0]
  // weaker models are less decisive: flatten the logit slightly
  const sharp = model.id === 'gnb' ? 0.55 : model.id === 'lr' ? 0.8 : 1
  const jitter = (hash(req.features) - 0.5) * 0.3
  const pAttack = clamp(sigmoid((z + jitter) * sharp), 0.001, 0.999)
  const isAttack = pAttack >= 0.5
  const confidence = isAttack ? pAttack : 1 - pAttack
  const risk = !isAttack ? 'Low' : pAttack > 0.97 ? 'Critical' : pAttack > 0.85 ? 'High' : 'Medium'
  const top = terms.slice(0, 3).map((x) => x.feature).join(', ')
  return {
    label: isAttack ? 'ATTACK' : 'BENIGN', attackProbability: pAttack, confidence, risk,
    contributions: terms.slice(0, 8), modelId: model.id, latencyMs: 0, simulated: true,
    warning: isAttack ? 'Possible intrusion pattern. Review source host, destination port and surrounding flows before blocking.' : undefined,
    summary: isAttack
      ? `The simulated ${model.short} scorer leans ATTACK (${(pAttack * 100).toFixed(1)}%), driven mainly by ${top}.`
      : `The simulated ${model.short} scorer leans BENIGN (${((1 - pAttack) * 100).toFixed(1)}%); the strongest signals were ${top || 'ordinary flow statistics'}.`,
  }
}

export function mockRegress(req: RegressionRequest): RegressionResponse {
  const f = req.features
  const model = REGRESSORS.find((m) => m.id === req.modelId) ?? REGRESSORS[0]
  const pkts = f.totalFwdPackets + f.totalBwdPackets
  const est = Math.max(f.flowIatMax, f.flowIatMean * Math.max(pkts - 1, 0), f.fwdIatMean * Math.max(f.totalFwdPackets - 1, 0), f.activeMean + f.idleMean, 1)
  let predLog = Math.log1p(est)
  if (model.r2 < 0.9) predLog = 8 + (predLog - 8) * 0.62 // linear/kernel models regress toward the mean
  predLog = clamp(predLog + (hash(f) - 0.5) * 2 * model.rmse, 0, 18.6)
  const us = Math.expm1(predLog)
  const half = 1.96 * model.rmse
  return {
    predictedLog: predLog, predictedMicroseconds: us, predictedSeconds: us / 1e6,
    interval: [Math.max(0, predLog - half), predLog + half], modelId: model.id, latencyMs: 0, simulated: true,
    summary: `Simulated ${model.name} estimate of log1p(Flow Duration) using timing and volume inputs (Flow Duration, Flow Bytes/s and Flow Packets/s are excluded as target-derived).`,
  }
}
