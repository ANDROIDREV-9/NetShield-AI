import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownRight, ArrowUpRight, Lightbulb } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { ChartPanel } from '@/components/ChartPanel'
import { FeatureImportanceChart } from '@/components/FeatureImportanceChart'
import { Badge, SimulatedBadge } from '@/components/StatusBadge'
import { Select } from '@/components/ui/Controls'
import { PageSkeleton } from '@/components/ui/States'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { useSessionState } from '@/hooks/useSessionState'
import { useLoaded } from '@/hooks/useAsync'
import { useTheme } from '@/hooks/useTheme'
import { CLF_IMPORTANCE, EXPLANATIONS, REG_IMPORTANCE, SIGNED_EFFECTS } from '@/data/importance'
import { PRESETS } from '@/data/samples'
import { mockClassify } from '@/api/mockEngine'

export default function Explainability() {
  const ready = useLoaded('xai')
  const { colors } = useTheme()
  const [presetId, setPresetId] = useSessionState('xai-preset', 'hulk')
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[1]
  const res = useMemo(() => mockClassify({ modelId: 'knn', features: preset.values }), [preset])

  const global = useMemo(() => {
    const norm = (a: typeof CLF_IMPORTANCE) => { const s = a.reduce((x, y) => x + y.value, 0); return Object.fromEntries(a.map((r) => [r.feature, r.value / s])) }
    const c = norm(CLF_IMPORTANCE), r = norm(REG_IMPORTANCE)
    return Array.from(new Set([...Object.keys(c), ...Object.keys(r)])).map((feature) => ({ feature, value: ((c[feature] ?? 0) + (r[feature] ?? 0)) / 2, engineered: CLF_IMPORTANCE.find((x) => x.feature === feature)?.engineered }))
  }, [])
  if (!ready) return <><PageHeader title="Explainability" /><PageSkeleton /></>

  const pos = SIGNED_EFFECTS.filter((e) => e.effect > 0), neg = SIGNED_EFFECTS.filter((e) => e.effect < 0)
  const contrib = res.contributions.map((c) => ({ feature: c.feature, value: +c.contribution.toFixed(3) }))

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Explainability" title="Why do the models decide the way they do?" subtitle="Global importance, directional effects on the ATTACK class and a per-flow explanation. Importances are illustrative until notebook exports are connected." />

      <div className="grid gap-3 xl:grid-cols-3">
        <ChartPanel title="Global feature importance" subtitle="Mean of normalised classification and regression importance" exportName="xai-global" provenance="illustrative"><FeatureImportanceChart data={global} height={360} max={12} /></ChartPanel>
        <ChartPanel title="Classification importance" subtitle="Random Forest · BENIGN vs ATTACK" exportName="xai-clf" provenance="illustrative" footer={<span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-amber" />Amber = engineered domain feature</span>}><FeatureImportanceChart data={CLF_IMPORTANCE} height={360} max={12} /></ChartPanel>
        <ChartPanel title="Regression importance" subtitle="Random Forest · log1p(Flow Duration)" exportName="xai-reg" provenance="illustrative"><FeatureImportanceChart data={REG_IMPORTANCE} height={360} max={12} tone="emerald" /></ChartPanel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-md border border-red/30 bg-panel p-4" aria-label="Positive attack predictors">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-red"><ArrowUpRight className="h-4 w-4" aria-hidden />Positive attack predictors</h3>
          <p className="text-xs text-muted">Higher values push predictions toward ATTACK.</p>
          <ul className="mt-3 space-y-3">{pos.map((e) => <li key={e.feature}><div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{e.feature}</span><Badge tone="red">+{e.effect.toFixed(2)}</Badge></div><p className="mt-0.5 text-xs leading-relaxed text-muted">{e.plain}</p></li>)}</ul>
        </section>
        <section className="rounded-md border border-emerald/30 bg-panel p-4" aria-label="Negative attack predictors">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald"><ArrowDownRight className="h-4 w-4" aria-hidden />Negative attack predictors (benign signals)</h3>
          <p className="text-xs text-muted">Higher values push predictions toward BENIGN.</p>
          <ul className="mt-3 space-y-3">{neg.map((e) => <li key={e.feature}><div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{e.feature}</span><Badge tone="green">{e.effect.toFixed(2)}</Badge></div><p className="mt-0.5 text-xs leading-relaxed text-muted">{e.plain}</p></li>)}</ul>
        </section>
      </div>

      <ChartPanel title="Feature contribution — all effects" subtitle="Average signed effect on the ATTACK score" exportName="xai-signed" provenance="illustrative">
        <div className="h-80" role="img" aria-label="Signed feature effects diverging bar chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...SIGNED_EFFECTS].sort((a, b) => b.effect - a.effect)} layout="vertical" margin={{ left: 6, right: 30 }}>
              <CartesianGrid horizontal={false} /><XAxis type="number" tick={{ fontSize: 11 }} stroke={colors.line} /><YAxis type="category" dataKey="feature" width={160} tick={{ fontSize: 11, fill: colors.muted }} interval={0} stroke={colors.line} />
              <ReferenceLine x={0} stroke={colors.muted} /><RTooltip cursor={{ fill: 'rgb(var(--panel2))' }} content={<ChartTooltip format={(v) => (v > 0 ? '+' : '') + v.toFixed(2)} />} />
              <Bar dataKey="effect" name="Effect" radius={2}>{SIGNED_EFFECTS.map((e) => <Cell key={e.feature} fill={e.effect > 0 ? colors.red : colors.emerald} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartPanel>

      <section className="rounded-md border border-line bg-panel p-4" aria-label="Selected flow explanation">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h3 className="text-sm font-semibold">Selected-flow explanation</h3><p className="text-xs text-muted">Pick a sample flow; the demo scorer shows which features drove its decision.</p></div>
          <div className="flex items-center gap-2"><SimulatedBadge /><Select label="Sample flow" value={presetId} onChange={setPresetId} options={PRESETS.map((p) => ({ value: p.id, label: p.label }))} /></div>
        </div>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div className="h-72" role="img" aria-label="Per-feature contributions for selected flow">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contrib} layout="vertical" margin={{ left: 6, right: 34 }}>
                <CartesianGrid horizontal={false} /><XAxis type="number" tick={{ fontSize: 11 }} stroke={colors.line} /><YAxis type="category" dataKey="feature" width={150} tick={{ fontSize: 11, fill: colors.muted }} interval={0} stroke={colors.line} />
                <ReferenceLine x={0} stroke={colors.muted} /><RTooltip cursor={{ fill: 'rgb(var(--panel2))' }} content={<ChartTooltip format={(v) => (v > 0 ? '+' : '') + v.toFixed(2)} />} />
                <Bar dataKey="value" name="Contribution" radius={2}>{contrib.map((c) => <Cell key={c.feature} fill={c.value > 0 ? colors.red : colors.emerald} />)}<LabelList dataKey="value" position="right" formatter={(v: number) => (v > 0 ? '+' : '') + v.toFixed(2)} style={{ fontSize: 10, fill: colors.muted }} /></Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            <div className={`rounded-md border p-3 ${res.label === 'ATTACK' ? 'border-red/50 bg-red/10' : 'border-emerald/50 bg-emerald/10'}`}>
              <p className="text-xs text-muted">Explainable prediction summary</p>
              <p className={`text-lg font-bold ${res.label === 'ATTACK' ? 'text-red' : 'text-emerald'}`}>{res.label === 'ATTACK' ? 'ATTACK DETECTED' : 'BENIGN TRAFFIC'} · {(res.confidence * 100).toFixed(1)}%</p>
              <p className="mt-1 text-sm text-muted">{res.summary}</p>
              <p className="mt-1 text-xs text-faint">Ground truth for this sample: <span className="text-ink">{preset.truth}</span> ({preset.source}).</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Plain-language explanations">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Lightbulb className="h-4 w-4 text-amber" aria-hidden />Plain-language guide</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{EXPLANATIONS.map((e) => <div key={e.feature} className="min-w-0 rounded-md border border-line bg-panel p-3"><p className="font-mono text-xs text-cyan">{e.feature}</p><p className="mt-1 text-sm text-muted">{e.text}</p></div>)}</div>
      </section>
    </div>
  )
}
