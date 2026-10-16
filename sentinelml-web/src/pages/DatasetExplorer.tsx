import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis, LabelList } from 'recharts'
import { PageHeader } from '@/components/PageHeader'
import { MetricCard } from '@/components/MetricCard'
import { ChartPanel } from '@/components/ChartPanel'
import { DataTable, type Column } from '@/components/DataTable'
import { Badge, ProvenanceBadge } from '@/components/StatusBadge'
import { Segmented, Select, Tabs } from '@/components/ui/Controls'
import { PageSkeleton } from '@/components/ui/States'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { useSessionState } from '@/hooks/useSessionState'
import { useLoaded } from '@/hooks/useAsync'
import { useTheme } from '@/hooks/useTheme'
import { CLASSES, COLUMN_TYPES, DATASET, FILES, INFINITE_COLS, MISSING_COLS, type CaptureFile } from '@/data/dataset'
import { FEATURES, FEATURE_GROUPS } from '@/data/features'
import type { ClassRow, FeatureStat } from '@/data/types'
import { fmtCompact, fmtInt, fmtSci } from '@/lib/format'

const sevTone = { none: 'green', low: 'cyan', medium: 'amber', high: 'red', critical: 'red' } as const
type ChartMode = 'count' | 'percent' | 'log'

export default function DatasetExplorer() {
  const ready = useLoaded('dataset')
  const { colors } = useTheme()
  const [tab, setTab] = useSessionState('ds-tab', 'classes')
  const [mode, setMode] = useSessionState<ChartMode>('ds-mode', 'log')
  const [cat, setCat] = useSessionState('ds-cat', 'all')
  const [file, setFile] = useSessionState('ds-file', FILES[2].file)
  const [group, setGroup] = useSessionState('ds-group', 'all')
  const [ftype, setFtype] = useSessionState('ds-ftype', 'all')
  const [only, setOnly] = useSessionState('ds-only', 'all')

  const classRows = useMemo(() => CLASSES.filter((c) => cat === 'all' || c.category === cat).map((c) => ({ ...c, pct: (c.count / DATASET.records) * 100 })), [cat])
  const categories = ['all', ...Array.from(new Set(CLASSES.map((c) => c.category)))]
  const chartData = classRows.map((c) => ({ name: c.name, value: mode === 'percent' ? c.pct : c.count, fill: c.name === 'BENIGN' ? colors.emerald : colors.red }))
  const selectedFile = FILES.find((f) => f.file === file) ?? FILES[0]

  const classCols: Column<ClassRow & { pct: number }>[] = [
    { key: 'name', header: 'Class', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'category', header: 'Category', hideOnMobile: true },
    { key: 'count', header: 'Records', numeric: true, render: (r) => fmtInt(r.count) },
    { key: 'pct', header: 'Share', numeric: true, render: (r) => (r.pct >= 0.01 ? r.pct.toFixed(2) : '<0.01') + '%' },
    { key: 'severity', header: 'Severity', render: (r) => <Badge tone={sevTone[r.severity]}>{r.severity === 'none' ? 'benign' : r.severity}</Badge> },
  ]
  const fileCols: Column<CaptureFile>[] = [
    { key: 'day', header: 'Day', render: (r) => <span className="font-medium">{r.day}</span> },
    { key: 'file', header: 'CSV file', hideOnMobile: true, render: (r) => <span className="font-mono text-xs text-muted">{r.file}</span> },
    { key: 'records', header: 'Records', numeric: true, render: (r) => fmtInt(r.records) },
    { key: 'attacks', header: 'Attack categories', sortable: false, value: (r) => Object.keys(r.classes).filter((k) => k !== 'BENIGN').join(' '), render: (r) => {
      const a = Object.keys(r.classes).filter((k) => k !== 'BENIGN')
      return a.length ? <div className="flex flex-wrap gap-1">{a.map((k) => <Badge key={k} tone="red">{k}</Badge>)}</div> : <Badge tone="green">benign only</Badge>
    } },
  ]
  const featureRows = useMemo(() => FEATURES.filter((f) => (group === 'all' || f.group === group) && (ftype === 'all' || f.type === ftype) && (only === 'all' || (only === 'profiled' ? f.profiled : only === 'selected' ? f.selected : f.missing > 0 || f.infinite > 0))), [group, ftype, only])
  const dash = <span className="text-faint">—</span>
  const stat = (k: keyof FeatureStat) => (r: FeatureStat) => (r[k] === undefined ? dash : fmtSci(r[k] as number))
  const featCols: Column<FeatureStat>[] = [
    { key: 'name', header: 'Feature', render: (r) => <span className="font-mono text-[13px]">{r.name}</span> },
    { key: 'type', header: 'Type', hideOnMobile: true },
    { key: 'group', header: 'Group', hideOnMobile: true },
    { key: 'min', header: 'Min', numeric: true, value: (r) => r.min ?? -Infinity, render: stat('min') },
    { key: 'max', header: 'Max', numeric: true, value: (r) => r.max ?? -Infinity, render: stat('max') },
    { key: 'mean', header: 'Mean', numeric: true, value: (r) => r.mean ?? -Infinity, render: stat('mean') },
    { key: 'median', header: 'Median', numeric: true, value: (r) => r.median ?? -Infinity, render: stat('median') },
    { key: 'std', header: 'Std dev', numeric: true, value: (r) => r.std ?? -Infinity, render: stat('std') },
    { key: 'missing', header: 'Missing', numeric: true, render: (r) => (r.missing ? <span className="text-amber">{fmtInt(r.missing)}</span> : '0') },
    { key: 'infinite', header: 'Inf', numeric: true, render: (r) => (r.infinite ? <span className="text-red">{fmtInt(r.infinite)}</span> : '0') },
    { key: 'selected', header: 'Selected', value: (r) => (r.selected ? 1 : 0), render: (r) => (r.selected ? <Badge tone="cyan">top-30</Badge> : <span className="text-faint">—</span>) },
  ]

  if (!ready) return <><PageHeader title="Dataset Explorer" /><PageSkeleton /></>
  const tabs = [{ id: 'classes', label: 'Classes' }, { id: 'quality', label: 'Data quality' }, { id: 'files', label: 'Files' }, { id: 'features', label: 'Feature explorer' }]

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Dataset Explorer" title="CICIDS 2017 — flows, classes and features"
        subtitle="Canadian Institute for Cybersecurity benchmark: eight daily CSV captures generated with CICFlowMeter." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Records" value={fmtInt(DATASET.records)} tone="cyan" />
        <MetricCard label="Columns" value={DATASET.columns} sub="78 numeric + 1 label" />
        <MetricCard label="Classes" value={DATASET.classes} />
        <MetricCard label="CSV files" value={DATASET.files} sub="Mon → Fri" />
        <MetricCard label="float64 / int64" value={`${COLUMN_TYPES[0].count} / ${COLUMN_TYPES[1].count}`} sub="numeric columns" />
        <MetricCard label="After cleaning" value={fmtInt(DATASET.recordsAfterClean)} sub={`−${fmtInt(DATASET.duplicatesRemoved)} duplicates`} tone="emerald" />
      </div>

      <Tabs label="Dataset sections" tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'classes' && (
        <div className="grid gap-3 xl:grid-cols-2" role="tabpanel" aria-labelledby="tab-classes">
          <section className="min-w-0 rounded-md border border-line bg-panel p-3" aria-label="Class table">
            <DataTable id="classes" caption="Class distribution" columns={classCols} rows={classRows} rowKey={(r) => r.name}
              searchKeys={(r) => `${r.name} ${r.category}`} searchPlaceholder="Search classes…" initialSort={{ key: 'count', dir: 'desc' }} pageSize={15} exportName="cicids2017-classes"
              filters={<Select label="Filter by category" value={cat} onChange={setCat} options={categories.map((c) => ({ value: c, label: c === 'all' ? 'All categories' : c }))} />} />
          </section>
          <ChartPanel title="Class distribution" subtitle={mode === 'percent' ? 'Percentage of all records' : mode === 'log' ? 'Record count — logarithmic scale' : 'Absolute record count'} exportName="class-distribution" provenance="verified"
            actions={<Segmented label="Chart scale" size="sm" value={mode} onChange={setMode} options={[{ value: 'count', label: 'Count' }, { value: 'percent', label: '%' }, { value: 'log', label: 'Log' }]} />}>
            <div className="h-[440px]" role="img" aria-label="Class distribution bar chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 56, top: 0, bottom: 0 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" scale={mode === 'log' ? 'log' : 'linear'} domain={mode === 'log' ? [1, 'auto'] : [0, 'auto']} allowDataOverflow tickFormatter={(v) => (mode === 'percent' ? `${v}%` : fmtCompact(v))} tick={{ fontSize: 11 }} stroke={colors.line} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: colors.muted }} interval={0} stroke={colors.line} />
                  <RTooltip cursor={{ fill: 'rgb(var(--panel2))' }} content={<ChartTooltip format={(v) => (mode === 'percent' ? `${v.toFixed(3)}%` : fmtInt(v))} />} />
                  <Bar dataKey="value" name={mode === 'percent' ? 'Share' : 'Records'} radius={[0, 3, 3, 0]}>
                    {chartData.map((d) => <Cell key={d.name} fill={d.fill} />)}
                    <LabelList dataKey="value" position="right" formatter={(v: number) => (mode === 'percent' ? `${v.toFixed(2)}%` : fmtCompact(v))} style={{ fontSize: 10, fill: colors.muted }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartPanel>
        </div>
      )}

      {tab === 'quality' && (
        <div className="grid gap-3 lg:grid-cols-2" role="tabpanel" aria-labelledby="tab-quality">
          <ChartPanel title="Missing values" subtitle={`${fmtInt(DATASET.missing)} NaN cells in total`} exportName="" provenance="verified">
            <DataTable id="missing" caption="Missing values by column" columns={[{ key: 'column', header: 'Column', render: (r) => <span className="font-mono text-[13px]">{r.column}</span> }, { key: 'count', header: 'Missing', numeric: true, render: (r) => fmtInt(r.count) }, { key: 'pct', header: '% of rows', numeric: true, render: (r) => r.pct.toFixed(4) + '%' }]} rows={MISSING_COLS} rowKey={(r) => r.column} />
            <p className="mt-2 text-xs text-muted">Treatment: median imputation (step 5). No column exceeds the 50% drop threshold.</p>
          </ChartPanel>
          <ChartPanel title="Infinite values" subtitle={`${fmtInt(DATASET.infinite)} ±inf cells in total`} exportName="" provenance="verified"
            footer="Per-column split is illustrative; the 4,376 total is exact. Confirm with the notebook output.">
            <DataTable id="inf" caption="Infinite values by column" columns={[{ key: 'column', header: 'Column', render: (r) => <span className="font-mono text-[13px]">{r.column}</span> }, { key: 'count', header: 'Infinite', numeric: true, render: (r) => fmtInt(r.count) }, { key: 'pct', header: '% of rows', numeric: true, render: (r) => r.pct.toFixed(4) + '%' }]} rows={INFINITE_COLS} rowKey={(r) => r.column} />
            <p className="mt-2 text-xs text-muted">Cause: rate columns divide by Flow Duration, which is 0 for some flows.</p>
          </ChartPanel>
          <ChartPanel title="Duplicate summary" subtitle="Exact duplicate rows" exportName="" provenance="reconstructed">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-muted">Rows before</dt><dd className="num font-mono text-lg">{fmtInt(DATASET.records)}</dd></div>
              <div><dt className="text-xs text-muted">Rows after</dt><dd className="num font-mono text-lg text-emerald">{fmtInt(DATASET.recordsAfterClean)}</dd></div>
              <div><dt className="text-xs text-muted">Duplicates removed</dt><dd className="num font-mono text-lg text-amber">{fmtInt(DATASET.duplicatesRemoved)}</dd></div>
              <div><dt className="text-xs text-muted">Share of data</dt><dd className="num font-mono text-lg">{((DATASET.duplicatesRemoved / DATASET.records) * 100).toFixed(2)}%</dd></div>
            </dl>
            <p className="mt-3 text-xs text-muted">Duplicates were identified and removed before the train/test split so identical flows cannot appear on both sides. The exact count is printed by <code className="font-mono">src/preprocessing.py</code>; 308,381 is the commonly reported figure.</p>
          </ChartPanel>
          <ChartPanel title="Column type breakdown" subtitle="79 columns" exportName="column-types" provenance="reconstructed">
            <div className="h-44" role="img" aria-label="Column types bar chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={COLUMN_TYPES} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <CartesianGrid horizontal={false} /><XAxis type="number" tick={{ fontSize: 11 }} stroke={colors.line} /><YAxis type="category" dataKey="type" width={100} tick={{ fontSize: 11, fill: colors.muted }} stroke={colors.line} />
                  <RTooltip cursor={{ fill: 'rgb(var(--panel2))' }} content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Columns" fill={colors.cyan} radius={[0, 3, 3, 0]}><LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: colors.muted }} /></Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartPanel>
        </div>
      )}

      {tab === 'files' && (
        <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr]" role="tabpanel" aria-labelledby="tab-files">
          <section className="min-w-0 rounded-md border border-line bg-panel p-3" aria-label="Dataset files">
            <DataTable id="files" caption="Dataset CSV files" columns={fileCols} rows={FILES} rowKey={(r) => r.file} searchKeys={(r) => `${r.file} ${Object.keys(r.classes).join(' ')}`} searchPlaceholder="Search files or attack types…"
              onRowClick={(r) => setFile(r.file)} selectedKey={file} initialSort={{ key: 'records', dir: 'desc' }} exportName="cicids2017-files" />
            <p className="mt-2 text-xs text-muted">Select a row to inspect its class mix.</p>
          </section>
          <ChartPanel title={selectedFile.day} subtitle={`${fmtInt(selectedFile.records)} records`} exportName="file-classes" provenance="verified">
            <p className="mb-2 break-all font-mono text-[11px] text-muted">{selectedFile.file}</p>
            <div className="h-56" role="img" aria-label={`Class mix of ${selectedFile.file}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(selectedFile.classes).map(([name, value]) => ({ name, value }))} layout="vertical" margin={{ right: 50 }}>
                  <CartesianGrid horizontal={false} /><XAxis type="number" scale="log" domain={[1, 'auto']} allowDataOverflow tickFormatter={fmtCompact} tick={{ fontSize: 11 }} stroke={colors.line} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: colors.muted }} interval={0} stroke={colors.line} />
                  <RTooltip cursor={{ fill: 'rgb(var(--panel2))' }} content={<ChartTooltip format={fmtInt} />} />
                  <Bar dataKey="value" name="Records" radius={[0, 3, 3, 0]}>
                    {Object.keys(selectedFile.classes).map((k) => <Cell key={k} fill={k === 'BENIGN' ? colors.emerald : colors.red} />)}
                    <LabelList dataKey="value" position="right" formatter={(v: number) => fmtInt(v)} style={{ fontSize: 10, fill: colors.muted }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartPanel>
        </div>
      )}

      {tab === 'features' && (
        <section className="min-w-0 rounded-md border border-line bg-panel p-3" role="tabpanel" aria-labelledby="tab-features" aria-label="Feature explorer">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted"><ProvenanceBadge kind="repo" /><span>Statistics for the 30 selected features come from <code className="font-mono">models/feature_metadata.json</code>. The other 48 are listed by name and type only.</span></div>
          <DataTable id="features" caption="Feature statistics" columns={featCols} rows={featureRows} rowKey={(r) => r.name} searchKeys={(r) => `${r.name} ${r.group}`} searchPlaceholder="Search features…" pageSize={12} dense exportName="cicids2017-features"
            filters={<>
              <Select label="Filter by feature group" value={group} onChange={setGroup} options={[{ value: 'all', label: 'All groups' }, ...FEATURE_GROUPS.map((g) => ({ value: g, label: g }))]} />
              <Select label="Filter by data type" value={ftype} onChange={setFtype} options={[{ value: 'all', label: 'All types' }, { value: 'float64', label: 'float64' }, { value: 'int64', label: 'int64' }]} />
              <Select label="Filter by profile status" value={only} onChange={setOnly} options={[{ value: 'all', label: 'All 78 features' }, { value: 'selected', label: 'Selected (top-30)' }, { value: 'profiled', label: 'Profiled' }, { value: 'issues', label: 'Has NaN / Inf' }]} />
            </>} />
        </section>
      )}
    </div>
  )
}
