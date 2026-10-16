import { useRef, useState } from 'react'
import { Activity, Cpu, FlaskConical, RotateCcw, ShieldAlert, Sparkles, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { PredictionForm, validateAll, validateField, type FormErrors, type FormValues } from '@/components/PredictionForm'
import { ClassificationResult, RegressionResult } from '@/components/PredictionResult'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Controls'
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { Badge, SimulatedBadge } from '@/components/StatusBadge'
import { useSessionState } from '@/hooks/useSessionState'
import { BACKEND_CONNECTED, predictorApi } from '@/api/client'
import type { ClassificationResponse, RegressionResponse } from '@/api/types'
import { DEFAULT_ATTACK, DEFAULT_BENIGN, FLOW_FIELDS, PRESETS, REGRESSION_EXCLUDED, type FlowValues } from '@/data/samples'
import { CLASSIFIERS } from '@/data/classification'
import { REGRESSORS } from '@/data/regression'

const toStrings = (v: FlowValues): FormValues => Object.fromEntries(FLOW_FIELDS.map((f) => [f.key, String(v[f.key] ?? 0)]))
const toNumbers = (v: FormValues): FlowValues => Object.fromEntries(FLOW_FIELDS.map((f) => [f.key, Number(v[f.key])])) as FlowValues

type Result = { kind: 'clf'; data: ClassificationResponse } | { kind: 'reg'; data: RegressionResponse }

export default function Predictor() {
  const toast = useToast()
  const [values, setValues] = useSessionState<FormValues>('pr-values', toStrings(DEFAULT_BENIGN.values))
  const [source, setSource] = useSessionState('pr-source', DEFAULT_BENIGN.label)
  const [errors, setErrors] = useState<FormErrors>({})
  const [clfId, setClfId] = useSessionState('pr-clf', 'knn')
  const [regId, setRegId] = useSessionState('pr-reg', 'rf')
  const [result, setResult] = useSessionState<Result | null>('pr-result', null)
  const [loading, setLoading] = useState<'clf' | 'reg' | null>(null)
  const [error, setError] = useState<{ kind: 'clf' | 'reg'; msg: string } | null>(null)
  const [preset, setPreset] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const fill = (v: FlowValues, label: string) => { setValues(toStrings(v)); setSource(label); setErrors({}); setResult(null); setError(null); toast('info', 'Sample loaded', label) }
  const reset = () => { setValues(toStrings(Object.fromEntries(FLOW_FIELDS.map((f) => [f.key, 0])) as FlowValues)); setSource('Cleared'); setErrors({}); setResult(null); setError(null) }
  const edit = (k: string, v: string) => { setValues((p) => ({ ...p, [k]: v })); setSource('Custom input'); if (errors[k]) setErrors((e) => { const n = { ...e }; delete n[k]; return n }) }
  const blur = (k: string) => { const f = FLOW_FIELDS.find((x) => x.key === k)!; const m = validateField(f, values[k] ?? ''); setErrors((e) => { const n = { ...e }; if (m) n[k] = m; else delete n[k]; return n }) }

  const run = async (kind: 'clf' | 'reg') => {
    const errs = validateAll(values)
    const relevant = kind === 'reg' ? Object.fromEntries(Object.entries(errs).filter(([k]) => !REGRESSION_EXCLUDED.includes(k))) : errs
    setErrors(errs)
    if (Object.keys(relevant).length) {
      toast('error', 'Fix invalid inputs', `${Object.keys(relevant).length} field(s) need attention.`)
      const first = FLOW_FIELDS.find((f) => relevant[f.key])
      formRef.current?.querySelector<HTMLInputElement>(`[name="${first?.key}"]`)?.focus()
      return
    }
    setLoading(kind); setError(null)
    try {
      const features = toNumbers(values)
      if (kind === 'clf') {
        const data = await predictorApi.classify({ modelId: clfId, features })
        setResult({ kind, data })
        toast(data.label === 'ATTACK' ? 'warning' : 'success', data.label === 'ATTACK' ? 'Attack pattern detected' : 'Flow looks benign', data.simulated ? 'Simulated demo prediction' : undefined)
      } else {
        const data = await predictorApi.regress({ modelId: regId, features })
        setResult({ kind, data })
        toast('success', 'Duration estimated', data.simulated ? 'Simulated demo prediction' : undefined)
      }
    } catch (e) { setError({ kind, msg: e instanceof Error ? e.message : 'Prediction request failed' }); toast('error', 'Prediction failed') }
    finally { setLoading(null) }
  }

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Live Predictor" title="Single-flow prediction" subtitle="Enter CICFlowMeter-style values for one network flow, or load a sample, then classify it or estimate its duration."
        actions={BACKEND_CONNECTED ? <Badge tone="green">API connected</Badge> : <SimulatedBadge />} />

      {!BACKEND_CONNECTED && (
        <div role="note" className="flex items-start gap-3 rounded-md border border-amber/40 bg-amber/5 p-3">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber" aria-hidden />
          <p className="text-sm text-muted"><strong className="text-amber">Simulated predictions.</strong> No trained model is connected to this site, so results come from a rule-based demo scorer. They illustrate the interface and the kind of signals the models use, and are <em>not</em> real-time ML inference. The project’s actual metrics live on the Classification and Regression pages. See README → “Connecting a FastAPI backend”.</p>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,1fr)]">
        <form ref={formRef} noValidate onSubmit={(e) => { e.preventDefault(); run('clf') }} className="min-w-0 rounded-md border border-line bg-panel p-4" aria-label="Network flow input form">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" icon={<Sparkles className="h-3.5 w-3.5 text-emerald" />} onClick={() => fill(DEFAULT_BENIGN.values, DEFAULT_BENIGN.label)}>Fill sample benign flow</Button>
            <Button type="button" size="sm" icon={<ShieldAlert className="h-3.5 w-3.5 text-red" />} onClick={() => fill(DEFAULT_ATTACK.values, DEFAULT_ATTACK.label)}>Fill sample attack flow</Button>
            <Select label="Load another preset" value={preset} onChange={(v) => { setPreset(''); const p = PRESETS.find((x) => x.id === v); if (p) fill(p.values, p.label) }} className="h-7 text-xs"
              options={[{ value: '', label: 'More presets…' }, ...PRESETS.map((p) => ({ value: p.id, label: p.label }))]} />
            <Button type="button" size="sm" variant="ghost" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={reset}>Reset</Button>
            <span className="ml-auto text-[11px] text-muted">Source: <span className="text-ink">{source}</span></span>
          </div>
          <PredictionForm values={values} errors={errors} onChange={edit} onBlur={blur} excluded={[]} />
          <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Select label="Classification model" value={clfId} onChange={setClfId} className="w-full" options={CLASSIFIERS.map((m) => ({ value: m.id, label: `Classifier · ${m.name}` }))} />
              <Button type="submit" variant="primary" className="w-full" loading={loading === 'clf'} icon={<Activity className="h-4 w-4" />}>{loading === 'clf' ? 'Classifying…' : 'Classify flow'}</Button>
            </div>
            <div className="space-y-2">
              <Select label="Regression model" value={regId} onChange={setRegId} className="w-full" options={REGRESSORS.map((m) => ({ value: m.id, label: `Regressor · ${m.name}` }))} />
              <Button type="button" className="w-full" loading={loading === 'reg'} icon={<Cpu className="h-4 w-4" />} onClick={() => run('reg')}>{loading === 'reg' ? 'Estimating…' : 'Predict duration'}</Button>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-faint">Regression ignores Flow Duration, Flow Bytes/s and Flow Packets/s — they are derived from the target and excluded to prevent leakage.</p>
        </form>

        <section className="min-w-0" aria-label="Prediction result" aria-busy={!!loading}>
          {loading ? <div className="space-y-3" role="status"><LoadingSkeleton className="h-44" /><LoadingSkeleton className="h-40" /><span className="sr-only">Running prediction…</span></div>
            : error ? <ErrorState title="Prediction failed" body={error.msg} onRetry={() => run(error.kind)} />
            : result?.kind === 'clf' ? <ClassificationResult r={result.data} />
            : result?.kind === 'reg' ? <RegressionResult r={result.data} />
            : <EmptyState title="No prediction yet" body="Load a sample flow and press “Classify flow” or “Predict duration”." action={<Badge tone="cyan" icon={<FlaskConical className="h-3 w-3" />}>demo mode</Badge>} />}
        </section>
      </div>
    </div>
  )
}
