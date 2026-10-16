import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip as RTooltip, XAxis, YAxis, ZAxis, LabelList, ReferenceLine } from 'recharts'
import { ShieldAlert, ThumbsUp, ThumbsDown, Target } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { ModelCard } from '@/components/ModelCard'
import { ChartPanel } from '@/components/ChartPanel'
import { ConfusionMatrix } from '@/components/ConfusionMatrix'
import { Segmented, Select, Tabs } from '@/components/ui/Controls'
import { Badge, ProvenanceBadge } from '@/components/StatusBadge'
import { EmptyState, PageSkeleton } from '@/components/ui/States'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { useSessionState } from '@/hooks/useSessionState'
import { useLoaded } from '@/hooks/useAsync'
import { useTheme } from '@/hooks/useTheme'
import { CLASSIFIERS, MODEL_NOTES, ROC_GRID, TEST_ATTACK, TEST_BENIGN, TEST_SIZE } from '@/data/classification'
import type { ClassifierMetrics } from '@/data/types'
import { fmtInt } from '@/lib/format'

type SortKey = 'f1' | 'recall' | 'precision' | 'accuracy' | 'auc' | 'trainSec' | 'fn'
const SORTS: { value: SortKey; label: string }[] = [
  { value: 'f1', label: 'Weighted F1' }, { value: 'recall', label: 'Recall (attack)' }, { value: 'precision', label: 'Precision (attack)' },
  { value: 'accuracy', label: 'Accuracy' }, { value: 'auc', label: 'ROC-AUC' }, { value: 'fn', label: 'False negatives' }, { value: 'trainSec', label: 'Training time' },
]
const f1 = (p: number, r: number) => (2 * p * r) / (p + r)

function report(m: ClassifierMetrics) {
  const p1 = m.tp / (m.tp + m.fp), r1 = m.tp / (m.tp + m.fn), p0 = m.tn / (m.tn + m.fn), r0 = m.tn / (m.tn + m.fp)
  return [
    { cls: '0 — BENIGN', p: p0, r: r0, f: f1(p0, r0), n: TEST_BENIGN },
    { cls: '1 — ATTACK', p: p1, r: r1, f: f1(p1, r1), n: TEST_ATTACK },
  ]
}

export default function Classification() {
  const ready = useLoaded('clf')
  const { colors } = useTheme()
  const [sortKey, setSortKey] = useSessionState<SortKey>('clf-sort', 'f1')
  const [dir, setDir] = useSessionState<'desc' | 'asc'>('clf-dir', 'desc')
  const [filter, setFilter] = useSessionState('clf-filter', 'all')
  const [sel, setSel] = useSessionState('clf-sel', 'knn')
  const [tab, setTab] = useSessionState('clf-tab', 'matrix')
  const [norm, setNorm] = useSessionState('clf-norm', false)

  const rankOf = useMemo(() => Object.fromEntries([...CLASSIFIERS].sort((a, b) => b.f1 - a.f1).map((m, i) => [m.id, i + 1])), [])
  const list = useMemo(() => {
    const out = CLASSIFIERS.filter((m) => filter === 'all' || m.status === filter)
    return out.sort((a, b) => (dir === 'desc' ? 1 : -1) * ((b[sortKey] as number) - (a[sortKey] as number)))
  }, [sortKey, dir, filter])
  const model = CLASSIFIERS.find((m) => m.id === sel) ?? CLASSIFIERS[0]
  const notes = MODEL_NOTES[model.id]
  if (!ready) return <><PageHeader title="Binary Intrusion Classification" /><PageSkeleton /></>

  const colorOf = (id: string) => colors.series[CLASSIFIERS.findIndex((m) => m.id === id)]
  const bars = [...CLASSIFIERS].sort((a, b) => b.f1 - a.f1).map((m) => ({ name: m.short, f1: m.f1, id: m.id }))
  const errs = CLASSIFIERS.map((m) => ({ name: m.short, 'False negatives (missed attacks)': m.fn, 'False positives (false alarms)': m.fp }))
  const radarKeys = [['Accuracy', 'accuracy'], ['Precision', 'precision'], ['Recall', 'recall'], ['Wtd F1', 'f1'], ['ROC-AUC', 'auc']] as const
  const radar = radarKeys.map(([label, k]) => ({ metric: label, ...Object.fromEntries(CLASSIFIERS.map((m) => [m.short, m[k]])) }))
  const rep = report(model)

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Classification" title="Binary Intrusion Classification"
        subtitle={<>Target: <Badge tone="green">0 = BENIGN</Badge> <Badge tone="red">1 = ATTACK</Badge> — five classifiers evaluated on a stratified 20% held-out test set ({fmtInt(TEST_SIZE)} flows).</>}
        actions={<div className="flex flex-wrap items-center gap-2">
          <Select label="Sort models by" value={sortKey} onChange={(v) => setSortKey(v as SortKey)} options={SORTS} />
          <Segmented label="Sort direction" value={dir} onChange={setDir} options={[{ value: 'desc', label: 'High → low' }, { value: 'asc', label: 'Low → high' }]} />
          <Select label="Filter by model status" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All statuses' }, { value: 'Production candidate', label: 'Production candidates' }, { value: 'Baseline', label: 'Baselines' }, { value: 'Needs tuning', label: 'Needs tuning' }, { value: 'Not recommended', label: 'Not recommended' }]} />
        </div>} />

      <div role="note" className="flex items-start gap-3 rounded-md border border-amber/40 bg-amber/5 p-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber" aria-hidden />
        <p className="text-sm text-muted"><strong className="text-amber">Recall and false negatives matter most.</strong> A missed attack (FN) can mean an undetected breach, while a false positive (FP) costs analyst time. Rank models on attack-class recall and FN count, not accuracy alone — Gaussian NB has 0.99 recall but flags most benign traffic.</p>
      </div>

      {list.length === 0 ? <EmptyState title="No models match this filter" body="Choose a different status filter." /> : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {list.map((m) => <ModelCard key={m.id} m={m} rank={rankOf[m.id]} selected={m.id === sel} onSelect={() => setSel(m.id)} best={rankOf[m.id] === 1} />)}
        </div>
      )}
      <p className="text-xs text-muted">KNN and Decision Tree accuracy / F1 / AUC are the project’s verified results; other values are repo README figures or reconstructed — see badges. Precision and recall are for the ATTACK class.</p>

      <div className="grid gap-3 xl:grid-cols-2">
        <ChartPanel title="Weighted F1 comparison" exportName="clf-f1" provenance="reconstructed">
          <div className="h-60" role="img" aria-label="Weighted F1 by classifier">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars} margin={{ top: 18, right: 8, left: -14 }}>
                <CartesianGrid vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} stroke={colors.line} /><YAxis domain={[0, 1]} tick={{ fontSize: 11 }} stroke={colors.line} />
                <RTooltip cursor={{ fill: 'rgb(var(--panel2))' }} content={<ChartTooltip format={(v) => v.toFixed(4)} />} />
                <Bar dataKey="f1" name="Weighted F1" radius={[3, 3, 0, 0]}>{bars.map((b) => <Cell key={b.id} fill={b.id === sel ? colors.cyan : colors.slate} />)}<LabelList dataKey="f1" position="top" formatter={(v: number) => v.toFixed(4)} style={{ fontSize: 10, fill: colors.muted }} /></Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel title="ROC curves — all five models" subtitle="True-positive rate vs false-positive rate (reconstructed from reported AUC)" exportName="clf-roc" provenance="reconstructed">
          <div className="h-60" role="img" aria-label="ROC curves for all classifiers">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ROC_GRID} margin={{ top: 4, right: 12, left: -8, bottom: 14 }}>
                <CartesianGrid /><XAxis type="number" dataKey="fpr" domain={[0, 1]} tick={{ fontSize: 11 }} stroke={colors.line} label={{ value: 'False positive rate', position: 'insideBottom', offset: -8, fontSize: 11, fill: colors.muted }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} stroke={colors.line} />
                <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke={colors.line} strokeDasharray="4 4" />
                <RTooltip content={<ChartTooltip format={(v) => v.toFixed(3)} labelFormat={(l) => `FPR ${Number(l).toFixed(3)}`} />} />
                <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: 11 }} />
                {CLASSIFIERS.map((m) => <Line key={m.id} type="monotone" dataKey={m.id} name={`${m.short} (${m.auc.toFixed(4)})`} stroke={colorOf(m.id)} strokeWidth={m.id === sel ? 2.5 : 1.4} dot={false} isAnimationActive={false} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel title="Precision vs recall" subtitle="Attack class — upper-right is best" exportName="clf-pr" provenance="reconstructed">
          <div className="h-60" role="img" aria-label="Precision versus recall scatter plot">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 16, left: -6, bottom: 16 }}>
                <CartesianGrid /><XAxis type="number" dataKey="recall" name="Recall" domain={[0.9, 1]} tick={{ fontSize: 11 }} stroke={colors.line} label={{ value: 'Recall', position: 'insideBottom', offset: -8, fontSize: 11, fill: colors.muted }} />
                <YAxis type="number" dataKey="precision" name="Precision" domain={[0, 1]} tick={{ fontSize: 11 }} stroke={colors.line} /><ZAxis range={[90, 90]} />
                <RTooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => active && payload?.length ? <div className="rounded border border-line bg-panel2 px-2.5 py-1.5 text-xs"><b>{(payload[0].payload as ClassifierMetrics).name}</b><div className="num font-mono">P {(payload[0].payload as ClassifierMetrics).precision.toFixed(4)} · R {(payload[0].payload as ClassifierMetrics).recall.toFixed(4)}</div></div> : null} />
                {CLASSIFIERS.map((m) => <Scatter key={m.id} name={m.short} data={[m]} fill={colorOf(m.id)}><LabelList dataKey="short" position="top" style={{ fontSize: 10, fill: colors.muted }} /></Scatter>)}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel title="False negatives vs false positives" subtitle={`Counts on ${fmtInt(TEST_SIZE)} test flows — log scale`} exportName="clf-errors" provenance="reconstructed">
          <div className="h-60" role="img" aria-label="False negatives and false positives by classifier">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errs} margin={{ top: 8, right: 8, left: -4 }}>
                <CartesianGrid vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} stroke={colors.line} /><YAxis scale="log" domain={[100, 'auto']} allowDataOverflow tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} stroke={colors.line} />
                <RTooltip cursor={{ fill: 'rgb(var(--panel2))' }} content={<ChartTooltip format={fmtInt} />} /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="False negatives (missed attacks)" fill={colors.red} radius={[3, 3, 0, 0]} /><Bar dataKey="False positives (false alarms)" fill={colors.amber} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel className="xl:col-span-2" title="Metric radar" subtitle="Accuracy, attack precision, attack recall, weighted F1, ROC-AUC" exportName="clf-radar" provenance="reconstructed">
          <div className="h-80" role="img" aria-label="Radar chart of classification metrics">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="72%">
                <PolarGrid stroke={colors.line} /><PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: colors.muted }} /><PolarRadiusAxis domain={[0, 1]} tick={{ fontSize: 10, fill: colors.muted }} angle={90} />
                {CLASSIFIERS.map((m) => <Radar key={m.id} name={m.short} dataKey={m.short} stroke={colorOf(m.id)} fill={colorOf(m.id)} fillOpacity={m.id === sel ? 0.22 : 0.04} strokeWidth={m.id === sel ? 2.4 : 1.2} isAnimationActive={false} />)}
                <Legend wrapperStyle={{ fontSize: 11 }} /><RTooltip content={<ChartTooltip format={(v) => v.toFixed(4)} />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
      </div>

      <section className="rounded-md border border-line bg-panel" aria-label={`${model.name} details`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div><h3 className="text-base font-semibold">{model.name}</h3><p className="text-xs text-muted">{model.params}</p></div>
          <div className="flex items-center gap-2"><Select label="Selected model" value={sel} onChange={setSel} options={CLASSIFIERS.map((m) => ({ value: m.id, label: m.name }))} /><ProvenanceBadge kind={model.provenance} /></div>
        </div>
        <div className="px-4 pt-2"><Tabs label="Model detail sections" active={tab} onChange={setTab} tabs={[{ id: 'matrix', label: 'Confusion matrix' }, { id: 'report', label: 'Classification report' }, { id: 'explain', label: 'Explanation' }]} /></div>
        <div className="p-4">
          {tab === 'matrix' && (
            <div className="grid gap-4 md:grid-cols-[minmax(280px,420px)_1fr]" role="tabpanel">
              <div><div className="mb-2 flex items-center justify-between"><span className="text-xs text-muted">{fmtInt(TEST_SIZE)} test flows</span><Segmented size="sm" label="Matrix values" value={norm ? 'pct' : 'n'} onChange={(v) => setNorm(v === 'pct')} options={[{ value: 'n', label: 'Counts' }, { value: 'pct', label: 'Row %' }]} /></div>
                <ConfusionMatrix tn={model.tn} fp={model.fp} fn={model.fn} tp={model.tp} normalize={norm} /></div>
              <div className="space-y-2 text-sm">
                <div className="rounded-md border border-red/40 bg-red/5 p-3"><p className="text-xs uppercase tracking-wider text-red">Missed attacks (FN)</p><p className="num font-mono text-2xl">{fmtInt(model.fn)}</p><p className="text-xs text-muted">{((model.fn / TEST_ATTACK) * 100).toFixed(2)}% of {fmtInt(TEST_ATTACK)} attack flows</p></div>
                <div className="rounded-md border border-amber/40 bg-amber/5 p-3"><p className="text-xs uppercase tracking-wider text-amber">False alarms (FP)</p><p className="num font-mono text-2xl">{fmtInt(model.fp)}</p><p className="text-xs text-muted">{((model.fp / TEST_BENIGN) * 100).toFixed(2)}% of {fmtInt(TEST_BENIGN)} benign flows</p></div>
                <p className="text-xs text-muted">Matrix reconstructed from the reported accuracy and an attack-recall estimate on a 20% stratified test split. Replace with <code className="font-mono">confusion_matrix(y_test, y_pred)</code> output for exact counts.</p>
              </div>
            </div>
          )}
          {tab === 'report' && (
            <div role="tabpanel" className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm"><caption className="sr-only">Classification report for {model.name}</caption>
                <thead className="text-xs text-muted"><tr>{['Class', 'Precision', 'Recall', 'F1-score', 'Support'].map((h, i) => <th key={h} scope="col" className={`py-2 font-medium ${i ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead>
                <tbody className="font-mono text-[13px]">
                  {rep.map((r) => <tr key={r.cls} className="border-t border-line/60"><th scope="row" className="py-2 text-left font-sans font-normal">{r.cls}</th><td className="num text-right">{r.p.toFixed(4)}</td><td className={`num text-right ${r.cls.includes('ATTACK') ? 'text-amber' : ''}`}>{r.r.toFixed(4)}</td><td className="num text-right">{r.f.toFixed(4)}</td><td className="num text-right">{fmtInt(r.n)}</td></tr>)}
                  <tr className="border-t border-line"><th scope="row" className="py-2 text-left font-sans font-normal text-muted">accuracy</th><td /><td /><td className="num text-right">{model.accuracy.toFixed(4)}</td><td className="num text-right">{fmtInt(TEST_SIZE)}</td></tr>
                  <tr className="border-t border-line/60"><th scope="row" className="py-2 text-left font-sans font-normal text-muted">weighted avg</th><td className="num text-right">{((rep[0].p * rep[0].n + rep[1].p * rep[1].n) / TEST_SIZE).toFixed(4)}</td><td className="num text-right">{((rep[0].r * rep[0].n + rep[1].r * rep[1].n) / TEST_SIZE).toFixed(4)}</td><td className="num text-right">{model.f1.toFixed(4)}</td><td className="num text-right">{fmtInt(TEST_SIZE)}</td></tr>
                  <tr className="border-t border-line/60"><th scope="row" className="py-2 text-left font-sans font-normal text-muted">ROC-AUC</th><td /><td /><td className="num text-right">{model.auc.toFixed(4)}</td><td /></tr>
                </tbody>
              </table>
            </div>
          )}
          {tab === 'explain' && (
            <div role="tabpanel" className="grid gap-3 md:grid-cols-3">
              <p className="text-sm text-muted md:col-span-3">{notes.explanation}</p>
              <div className="rounded-md border border-emerald/30 bg-emerald/5 p-3"><h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald"><ThumbsUp className="h-3.5 w-3.5" aria-hidden />Strengths</h4><ul className="list-disc space-y-1 pl-4 text-sm marker:text-emerald">{notes.strengths.map((s) => <li key={s}>{s}</li>)}</ul></div>
              <div className="rounded-md border border-red/30 bg-red/5 p-3"><h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-red"><ThumbsDown className="h-3.5 w-3.5" aria-hidden />Weaknesses</h4><ul className="list-disc space-y-1 pl-4 text-sm marker:text-red">{notes.weaknesses.map((s) => <li key={s}>{s}</li>)}</ul></div>
              <div className="rounded-md border border-cyan/30 bg-cyan/5 p-3"><h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cyan"><Target className="h-3.5 w-3.5" aria-hidden />Recommended use</h4><p className="text-sm">{notes.useCase}</p></div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
