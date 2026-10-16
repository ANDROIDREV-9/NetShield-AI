import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, Scatter, ScatterChart, Tooltip as RTooltip, XAxis, YAxis, ZAxis, Bar, BarChart, Cell } from 'recharts'
import { Network } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { ChartPanel } from '@/components/ChartPanel'
import { MetricCard } from '@/components/MetricCard'
import { DataTable, type Column } from '@/components/DataTable'
import { ProvenanceBadge, SimulatedBadge, Badge } from '@/components/StatusBadge'
import { Segmented } from '@/components/ui/Controls'
import { PageSkeleton } from '@/components/ui/States'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { useLoaded } from '@/hooks/useAsync'
import { useTheme } from '@/hooks/useTheme'
import { PRESETS } from '@/data/samples'
import { scoreFlow } from '@/api/mockEngine'
import { CLUSTER_ALGOS, CLUSTER_PROFILES, CROSSTAB, ELBOW, LINKAGES, assignCluster, projection, type ClusterAlgo } from '@/data/clustering'

type LinkRow = (typeof LINKAGES)[number]

export default function Clustering() {
  const ready = useLoaded('clu')
  const { colors } = useTheme()
  const [view, setView] = useState<'pca' | 'tsne'>('pca')
  const [presetId, setPresetId] = useState(PRESETS[0].id)
  const pts = useMemo(() => projection(view), [view])
  if (!ready) return <><PageHeader title="Clustering" /><PageSkeleton /></>

  const tones = [colors.emerald, colors.red, colors.amber]
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0]
  const score = 1 / (1 + Math.exp(-scoreFlow(preset.values).z))
  const { cluster, distances } = assignCluster(score)

  const algoCols: Column<ClusterAlgo>[] = [
    { key: 'name', header: 'Algorithm', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'k', header: 'k', numeric: true },
    { key: 'silhouette', header: 'Silhouette ↑', numeric: true, render: (r) => r.silhouette.toFixed(4) },
    { key: 'davies', header: 'Davies-Bouldin ↓', numeric: true, render: (r) => r.davies.toFixed(4) },
    { key: 'calinski', header: 'Calinski-Harabasz ↑', numeric: true, render: (r) => r.calinski.toLocaleString('en-US', { minimumFractionDigits: 2 }) },
    { key: 'note', header: 'Diagnostic', hideOnMobile: true },
  ]
  const linkCols: Column<LinkRow>[] = [
    { key: 'method', header: 'Linkage', render: (r) => <span className="font-medium">{r.method}</span> },
    { key: 'silhouette', header: 'Silhouette', numeric: true, render: (r) => r.silhouette.toFixed(4) },
    { key: 'davies', header: 'DB', numeric: true, render: (r) => r.davies.toFixed(4) },
    { key: 'calinski', header: 'CH', numeric: true, render: (r) => r.calinski.toLocaleString('en-US', { minimumFractionDigits: 2 }) },
    { key: 'balance', header: 'Balance', hideOnMobile: true },
  ]

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Clustering · Track 3" title="Unsupervised traffic clustering" subtitle="K-Means and Agglomerative (Ward) clustering on the standardised feature space, trained with no labels. Ground-truth classes are only cross-tabulated afterwards." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricCard label="Chosen k" value="3" tone="cyan" sub="elbow inflection" />
        <MetricCard label="Silhouette" value="0.9946" tone="emerald" sub="K-Means = Ward" />
        <MetricCard label="Davies-Bouldin" value="0.1305" tone="emerald" sub="lower is better" />
        <MetricCard label="Calinski-Harabasz" value="205,079.63" tone="emerald" />
        <MetricCard label="Cluster 0 benign share" value="99.8%" tone="cyan" sub="post-hoc cross-tab" />
      </div>

      <section className="min-w-0 rounded-md border border-line bg-panel p-3" aria-label="Clustering algorithm metrics">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted"><ProvenanceBadge kind="repo" /> Metrics are repo README / Review-2 deck values.</div>
        <DataTable id="clu" caption="Clustering algorithms" columns={algoCols} rows={CLUSTER_ALGOS} rowKey={(r) => r.id} pageSize={5} exportName="clustering-metrics" />
      </section>

      <div className="grid gap-3 xl:grid-cols-2">
        <ChartPanel title="K-Means elbow curve" subtitle="Inertia for k = 2…8; elbow at k = 3" exportName="clu-elbow" provenance="illustrative">
          <div className="h-72" role="img" aria-label="Elbow curve of inertia versus k">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ELBOW} margin={{ top: 8, right: 16, left: 4, bottom: 16 }}>
                <CartesianGrid /><XAxis dataKey="k" tick={{ fontSize: 11 }} stroke={colors.line} label={{ value: 'k', position: 'insideBottom', offset: -8, fontSize: 11, fill: colors.muted }} />
                <YAxis tick={{ fontSize: 11 }} stroke={colors.line} tickFormatter={(v: number) => `${(v / 1e6).toFixed(1)}M`} />
                <RTooltip content={<ChartTooltip format={(v) => v.toExponential(2)} />} />
                <Line type="monotone" dataKey="inertia" stroke={colors.cyan} strokeWidth={2} dot isAnimationActive={false} />
                <ReferenceDot x={3} y={ELBOW[1].inertia} r={7} fill={colors.amber} stroke="none" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel title="2-D projection" subtitle="Reconstructed sample coloured by cluster" exportName={`clu-${view}`} provenance="reconstructed"
          actions={<Segmented label="Projection" size="sm" value={view} onChange={setView} options={[{ value: 'pca', label: 'PCA' }, { value: 'tsne', label: 't-SNE' }]} />}>
          <div className="h-72" role="img" aria-label={`${view} scatter plot coloured by cluster`}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 6, right: 12, left: -6, bottom: 16 }}>
                <CartesianGrid /><XAxis type="number" dataKey="x" name={view === 'pca' ? 'PC1' : 'dim 1'} tick={{ fontSize: 11 }} stroke={colors.line} /><YAxis type="number" dataKey="y" name={view === 'pca' ? 'PC2' : 'dim 2'} tick={{ fontSize: 11 }} stroke={colors.line} /><ZAxis range={[16, 16]} />
                <RTooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltip format={(v) => v.toFixed(2)} />} />
                {CLUSTER_PROFILES.map((c) => <Scatter key={c.id} name={c.name} data={pts.filter((p) => p.cluster === c.id)} fill={tones[c.id]} fillOpacity={0.6} isAnimationActive={false} />)}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">{CLUSTER_PROFILES.map((c) => <span key={c.id} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: tones[c.id] }} />{c.name}</span>)}</div>
        </ChartPanel>

        <section className="min-w-0 rounded-md border border-line bg-panel p-3" aria-label="Linkage comparison">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted"><ProvenanceBadge kind="repo" /> Agglomerative linkage comparison (Review-2 deck, slide 8).</div>
          <DataTable id="link" caption="Linkage strategies" columns={linkCols} rows={LINKAGES} rowKey={(r) => r.method} pageSize={5} exportName="linkage-comparison" />
        </section>

        <ChartPanel title="Post-hoc cross-tabulation" subtitle="% of each true class falling in each cluster (columns sum to ~100)" exportName="clu-crosstab" provenance="illustrative">
          <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-xs"><caption className="sr-only">Cluster versus true class</caption>
            <thead><tr><th className="p-1.5 text-left text-muted">Cluster</th>{CROSSTAB.classes.map((c) => <th key={c} className="p-1.5 text-right font-medium text-muted">{c}</th>)}</tr></thead>
            <tbody>{CROSSTAB.rows.map((r, i) => <tr key={i} className="border-t border-line"><td className="p-1.5 font-medium">Cluster {i}</td>{r.map((v, j) => <td key={j} className="p-1.5 text-right font-mono" style={{ background: `color-mix(in srgb, ${tones[i]} ${Math.round(v * 0.5)}%, transparent)` }}>{v.toFixed(1)}</td>)}</tr>)}</tbody></table></div>
          <p className="mt-2 text-xs text-muted">Only the 99.8% (Cluster 0 × BENIGN) is a project result.</p>
        </ChartPanel>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {CLUSTER_PROFILES.map((c) => (
          <section key={c.id} className="rounded-md border border-line bg-panel p-4" aria-label={c.name}>
            <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-semibold"><Network className="h-4 w-4" style={{ color: tones[c.id] }} aria-hidden />{c.name}</h3><Badge tone={c.tone === 'emerald' ? 'green' : c.tone === 'red' ? 'red' : 'amber'}>{c.role}</Badge></div>
            <p className="mt-2 text-xs leading-relaxed text-muted">{c.detail}</p>
          </section>
        ))}
      </div>

      <section className="rounded-md border border-line bg-panel p-4" aria-label="Cluster assignment demo">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Cluster assignment demo</h3><SimulatedBadge /></div>
        <p className="mt-1 text-xs text-muted">Pick a sample flow. A rule-based score is mapped to the nearest illustrative centroid — this is not the fitted K-Means model.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Segmented label="Sample flow" size="sm" value={presetId} onChange={setPresetId} options={PRESETS.map((p) => ({ value: p.id, label: p.label }))} />
          <span className="text-sm">→ <strong style={{ color: tones[cluster] }}>{CLUSTER_PROFILES[cluster].name}</strong> <span className="text-muted">({CLUSTER_PROFILES[cluster].role})</span></span>
        </div>
        <div className="mt-3 h-24" role="img" aria-label="Distance to each centroid">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={distances.map((d, i) => ({ name: `C${i}`, d }))} layout="vertical" margin={{ left: 0, right: 24 }}><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={28} tick={{ fontSize: 11, fill: colors.muted }} stroke={colors.line} /><RTooltip content={<ChartTooltip format={(v) => v.toFixed(3)} />} /><Bar dataKey="d" name="Distance" radius={[0, 3, 3, 0]} isAnimationActive={false}>{distances.map((_, i) => <Cell key={i} fill={i === cluster ? tones[i] : colors.slate} />)}</Bar></BarChart></ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
