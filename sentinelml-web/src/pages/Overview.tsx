import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis, LabelList } from 'recharts'
import { Activity, AlertTriangle, ArrowRight, BadgeCheck, Binary, Database, Gauge, Layers, ShieldCheck, Tags, TrendingUp, Infinity as InfIcon, CircleSlash, ClipboardCheck } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { MetricCard } from '@/components/MetricCard'
import { ChartPanel } from '@/components/ChartPanel'
import { Badge, StatusBadge } from '@/components/StatusBadge'
import { Segmented } from '@/components/ui/Controls'
import { PageSkeleton } from '@/components/ui/States'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { useTheme } from '@/hooks/useTheme'
import { useLoaded } from '@/hooks/useAsync'
import { ACTIVITY, ATTACK_TOTAL, BENIGN_TOTAL, CLASSES, DATASET, QUALITY_SUMMARY } from '@/data/dataset'
import { BEST_CLASSIFIER, CLASSIFIERS } from '@/data/classification'
import { BEST_REGRESSOR, REGRESSORS } from '@/data/regression'
import { fmtInt, fmtCompact } from '@/lib/format'
import type { Status } from '@/data/types'

const STATUS: { label: string; status: Status; detail: string; to: string }[] = [
  { label: 'Data audit', status: 'complete', detail: 'NaN, Inf, duplicates', to: '/dataset' },
  { label: 'Preprocessing', status: 'complete', detail: '12-step pipeline', to: '/preprocessing' },
  { label: 'Classification', status: 'complete', detail: '5 models', to: '/classification' },
  { label: 'Regression', status: 'complete', detail: '10 models', to: '/regression' },
  { label: 'Clustering', status: 'complete', detail: 'K-Means · Ward', to: '/clustering' },
  { label: 'Deployment', status: 'planned', detail: 'FastAPI service', to: '/roadmap' },
]

export default function Overview() {
  const ready = useLoaded('overview')
  const { colors } = useTheme()
  const [scale, setScale] = useState<'log' | 'linear'>('log')
  const attackPct = (ATTACK_TOTAL / DATASET.records) * 100
  const benignPct = (BENIGN_TOTAL / DATASET.records) * 100
  if (!ready) return <><PageHeader title="Overview" /><PageSkeleton /></>

  const donut = [{ name: 'BENIGN', value: BENIGN_TOTAL, fill: colors.emerald }, { name: 'ATTACK', value: ATTACK_TOTAL, fill: colors.red }]
  const attacks = CLASSES.filter((c) => c.name !== 'BENIGN').map((c) => ({ name: c.name, count: c.count }))
  const clf = [...CLASSIFIERS].sort((a, b) => b.f1 - a.f1).map((m) => ({ name: m.short, f1: m.f1, id: m.id }))
  const reg = [...REGRESSORS].sort((a, b) => b.r2 - a.r2).map((m) => ({ name: m.name.replace(' Regressor', '').replace(' Regression', ''), r2: m.r2 }))

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Executive dashboard" title="Network Intrusion Detection — CICIDS 2017"
        subtitle="Machine-learning evaluation of statistical flow features across 2.83M labelled network flows."
        actions={<Link to="/predictor" className="inline-flex h-9 items-center gap-1.5 rounded-md bg-cyan px-3.5 text-sm font-semibold text-[rgb(8_12_16)] hover:brightness-110">Open Live Predictor <ArrowRight className="h-4 w-4" aria-hidden /></Link>} />

      <section aria-label="Pipeline status" className="rounded-md border border-line bg-panel">
        <div className="grid grid-cols-2 divide-x divide-y divide-line sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
          {STATUS.map((s) => (
            <Link key={s.label} to={s.to} className="group px-3 py-2.5 hover:bg-panel2">
              <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-ink">{s.label}</span></div>
              <div className="mt-1.5 flex items-center justify-between gap-2"><StatusBadge status={s.status} /></div>
              <p className="mt-1 text-[11px] text-muted">{s.detail}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard icon={<Database className="h-3.5 w-3.5" />} label="Total records" value="2.83M" sub={fmtInt(DATASET.records)} tone="cyan" />
        <MetricCard icon={<Layers className="h-3.5 w-3.5" />} label="Features" value={DATASET.numericFeatures} sub={`${DATASET.columns} columns incl. label`} hint="78 numerical network-flow features plus 1 label column." />
        <MetricCard icon={<Tags className="h-3.5 w-3.5" />} label="Classes" value={DATASET.classes} sub="BENIGN + 14 attack types" />
        <MetricCard icon={<ShieldCheck className="h-3.5 w-3.5" />} label="BENIGN" value={`${benignPct.toFixed(1)}%`} sub={fmtInt(BENIGN_TOTAL)} tone="emerald" progress={benignPct} />
        <MetricCard icon={<AlertTriangle className="h-3.5 w-3.5" />} label="ATTACK" value={`${attackPct.toFixed(1)}%`} sub={fmtInt(ATTACK_TOTAL)} tone="red" progress={attackPct} />
        <MetricCard icon={<CircleSlash className="h-3.5 w-3.5" />} label="Missing values" value={fmtInt(DATASET.missing)} sub="All in Flow Bytes/s" tone="amber" />
        <MetricCard icon={<InfIcon className="h-3.5 w-3.5" />} label="Infinite values" value={fmtInt(DATASET.infinite)} sub="Zero-duration flows" tone="amber" />
        <MetricCard icon={<Binary className="h-3.5 w-3.5" />} label="Best classification F1" value={BEST_CLASSIFIER.f1.toFixed(4)} sub={`${BEST_CLASSIFIER.name} · weighted`} tone="emerald" />
        <MetricCard icon={<TrendingUp className="h-3.5 w-3.5" />} label="Best regression R²" value={BEST_REGRESSOR.r2.toFixed(4)} sub={BEST_REGRESSOR.name} tone="emerald" />
        <MetricCard icon={<Activity className="h-3.5 w-3.5" />} label="Dataset health" value="Good" sub="3 / 3 audit checks resolved" tone="emerald" progress={100} hint="NaN imputed, Inf replaced, duplicates removed." />
        <MetricCard icon={<Gauge className="h-3.5 w-3.5" />} label="Model readiness" value="Offline" sub="2 of 3 gates · no serving API" tone="amber" progress={67} hint="Gates: evaluation ✔, cross-validation ✔, serving endpoint ✘ (planned)." />
        <MetricCard icon={<ClipboardCheck className="h-3.5 w-3.5" />} label="Review 1 completion" value="100%" sub="4 of 4 deliverables" tone="cyan" progress={100} hint="Audit, preprocessing, classification, regression." />
      </section>

      <section className="rounded-md border border-line bg-panel p-4" aria-labelledby="sys-sum">
        <div className="flex items-start gap-3">
          <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan" aria-hidden />
          <div><h3 id="sys-sum" className="text-sm font-semibold">System summary</h3>
            <p className="mt-1 max-w-4xl text-sm leading-relaxed text-muted">This project evaluates whether statistical network-flow features can identify malicious traffic without relying on predefined attack signatures. Five classifiers separate BENIGN from ATTACK flows, and ten regressors predict <code className="rounded bg-panel2 px-1 font-mono text-xs">log1p(Flow Duration)</code>. KNN reaches a weighted F1 of 0.9933 and the Decision Tree an ROC-AUC of 0.9959; Random Forest regression attains R² 0.9999.</p></div>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-3">
        <ChartPanel title="BENIGN vs ATTACK" subtitle="Share of all 2,830,743 flows" exportName="benign-vs-attack" provenance="verified">
          <div className="relative h-64" role="img" aria-label={`Donut chart: ${benignPct.toFixed(1)}% benign, ${attackPct.toFixed(1)}% attack`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie isAnimationActive={false} data={donut} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="88%" paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
                  {donut.map((d) => <Cell key={d.name} fill={d.fill} />)}
                </Pie>
                <RTooltip content={<ChartTooltip format={(v) => `${fmtInt(v)} (${((v / DATASET.records) * 100).toFixed(2)}%)`} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="num font-mono text-2xl font-semibold">{attackPct.toFixed(1)}%</span><span className="text-xs text-muted">attack traffic</span></div>
          </div>
          <div className="mt-1 flex justify-center gap-4 text-xs"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-emerald" />BENIGN {benignPct.toFixed(1)}%</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-red" />ATTACK {attackPct.toFixed(1)}%</span></div>
        </ChartPanel>

        <ChartPanel className="lg:col-span-2" title="Attack categories" subtitle="14 attack classes — record count" exportName="attack-categories" provenance="verified"
          actions={<Segmented label="Axis scale" size="sm" value={scale} onChange={setScale} options={[{ value: 'log', label: 'Log' }, { value: 'linear', label: 'Linear' }]} />}>
          <div className="h-72" role="img" aria-label="Horizontal bar chart of attack class record counts">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attacks} layout="vertical" margin={{ left: 4, right: 52, top: 2, bottom: 2 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" scale={scale === 'log' ? 'log' : 'linear'} domain={scale === 'log' ? [1, 'auto'] : [0, 'auto']} allowDataOverflow tickFormatter={fmtCompact} tick={{ fontSize: 11 }} stroke={colors.line} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: colors.muted }} interval={0} stroke={colors.line} />
                <RTooltip cursor={{ fill: 'rgb(var(--panel2))' }} content={<ChartTooltip format={fmtInt} />} />
                <Bar dataKey="count" name="Records" fill={colors.red} radius={[0, 3, 3, 0]}><LabelList dataKey="count" position="right" formatter={(v: number) => fmtCompact(v)} style={{ fontSize: 10, fill: colors.muted }} /></Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel title="Classification — weighted F1" subtitle="Held-out test split" exportName="classification-f1" provenance="reconstructed">
          <div className="h-60" role="img" aria-label="Bar chart of classification weighted F1 by model">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clf} margin={{ top: 16, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke={colors.line} /><YAxis domain={[0, 1]} tick={{ fontSize: 11 }} stroke={colors.line} />
                <RTooltip cursor={{ fill: 'rgb(var(--panel2))' }} content={<ChartTooltip format={(v) => v.toFixed(4)} />} />
                <Bar dataKey="f1" name="Weighted F1" radius={[3, 3, 0, 0]}>
                  {clf.map((d, i) => <Cell key={d.id} fill={i === 0 ? colors.emerald : colors.cyan} />)}
                  <LabelList dataKey="f1" position="top" formatter={(v: number) => v.toFixed(3)} style={{ fontSize: 10, fill: colors.muted }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel title="Regression — R²" subtitle="log1p(Flow Duration), axis starts at 0.5" exportName="regression-r2" provenance="reconstructed">
          <div className="h-60" role="img" aria-label="Bar chart of regression R squared by model">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reg} layout="vertical" margin={{ left: 0, right: 40, top: 0, bottom: 0 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" domain={[0.5, 1]} tick={{ fontSize: 11 }} stroke={colors.line} />
                <YAxis type="category" dataKey="name" width={104} tick={{ fontSize: 10, fill: colors.muted }} interval={0} stroke={colors.line} />
                <RTooltip cursor={{ fill: 'rgb(var(--panel2))' }} content={<ChartTooltip format={(v) => v.toFixed(4)} />} />
                <Bar dataKey="r2" name="R²" radius={[0, 3, 3, 0]}>
                  {reg.map((d, i) => <Cell key={d.name} fill={i < 3 ? colors.emerald : colors.slate} />)}
                  <LabelList dataKey="r2" position="right" formatter={(v: number) => v.toFixed(4)} style={{ fontSize: 10, fill: colors.muted }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel title="Dataset quality" subtitle="Issues found in raw data (log scale)" exportName="dataset-quality" provenance="verified"
          footer="Missing and infinite totals are exact; the duplicate count is a reference figure for CICIDS 2017.">
          <div className="h-52" role="img" aria-label="Bar chart of missing, infinite and duplicate counts">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={QUALITY_SUMMARY} margin={{ top: 16, right: 8, bottom: 0, left: -6 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke={colors.line} />
                <YAxis scale="log" domain={[100, 'auto']} allowDataOverflow tickFormatter={fmtCompact} tick={{ fontSize: 11 }} stroke={colors.line} />
                <RTooltip cursor={{ fill: 'rgb(var(--panel2))' }} content={<ChartTooltip format={fmtInt} />} />
                <Bar dataKey="value" name="Count" radius={[3, 3, 0, 0]}>
                  <Cell fill={colors.amber} /><Cell fill={colors.red} /><Cell fill={colors.slate} />
                  <LabelList dataKey="value" position="top" formatter={(v: number) => fmtInt(v)} style={{ fontSize: 10, fill: colors.muted }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel className="lg:col-span-3 xl:col-span-3" title="Recent evaluation activity" subtitle="Project timeline" exportName="">
          <ol className="relative ml-2 space-y-3 border-l border-line pl-5">
            {ACTIVITY.map((a) => (
              <li key={a.time} className="relative">
                <span className="absolute -left-[26px] top-1 flex h-3 w-3 items-center justify-center rounded-full border-2 border-cyan bg-bg" aria-hidden />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  <time className="font-mono text-xs text-muted">{a.time}</time><span className="text-sm font-medium">{a.title}</span><Badge tone="green">done</Badge>
                </div>
                <p className="text-xs text-muted">{a.detail}</p>
              </li>
            ))}
          </ol>
        </ChartPanel>
      </div>
    </div>
  )
}
