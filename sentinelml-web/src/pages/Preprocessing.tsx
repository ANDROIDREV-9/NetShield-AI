import { ArrowRight, Check, ShieldCheck, TriangleAlert, Copy } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { PipelineStep } from '@/components/PipelineStep'
import { Badge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/Button'
import { PageSkeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import { useSessionState } from '@/hooks/useSessionState'
import { useLoaded } from '@/hooks/useAsync'
import { PIPELINE, type Snapshot } from '@/data/pipeline'
import { cn, fmtInt } from '@/lib/format'

const ROWS: { key: keyof Snapshot; label: string }[] = [
  { key: 'rows', label: 'Rows' }, { key: 'cols', label: 'Columns' }, { key: 'missing', label: 'Missing values' },
  { key: 'inf', label: 'Infinite values' }, { key: 'dups', label: 'Duplicate rows' }, { key: 'features', label: 'Feature count' },
]
const show = (v: number | string) => (typeof v === 'number' ? fmtInt(v) : v)

function Section({ title, children, tone }: { title: string; children: React.ReactNode; tone?: 'amber' | 'emerald' }) {
  return (
    <div className={cn('rounded-md border p-3', tone === 'amber' ? 'border-amber/30 bg-amber/5' : tone === 'emerald' ? 'border-emerald/30 bg-emerald/5' : 'border-line bg-panel2')}>
      <h4 className={cn('mb-1 text-[11px] font-semibold uppercase tracking-wider', tone === 'amber' ? 'text-amber' : tone === 'emerald' ? 'text-emerald' : 'text-muted')}>{title}</h4>
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  )
}

export default function Preprocessing() {
  const ready = useLoaded('pre')
  const toast = useToast()
  const [sel, setSel] = useSessionState('pre-step', 11)
  const step = PIPELINE.find((s) => s.id === sel) ?? PIPELINE[0]
  if (!ready) return <><PageHeader title="Preprocessing Pipeline" /><PageSkeleton /></>

  const copy = async () => {
    try { await navigator.clipboard.writeText(step.code); toast('success', 'Snippet copied') } catch { toast('warning', 'Copy unavailable', 'Clipboard access is blocked in this context.') }
  }
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Preprocessing" title="12-step, leakage-aware pipeline" subtitle="Select any step to see its purpose, inputs, outputs, risks and data-leakage considerations."
        actions={<><Button size="sm" disabled={sel === 1} onClick={() => setSel(sel - 1)}>Previous</Button><Button size="sm" variant="primary" disabled={sel === 12} onClick={() => setSel(sel + 1)} icon={<ArrowRight className="h-3.5 w-3.5" />}>Next step</Button></>} />

      <div className="rounded-md border border-emerald/40 bg-emerald/5 p-3.5" role="note" aria-label="Leakage prevention">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald" aria-hidden />
          <div>
            <h3 className="text-sm font-semibold text-emerald">Leakage prevention</h3>
            <p className="mt-1 text-sm text-muted">The <code className="rounded bg-panel2 px-1 font-mono text-xs text-ink">StandardScaler</code> is fitted <strong className="text-ink">only on the training split</strong>. Test rows are merely transformed with the training mean and variance, and SMOTE is applied to training data only. Duplicates are removed before the split, and duration-derived columns (<span className="font-mono text-xs">Flow Duration, Flow Bytes/s, Flow Packets/s</span>) are excluded from regression inputs.</p>
            <button onClick={() => setSel(11)} className="mt-1.5 text-xs font-medium text-emerald hover:underline">View scaling step →</button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <ol className="space-y-1.5" aria-label="Pipeline steps">
          {PIPELINE.map((s) => <li key={s.id}><PipelineStep step={s} active={s.id === sel} onSelect={() => setSel(s.id)} leakageKey={s.id === 11} /></li>)}
        </ol>

        <section className="min-w-0 space-y-3" aria-live="polite" aria-label={`Details for step ${step.id}`}>
          <div className="rounded-md border border-line bg-panel p-4">
            <div className="flex flex-wrap items-center gap-2"><Badge tone="cyan">Step {step.id} of 12</Badge>{step.id === 11 && <Badge tone="green" icon={<Check className="h-3 w-3" />}>Core leakage guard</Badge>}</div>
            <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
            <p className="mt-1 text-sm text-muted">{step.purpose}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Section title="Input">{step.input}</Section>
              <Section title="Output">{step.output}</Section>
              <Section title="Why it matters">{step.why}</Section>
              <Section title="Possible risks" tone="amber">{step.risks}</Section>
            </div>
            <div className="mt-2"><Section title="Data-leakage considerations" tone="emerald">{step.leakage}</Section></div>
            <div className="relative mt-3 rounded-md border border-line bg-bg">
              <div className="flex items-center justify-between border-b border-line px-3 py-1.5 text-[11px] text-muted"><span>Reference implementation</span><Button size="sm" variant="ghost" icon={<Copy className="h-3 w-3" />} onClick={copy}>Copy</Button></div>
              <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed text-ink"><code>{step.code}</code></pre>
            </div>
          </div>

          <div className="rounded-md border border-line bg-panel p-4">
            <h3 className="text-sm font-semibold">Before / after statistics</h3>
            <div className="mt-2 overflow-x-auto"><table className="w-full text-sm">
              <caption className="sr-only">Dataset statistics before and after step {step.id}</caption>
              <thead className="text-xs text-muted"><tr><th scope="col" className="py-1.5 text-left font-medium">Metric</th><th scope="col" className="py-1.5 text-right font-medium">Before</th><th scope="col" className="py-1.5 text-right font-medium">After</th><th scope="col" className="w-24 py-1.5 text-right font-medium">Change</th></tr></thead>
              <tbody>
                {ROWS.map((r) => {
                  const b = step.before[r.key], a = step.after[r.key], changed = b !== a
                  return (
                    <tr key={r.key} className="border-t border-line/60">
                      <th scope="row" className="py-2 text-left font-normal text-muted">{r.label}</th>
                      <td className="num py-2 text-right font-mono">{show(b)}</td>
                      <td className={cn('num py-2 text-right font-mono', changed && 'text-cyan')}>{show(a)}</td>
                      <td className="py-2 text-right">{changed ? <Badge tone="cyan">changed</Badge> : <span className="text-xs text-faint">—</span>}</td>
                    </tr>)
                })}
              </tbody>
            </table></div>
            <p className="mt-2 flex items-start gap-1.5 text-xs text-muted"><TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber" aria-hidden />Raw totals (2,830,743 rows, 79 columns, 1,358 missing, 4,376 infinite) are verified. Duplicate and constant-column counts are reference figures — re-run <code className="font-mono">src/preprocessing.py</code> to confirm exact values.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
