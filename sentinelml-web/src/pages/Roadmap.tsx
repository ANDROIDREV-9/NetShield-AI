import { useState } from 'react'
import { CheckCircle2, ChevronDown, CircleDashed, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { MetricCard } from '@/components/MetricCard'
import { Badge, StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Segmented, Select } from '@/components/ui/Controls'
import { EmptyState } from '@/components/ui/States'
import { useSessionState } from '@/hooks/useSessionState'
import { ROADMAP } from '@/data/roadmap'
import type { Status } from '@/data/types'
import { cn } from '@/lib/format'

const icon = { complete: CheckCircle2, 'in-progress': Loader2, planned: CircleDashed }
const tone = { complete: 'text-emerald border-emerald/50', 'in-progress': 'text-amber border-amber/50', planned: 'text-faint border-line' }

export default function Roadmap() {
  const [status, setStatus] = useSessionState<'all' | Status>('rm-status', 'all')
  const [group, setGroup] = useSessionState('rm-group', 'all')
  const [open, setOpen] = useState<string[]>([])
  const items = ROADMAP.filter((r) => (status === 'all' || r.status === status) && (group === 'all' || r.group === group))
  const count = (s: Status) => ROADMAP.filter((r) => r.status === s).length
  const done = (count('complete') / ROADMAP.length) * 100
  const toggle = (id: string) => setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]))

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Future roadmap" title="From binary detection to a deployed IDS" subtitle="Multiclass detection, imbalance handling, boosted models, unsupervised discovery and production deployment."
        actions={<><Button size="sm" onClick={() => setOpen(items.map((i) => i.id))}>Expand all</Button><Button size="sm" variant="ghost" onClick={() => setOpen([])}>Collapse all</Button></>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Completed" value={count('complete')} tone="emerald" />
        <MetricCard label="In progress" value={count('in-progress')} tone="amber" />
        <MetricCard label="Planned" value={count('planned')} />
        <MetricCard label="Overall progress" value={`${done.toFixed(0)}%`} tone="cyan" progress={done} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Filter by status" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All' }, { value: 'complete', label: 'Completed' }, { value: 'in-progress', label: 'In progress' }, { value: 'planned', label: 'Planned' }]} />
        <Select label="Filter by track" value={group} onChange={setGroup} options={[{ value: 'all', label: 'All tracks' }, { value: 'Modelling', label: 'Modelling' }, { value: 'Unsupervised', label: 'Unsupervised' }, { value: 'Platform', label: 'Platform' }]} />
      </div>
      {items.length === 0 ? <EmptyState title="Nothing matches" body="Change the status or track filter." /> : (
        <ol className="relative space-y-2 border-l border-line pl-6" aria-label="Roadmap timeline">
          {items.map((r) => {
            const I = icon[r.status]; const isOpen = open.includes(r.id)
            return (
              <li key={r.id} className="relative">
                <span className={cn('absolute -left-[37px] top-3 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-bg', tone[r.status])}><I className="h-3.5 w-3.5" aria-hidden /></span>
                <div className="rounded-md border border-line bg-panel">
                  <button onClick={() => toggle(r.id)} aria-expanded={isOpen} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
                    <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{r.title}</span><span className="block text-xs text-muted">{r.quarter} · {r.group}</span></span>
                    <StatusBadge status={r.status} /><ChevronDown className={cn('h-4 w-4 text-muted transition', isOpen && 'rotate-180')} aria-hidden />
                  </button>
                  {isOpen && <div className="border-t border-line px-3 py-2.5 text-sm text-muted">{r.detail} {r.status === 'planned' && <Badge tone="neutral" className="ml-1">not yet implemented</Badge>}</div>}
                </div>
              </li>)
          })}
        </ol>
      )}
    </div>
  )
}
