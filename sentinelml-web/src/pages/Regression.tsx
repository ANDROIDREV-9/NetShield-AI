import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ErrorBar, LabelList, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip as RTooltip, XAxis, YAxis, ZAxis } from 'recharts'
import { Brain } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { ChartPanel } from '@/components/ChartPanel'
import { DataTable, type Column } from '@/components/DataTable'
import { FeatureImportanceChart } from '@/components/FeatureImportanceChart'
import { Badge, ProvenanceBadge } from '@/components/StatusBadge'
import { Select } from '@/components/ui/Controls'
import { PageSkeleton } from '@/components/ui/States'
import { MetricCard } from '@/components/MetricCard'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { useSessionState } from '@/hooks/useSessionState'
import { useLoaded } from '@/hooks/useAsync'
import { useTheme } from '@/hooks/useTheme'
import { BEST_REGRESSOR, REGRESSION_WHY, REGRESSORS, predictedVsActual, TREE_REGRESSORS } from '@/data/regression'
import { REG_IMPORTANCE } from '@/data/importance'
import type { RegressorMetrics } from '@/data/types'

type Row = RegressorMetrics & { rank: number }

export default function Regression() {
  const ready = useLoaded('reg')
  const { colors } = useTheme()
  const [sel, setSel] = useSessionState('reg-sel', 'rf')
  const rows = useMemo<Row[]>(() => [...REGRESSORS].sort((a, b) => b.r2 - a.r2 || a.rmse - b.rmse).map((m, i) => ({ ...m, rank: i + 1 })), [])
  const model = REGRESSORS.find((m) => m.id === sel) ?? BEST_REGRESSOR
  const pts = useMemo(() => predictedVsActual(model), [model])
  if (!ready) return <><PageHeader title="Regression Analysis" /><PageSkeleton /></>

  const short = (n: string) => n.replace(' Regressor', '').replace(' Regression', '')
  const colorFor = (r: Row, tree: boolean) => (r.id === sel ? colors.cyan : tree ? colors.emerald : colors.slate)
  const cols: Column<Row>[] = [
    { key: 'rank', header: '#', numeric: true },
    { key: 'name', header: 'Model', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'family', header: 'Family', hideOnMobile: true },
    { key: 'r2', header: 'R²', numeric: true, render: (r) => r.r2.toFixed(4) },
    { key: 'rmse', header: 'RMSE', numeric: true, render: (r) => r.rmse.toFixed(4) },
    { key: 'mae', header: 'MAE', numeric: true, render: (r) => r.mae.toFixed(4) },
    { key: 'cv', header: '5-fold CV R²', numeric: true, render: (r) => `${r.cv.toFixed(4)} ±${r.cvStd.toFixed(4)}` },
    { key: 'trainSec', header: 'Train (s)', numeric: true, hideOnMobile: true, render: (r) => r.trainSec.toFixed(1) },
  ]
  const make = (key: 'r2' | 'rmse' | 'mae', sortAsc: boolean) => [...rows].sort((a, b) => (sortAsc ? a[key] - b[key] : b[key] - a[key])).map((r) => ({ name: short(r.name), value: r[key], id: r.id, tree: TREE_REGRESSORS.includes(r.id) }))
  const cv = rows.map((r) => ({ name: short(r.name), cv: r.cv, err: r.cvStd, id: r.id }))

  const barChart = (data: ReturnType<typeof make>, domain: [number | string, number | string], fmt = (v: number) => v.toFixed(4)) => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 52, top: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} /><XAxis type="number" domain={domain} allowDataOverflow tick={{ fontSize: 11 }} stroke={colors.line} />
        <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 10, fill: colors.muted }} interval={0} stroke={colors.line} />
        <RTooltip cursor={{ fill: 'rgb(var(--panel2))' }} content={<ChartTooltip format={fmt} />} />
        <Bar dataKey="value" radius={[0, 3, 3, 0]}>{data.map((d) => <Cell key={d.id} fill={d.id === sel ? colors.cyan : d.tree ? colors.emerald : colors.slate} />)}<LabelList dataKey="value" position="right" formatter={fmt} style={{ fontSize: 10, fill: colors.muted }} /></Bar>
      </BarChart>
    </ResponsiveContainer>
  )

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Regression" title="Flow-duration regression" subtitle={<>Target: <code className="rounded bg-panel2 px-1.5 py-0.5 font-mono text-xs text-ink">log1p(Flow Duration)</code> — ten regressors on a 200k-row sample with 5-fold cross-validation. Duration-derived columns are excluded to prevent target leakage.</>}
        actions={<Select label="Highlight model" value={sel} onChange={setSel} options={REGRESSORS.map((m) => ({ value: m.id, label: m.name }))} />} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricCard label="Best model" value="Random Forest" tone="emerald" sub="highest R², lowest error" />
        <MetricCard label="R²" value={BEST_REGRESSOR.r2.toFixed(4)} tone="emerald" />
        <MetricCard label="RMSE" value={BEST_REGRESSOR.rmse.toFixed(4)} />
        <MetricCard label="MAE" value={BEST_REGRESSOR.mae.toFixed(4)} />
        <MetricCard label={`${short(model.name)} CV R²`} value={model.cv.toFixed(4)} sub={`± ${model.cvStd.toFixed(4)} over 5 folds`} tone="cyan" />
      </div>

      <section className="min-w-0 rounded-md border border-line bg-panel p-3" aria-label="Regression model table">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted"><ProvenanceBadge kind="verified" /> RF, DT, GB R²/RMSE/MAE are project results. Other R²/RMSE/MAE are repo README values; CV spread and training times are <ProvenanceBadge kind="illustrative" />.</div>
        <DataTable id="reg" caption="Regression models" columns={cols} rows={rows} rowKey={(r) => r.id} searchKeys={(r) => `${r.name} ${r.family}`} searchPlaceholder="Search models…" initialSort={{ key: 'rank', dir: 'asc' }} pageSize={10} exportName="regression-metrics" onRowClick={(r) => setSel(r.id)} selectedKey={sel} />
      </section>

      <div className="grid gap-3 xl:grid-cols-3">
        <ChartPanel title="R² comparison" subtitle="Higher is better; axis from 0.5" exportName="reg-r2" provenance="reconstructed"><div className="h-72" role="img" aria-label="R squared by model">{barChart(make('r2', false), [0.5, 1])}</div></ChartPanel>
        <ChartPanel title="RMSE comparison" subtitle="Lower is better (log1p units)" exportName="reg-rmse" provenance="reconstructed"><div className="h-72" role="img" aria-label="RMSE by model">{barChart(make('rmse', true), [0, 'auto'], (v) => v.toFixed(3))}</div></ChartPanel>
        <ChartPanel title="MAE comparison" subtitle="Lower is better (log1p units)" exportName="reg-mae" provenance="reconstructed"><div className="h-72" role="img" aria-label="MAE by model">{barChart(make('mae', true), [0, 'auto'], (v) => v.toFixed(3))}</div></ChartPanel>

        <ChartPanel title={`Predicted vs actual — ${short(model.name)}`} subtitle="260-point reconstructed sample; dashed line = perfect prediction" exportName="reg-pred-actual" provenance="reconstructed">
          <div className="h-72" role="img" aria-label="Predicted versus actual scatter plot">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 6, right: 12, left: -6, bottom: 16 }}>
                <CartesianGrid /><XAxis type="number" dataKey="actual" name="Actual" domain={[0, 19]} tick={{ fontSize: 11 }} stroke={colors.line} label={{ value: 'Actual log1p(duration)', position: 'insideBottom', offset: -8, fontSize: 11, fill: colors.muted }} />
                <YAxis type="number" dataKey="predicted" name="Predicted" domain={[0, 19]} tick={{ fontSize: 11 }} stroke={colors.line} /><ZAxis range={[14, 14]} />
                <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 19, y: 19 }]} stroke={colors.amber} strokeDasharray="5 4" />
                <RTooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltip format={(v) => v.toFixed(3)} />} />
                <Scatter data={pts} fill={colors.cyan} fillOpacity={0.55} isAnimationActive={false} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
        <ChartPanel title={`Residuals — ${short(model.name)}`} subtitle="Predicted minus actual vs predicted value" exportName="reg-residuals" provenance="reconstructed">
          <div className="h-72" role="img" aria-label="Residual plot">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 6, right: 12, left: -6, bottom: 16 }}>
                <CartesianGrid /><XAxis type="number" dataKey="predicted" name="Predicted" domain={[0, 19]} tick={{ fontSize: 11 }} stroke={colors.line} label={{ value: 'Predicted', position: 'insideBottom', offset: -8, fontSize: 11, fill: colors.muted }} />
                <YAxis type="number" dataKey="residual" name="Residual" tick={{ fontSize: 11 }} stroke={colors.line} /><ZAxis range={[14, 14]} />
                <ReferenceLine y={0} stroke={colors.amber} strokeDasharray="5 4" />
                <RTooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltip format={(v) => v.toFixed(3)} />} />
                <Scatter data={pts} fill={colors.emerald} fillOpacity={0.55} isAnimationActive={false} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
        <ChartPanel title="Cross-validation R²" subtitle="Mean ± std over 5 folds" exportName="reg-cv" provenance="illustrative">
          <div className="h-72" role="img" aria-label="Cross validation R squared by model">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cv} layout="vertical" margin={{ left: 0, right: 34 }}>
                <CartesianGrid horizontal={false} /><XAxis type="number" domain={[0.5, 1]} tick={{ fontSize: 11 }} stroke={colors.line} /><YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 10, fill: colors.muted }} interval={0} stroke={colors.line} />
                <RTooltip cursor={{ fill: 'rgb(var(--panel2))' }} content={<ChartTooltip format={(v) => v.toFixed(4)} />} />
                <Bar dataKey="cv" name="CV R²" radius={[0, 3, 3, 0]}>{cv.map((d) => <Cell key={d.id} fill={d.id === sel ? colors.cyan : colors.slate} />)}<ErrorBar dataKey="err" width={4} stroke={colors.amber} direction="x" /></Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel className="xl:col-span-2" title="Feature importance — tree models" subtitle="Random Forest impurity importance (Decision Tree and Gradient Boosting rank the same timing features first)" exportName="reg-importance" provenance="illustrative">
          <FeatureImportanceChart data={REG_IMPORTANCE} height={300} tone="emerald" />
        </ChartPanel>
        <section className="rounded-md border border-line bg-panel p-4" aria-label="Why tree models performed well">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Brain className="h-4 w-4 text-cyan" aria-hidden />Why tree-based models won</h3>
          <ul className="mt-3 space-y-3">{REGRESSION_WHY.map((w) => <li key={w.title}><p className="text-sm font-medium">{w.title}</p><p className="mt-0.5 text-xs leading-relaxed text-muted">{w.body}</p></li>)}</ul>
          <div className="mt-3 flex flex-wrap gap-1.5"><Badge tone="green">Random Forest</Badge><Badge tone="green">Decision Tree</Badge><Badge tone="green">Gradient Boosting</Badge></div>
        </section>
      </div>
    </div>
  )
}
