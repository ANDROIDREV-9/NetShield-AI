import type { ClassificationRequest, ClassificationResponse, PredictorApi, RegressionRequest, RegressionResponse } from './types'
import { mockClassify, mockRegress } from './mockEngine'
import { FLOW_FIELDS } from '@/data/samples'

/**
 * Backend switch.
 *   - No VITE_API_URL  → built-in simulated scorer (default, works offline, labelled "simulated" in the UI).
 *   - VITE_API_URL=http://localhost:8000 → real FastAPI/Flask service:
 *       POST {url}/api/predict/classification
 *       POST {url}/api/predict/regression
 * See README "Connecting a FastAPI backend" for the exact request/response contract.
 */
const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')
export const BACKEND_CONNECTED = Boolean(BASE)

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const named = (v: Record<string, number>) => Object.fromEntries(FLOW_FIELDS.map((f) => [f.label, v[f.key]]))

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text().catch(() => '')}`.trim())
  return res.json() as Promise<T>
}

export const predictorApi: PredictorApi = {
  async classify(req: ClassificationRequest): Promise<ClassificationResponse> {
    const t0 = performance.now()
    if (BASE) {
      const r = await post<ClassificationResponse>('/api/predict/classification', { model: req.modelId, features: named(req.features) })
      return { ...r, simulated: false, latencyMs: Math.round(performance.now() - t0) }
    }
    await wait(550 + Math.random() * 450)
    return { ...mockClassify(req), latencyMs: Math.round(performance.now() - t0) }
  },
  async regress(req: RegressionRequest): Promise<RegressionResponse> {
    const t0 = performance.now()
    if (BASE) {
      const r = await post<RegressionResponse>('/api/predict/regression', { model: req.modelId, features: named(req.features) })
      return { ...r, simulated: false, latencyMs: Math.round(performance.now() - t0) }
    }
    await wait(500 + Math.random() * 400)
    return { ...mockRegress(req), latencyMs: Math.round(performance.now() - t0) }
  },
}
