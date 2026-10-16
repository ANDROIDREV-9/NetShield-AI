import { AlertOctagon, CheckCircle2, Clock, Timer, TriangleAlert } from 'lucide-react'
import type { ClassificationResponse, RegressionResponse } from '@/api/types'
import { cn, fmtNum } from '@/lib/format'
import { Badge, SimulatedBadge } from './StatusBadge'
import { CLASSIFIERS } from '@/data/classification'
import { REGRESSORS } from '@/data/regression'

export function ClassificationResult({ r }: { r: ClassificationResponse }) {
  const attack = r.label === 'ATTACK'
  const max = Math.max(...r.contributions.map((c) => Math.abs(c.contribution)), 0.01)
  const model = CLASSIFIERS.find((m) => m.id === r.modelId)
  const riskTone = r.risk === 'Low' ? 'green' : r.risk === 'Medium' ? 'amber' : 'red'
  return (
    <div className="space-y-3" aria-live="polite">
      <div className={cn('rounded-md border p-4', attack ? 'border-red/60 bg-red/10' : 'border-emerald/50 bg-emerald/10')} role="status">
        <div className="flex items-start gap-3">
          {attack ? <AlertOctagon className="h-8 w-8 shrink-0 text-red" aria-hidden /> : <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald" aria-hidden />}
          <div className="min-w-0 flex-1">
            <p className={cn('text-lg font-bold tracking-wide', attack ? 'text-red' : 'text-emerald')}>{attack ? 'ATTACK DETECTED' : 'BENIGN TRAFFIC'}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5"><Badge tone={riskTone}>{r.risk} risk</Badge>{r.simulated && <SimulatedBadge />}<Badge>{model?.short ?? r.modelId}</Badge></div>
          </div>
        </div>
        {r.warning && <p className="mt-3 flex items-start gap-2 rounded border border-red/40 bg-bg/40 p-2 text-xs"><TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red" aria-hidden />{r.warning}</p>}
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-[11px] uppercase tracking-wider text-muted">Confidence</p><p className="num font-mono text-xl font-semibold">{(r.confidence * 100).toFixed(1)}%</p></div>
          <div><p className="text-[11px] uppercase tracking-wider text-muted">P(attack)</p><p className="num font-mono text-xl font-semibold">{(r.attackProbability * 100).toFixed(1)}%</p></div>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded bg-line" role="progressbar" aria-label="Attack probability" aria-valuenow={Math.round(r.attackProbability * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className={cn('h-full', attack ? 'bg-red' : 'bg-emerald')} style={{ width: `${r.attackProbability * 100}%` }} />
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted"><Clock className="h-3 w-3" aria-hidden />{r.latencyMs} ms · {r.simulated ? 'demo scorer — not the trained model' : 'served by API'}</p>
      </div>

      <div className="rounded-md border border-line bg-panel p-3">
        <h4 className="text-sm font-semibold">Top contributing features</h4>
        <ul className="mt-2 space-y-1.5" aria-label="Feature contributions">
          {r.contributions.map((c) => (
            <li key={c.feature} className="grid grid-cols-[minmax(0,1fr)_110px] items-center gap-2 text-xs">
              <span className="truncate" title={c.feature}>{c.feature} <span className="font-mono text-faint">= {fmtNum(c.value, 2)}</span></span>
              <span className="flex items-center gap-1.5">
                <span className="relative h-2 flex-1 overflow-hidden rounded bg-line"><span className={cn('absolute inset-y-0', c.contribution >= 0 ? 'left-1/2 bg-red' : 'right-1/2 bg-emerald')} style={{ width: `${(Math.abs(c.contribution) / max) * 50}%` }} /><span className="absolute inset-y-0 left-1/2 w-px bg-muted/50" /></span>
                <span className={cn('num w-10 text-right font-mono', c.contribution >= 0 ? 'text-red' : 'text-emerald')}>{c.contribution > 0 ? '+' : ''}{c.contribution.toFixed(2)}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-faint"><span className="text-red">Red</span> pushes toward ATTACK, <span className="text-emerald">green</span> toward BENIGN.</p>
      </div>
      <div className="rounded-md border border-line bg-panel p-3"><h4 className="text-sm font-semibold">Explanation</h4><p className="mt-1 text-sm leading-relaxed text-muted">{r.summary}</p></div>
    </div>
  )
}

export function RegressionResult({ r }: { r: RegressionResponse }) {
  const model = REGRESSORS.find((m) => m.id === r.modelId)
  return (
    <div className="rounded-md border border-cyan/40 bg-cyan/5 p-4" role="status" aria-live="polite">
      <div className="flex flex-wrap items-center gap-1.5"><Timer className="h-5 w-5 text-cyan" aria-hidden /><span className="text-sm font-semibold">Predicted flow duration</span>{r.simulated && <SimulatedBadge />}<Badge>{model?.name ?? r.modelId}</Badge></div>
      <p className="num mt-3 font-mono text-3xl font-semibold text-cyan">{r.predictedLog.toFixed(3)}</p><p className="text-xs text-muted">log1p(Flow Duration)</p>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-[11px] uppercase tracking-wider text-muted">Duration</dt><dd className="num font-mono">{fmtNum(r.predictedMicroseconds, 0)} µs</dd><dd className="num font-mono text-xs text-muted">{r.predictedSeconds < 1 ? `${(r.predictedSeconds * 1000).toFixed(2)} ms` : `${r.predictedSeconds.toFixed(3)} s`}</dd></div>
        <div><dt className="text-[11px] uppercase tracking-wider text-muted">≈95% band (±1.96·RMSE)</dt><dd className="num font-mono">{r.interval[0].toFixed(2)} – {r.interval[1].toFixed(2)}</dd></div>
      </dl>
      <p className="mt-3 text-sm leading-relaxed text-muted">{r.summary}</p>
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted"><Clock className="h-3 w-3" aria-hidden />{r.latencyMs} ms</p>
    </div>
  )
}
