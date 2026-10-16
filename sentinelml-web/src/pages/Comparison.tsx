import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import { Award, Download, Scale } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { ChartPanel } from '@/components/ChartPanel'
import { Badge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Segmented, Select } from '@/components/ui/Controls'
import { EmptyState, PageSkeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { useSessionState } from '@/hooks/useSessionState'
import { useLoaded } from '@/hooks/useAsync'
import { useTheme } from '@/hooks/useTheme'
import { CLASSIFIERS } from '@/data/classification'
import { REGRESSORS } from '@/data/regression'
import { downloadCsv } from '@/lib/export'
import { cn } from '@/lib/format'

type Kind = 'classification' | 'regression'
interface Metric { key: string; label: string; better: 'high' | 'low'; digits: number }
const METRICS: Record<Kind, Metric[]> = {
  classification: [
    { key: 'f1', label: 'Weighted F1', better: 'high', digits: 4 }, { key: 'accuracy', label: 'Accuracy', better: 'high', digits: 4 }, { key: 'precision', label: 'Precision (attack)', better: 'high', digits: 4 },
    { key: 'recall', label: 'Recall (attack)', better: 'high', digits: 4 }, { key: 'auc', label: 'ROC-AUC', better: 'high', digits: 4 }, { key: 'fn', label: 'False negatives', better: 'low', digits: 0 },
    { key: 'fp', label: 'False positives', better: 'low', digits: 0 }, { key: 'trainSec', label: 'Training time (s)', better: 'low', digits: 1 },
  ],
  regression: [
    { key: 'r2', label: 'R²', better: 'high', digits: 4 }, { key: 'rmse', label: 'RMSE', better: 'low', digits: 4 }, { key: 'mae', label: 'MAE', better: 'low', digits: 4 },
    { key: 'cv', label: 'CV R² (5-fold)', better: 'high', digits: 4 }, { key: 'trainSec', label: 'Training time (s)', better: 'low', digits: 1 },
  ],
}
const RECS: Record<Kind, { role: string; model: string; why: string; tone: 'emerald' | 'cyan' | 'amber' }[]> = {
  classification: [
    { role: 'Recommended detection model', model: 'KNN or Decision Tree', why: 'KNN has the best weighted F1 (0.9933); the Decision Tree has the best ROC-AUC (0.9959) with microsecond inference. Pick KNN for offline triage, the tree for inline filtering.', tone: 'emerald' },
    { role: 'Recommended interpretable model', model: 'Decision Tree', why: 'Human-readable split rules let analysts audit why a flow was flagged.', tone: 'cyan' },
    { role: 'Recommended probabilistic baseline', model: 'Logistic Regression', why: 'Calibrated probabilities and transparent coefficients; useful for threshold tuning.', tone: 'amber' },
  ],
  regression: [
    { role: 'Recommended overall model', model: 'Random Forest', why: 'R² 0.9999, RMSE 0.0489, MAE 0.0143 — best on every error metric.', tone: 'emerald' },
    { role: 'Recommended interpretable model', model: 'Decision Tree', why: 'R² 0.9998 with explicit thresholds on timing features.', tone: 'cyan' },
    { role: 'Recommended linear baseline', model: 'Linear Regression', why: 'Simple reference (R² 0.6542) that shows how much non-linearity matters.', tone: 'amber' },
  ],
}

export default function Comparison() {
  const ready = useLoaded('cmp')
  const { colors } = useTheme()
  const toast = useToast()
  const [kind, setKind] = useSessionState<Kind>('cmp-kind', 'classification')
  const [metricKey, setMetricKey] = useSessionState('cmp-metric', 'f1')
  const [dir, setDir] = useSessionState<'best' | 'worst'>('cmp-dir', 'best')
  const [picked, setPicked] = useSessionState<string[]>('cmp-pick', ['knn', 'dt'])

  const metrics = METRICS[kind]
  const metric = metrics.find((m) => m.key === metricKey) ?? metrics[0]
  const rows = useMemo(() => (kind === 'classification' ? CLASSIFIERS.map((m) => ({ id: m.id, name: m.name, ...(m as unknown as Record<string, number>) })) : REGRESSORS.map((m) => ({ id: m.id, name: m.name, ...(m as unknown as Record<string, number>) }))) as ({ id: string; name: string } & Record<string, number>)[], [kind])
  const sorted = useMemo(() => [...rows].sort((a, b) => ((metric.better === 'high' ? b[metric.key] - a[metric.key] : a[metric.key] - b[metric.key]) * (dir === 'best' ? 1 : -1))), [rows, metric, dir])
  const bestId = useMemo(() => [...rows].sort((a, b) => (metric.better === 'high' ? b[metric.key] - a[metric.key] : a[metric.key] - b[metric.key]))[0]?.id, [rows, metric])
  const chosen = picked.filter((id) => rows.some((r) => r.id === id))
  const fmt = (m: Metric, v: number) => (m.digits === 0 ? Math.round(v).toLocaleString() : v.toFixed(m.digits))

  const switchKind = (k: Kind) => { setKind(k); setMetricKey(METRICS[k][0].key); setPicked(k === 'classification' ? ['knn', 'dt'] : ['rf', 'dt']) }
  const toggle = (id: string) => {
    if (chosen.includes(id)) return setPicked(chosen.filter((x) => x !== id))
    if (chosen.length >= 3) return toast('warning', 'Maximum of three models', 'Deselect one to add another.')
    setPicked([...chosen, id])
  }
  const exportCsv = () => {
    try { downloadCsv(`sentinelml-${kind}-comparison.csv`, sorted.map((r, i) => ({ rank: i + 1, model: r.name, ...Object.fromEntries(metrics.map((m) => [m.label, fmt(m, r[m.key])])) }))); toast('success', 'Comparison exported', 'CSV saved to your downloads.') }
    catch (e) { toast('error', 'Export failed', e instanceof Error ? e.message : undefined) }
  }
  if (!ready) return <><PageHeader title="Model Comparison" /><PageSkeleton /></>
  const chartData = sorted.map((r) => ({ name: r.name.replace(' Regressor', '').replace(' Regression', '').replace('Support Vector Classifier', 'SVC').replace('Gaussian Naive Bayes', 'Gaussian NB').replace('K-Nearest Neighbors', 'KNN'), value: r[metric.key], id: r.id }))

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Model comparison" title="Unified model comparison" subtitle="Switch task, choose a metric, rank the models and compare up to three side by side."
        actions={<><Segmented label="Task" value={kind} onChange={switchKind} options={[{ value: 'classification', label: 'Classification' }, { value: 'regression', label: 'Regression' }]} />
          <Button icon={<Download className="h-4 w-4" />} onClick={exportCsv}>Export CSV</Button></>} />

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-panel p-3">
        <Select label="Metric" value={metric.key} onChange={setMetricKey} options={metrics.map((m) => ({ value: m.key, label: m.label }))} />
        <Segmented label="Sort order" value={dir} onChange={setDir} options={[{ value: 'best', label: metric.better === 'high' ? 'Highest first' : 'Lowest first' }, { value: 'worst', label: metric.better === 'high' ? 'Lowest first' : 'Highest first' }]} />
        <span className="text-xs text-muted">{metric.better === 'high' ? 'Higher is better' : 'Lower is better'}</span>
        <span className="ml-auto text-xs text-muted">{chosen.length}/3 selected for side-by-side</span>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.3fr_1fr]">
        <section className="min-w-0 rounded-md border border-line bg-panel p-3" aria-label="Comparison table">
          <div className="overflow-x-auto rounded-md border border-line"><table className="w-full min-w-[640px] text-sm">
            <caption className="sr-only">{kind} model comparison sorted by {metric.label}</caption>
            <thead className="bg-panel2 text-xs text-muted"><tr><th scope="col" className="px-3 py-2 text-left font-medium">Compare</th><th scope="col" className="px-2 py-2 text-left font-medium">#</th><th scope="col" className="px-2 py-2 text-left font-medium">Model</th>{metrics.map((m) => <th key={m.key} scope="col" className={cn('px-2 py-2 text-right font-medium', m.key === metric.key && 'text-cyan')}>{m.label}</th>)}</tr></thead>
            <tbody>{sorted.map((r, i) => {
              const best = r.id === bestId
              return (
                <tr key={r.id} className={cn('border-t border-line/60', best && 'bg-emerald/5', chosen.includes(r.id) && 'shadow-[inset_2px_0_0_rgb(var(--cyan))]')}>
                  <td className="px-3 py-2"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--cyan))]" aria-label={`Compare ${r.name}`} checked={chosen.includes(r.id)} onChange={() => toggle(r.id)} /></td>
                  <td className="num px-2 py-2 font-mono text-xs text-muted">{i + 1}</td>
                  <td className="px-2 py-2 font-medium">{r.name} {best && <Badge tone="green" icon={<Award className="h-3 w-3" />}>best</Badge>}</td>
                  {metrics.map((m) => <td key={m.key} className={cn('num px-2 py-2 text-right font-mono text-[13px]', m.key === metric.key && 'font-semibold text-cyan')}>{fmt(m, r[m.key])}</td>)}
                </tr>)
            })}</tbody>
          </table></div>
        </section>

        <ChartPanel title={`Ranking — ${metric.label}`} subtitle={metric.better === 'high' ? 'Higher is better' : 'Lower is better'} exportName={`${kind}-${metric.key}-ranking`}>
          <div className="h-[340px]" role="img" aria-label={`Ranking by ${metric.label}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 56 }}>
                <CartesianGrid horizontal={false} /><XAxis type="number" tick={{ fontSize: 11 }} stroke={colors.line} domain={metric.key === 'r2' || metric.key === 'cv' ? [0.5, 1] : [0, 'auto']} allowDataOverflow />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: colors.muted }} interval={0} stroke={colors.line} />
                <RTooltip cursor={{ fill: 'rgb(var(--panel2))' }} content={<ChartTooltip format={(v) => fmt(metric, v)} />} />
                <Bar dataKey="value" name={metric.label} radius={[0, 3, 3, 0]}>{chartData.map((d) => <Cell key={d.id} fill={d.id === bestId ? colors.emerald : chosen.includes(d.id) ? colors.cyan : colors.slate} />)}<LabelList dataKey="value" position="right" formatter={(v: number) => fmt(metric, v)} style={{ fontSize: 10, fill: colors.muted }} /></Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
      </div>

      <section className="rounded-md border border-line bg-panel p-4" aria-label="Side by side comparison">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Scale className="h-4 w-4 text-cyan" aria-hidden />Side-by-side</h3>
        {chosen.length < 2 ? <div className="mt-3"><EmptyState title="Select two or three models" body="Tick the Compare checkboxes in the table to see metrics side by side." /></div> : (
          <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[420px] text-sm">
            <caption className="sr-only">Selected models compared</caption>
            <thead className="text-xs text-muted"><tr><th scope="col" className="py-2 text-left font-medium">Metric</th>{chosen.map((id) => <th key={id} scope="col" className="py-2 text-right font-medium text-ink">{rows.find((r) => r.id === id)?.name}</th>)}</tr></thead>
            <tbody>{metrics.map((m) => {
              const vals = chosen.map((id) => rows.find((r) => r.id === id)![m.key])
              const bestV = m.better === 'high' ? Math.max(...vals) : Math.min(...vals)
              return <tr key={m.key} className="border-t border-line/60"><th scope="row" className="py-2 text-left font-normal text-muted">{m.label}</th>{vals.map((v, i) => <td key={i} className={cn('num py-2 text-right font-mono text-[13px]', v === bestV && 'font-semibold text-emerald')}>{fmt(m, v)}{v === bestV && vals.filter((x) => x === bestV).length === 1 ? ' ✓' : ''}</td>)}</tr>
            })}</tbody>
          </table></div>)}
      </section>

      <section aria-label="Model selection recommendation">
        <h3 className="mb-2 text-sm font-semibold">Model selection recommendation — {kind}</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {RECS[kind].map((r) => (
            <div key={r.role} className={cn('rounded-md border p-3', r.tone === 'emerald' ? 'border-emerald/40 bg-emerald/5' : r.tone === 'cyan' ? 'border-cyan/40 bg-cyan/5' : 'border-amber/40 bg-amber/5')}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{r.role}</p>
              <p className={cn('mt-1 text-base font-semibold', r.tone === 'emerald' ? 'text-emerald' : r.tone === 'cyan' ? 'text-cyan' : 'text-amber')}>{r.model}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{r.why}</p>
            </div>))}
        </div>
      </section>
    </div>
  )
}
