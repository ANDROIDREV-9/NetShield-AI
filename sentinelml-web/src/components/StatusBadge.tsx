import { CheckCircle2, CircleDashed, Loader2, AlertTriangle, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/format'
import type { Provenance, Status } from '@/data/types'
import { Tooltip } from './ui/Tooltip'

type Tone = 'green' | 'cyan' | 'amber' | 'red' | 'neutral'
const tones: Record<Tone, string> = {
  green: 'border-emerald/40 bg-emerald/10 text-emerald', cyan: 'border-cyan/40 bg-cyan/10 text-cyan',
  amber: 'border-amber/40 bg-amber/10 text-amber', red: 'border-red/40 bg-red/10 text-red', neutral: 'border-line bg-panel2 text-muted',
}
export function Badge({ tone = 'neutral', children, icon, className }: { tone?: Tone; children: ReactNode; icon?: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 text-[11px] font-medium leading-4', tones[tone], className)}>{icon}{children}</span>
}

const statusMap: Record<Status, { tone: Tone; label: string; icon: ReactNode }> = {
  complete: { tone: 'green', label: 'Complete', icon: <CheckCircle2 className="h-3 w-3" aria-hidden /> },
  'in-progress': { tone: 'amber', label: 'In progress', icon: <Loader2 className="h-3 w-3" aria-hidden /> },
  planned: { tone: 'neutral', label: 'Planned', icon: <CircleDashed className="h-3 w-3" aria-hidden /> },
}
export function StatusBadge({ status, label }: { status: Status; label?: string }) {
  const s = statusMap[status]
  return <Badge tone={s.tone} icon={s.icon}>{label ?? s.label}</Badge>
}
export function ModelStatusBadge({ status }: { status: string }) {
  const m: Record<string, [Tone, ReactNode]> = {
    'Production candidate': ['green', <CheckCircle2 key="i" className="h-3 w-3" aria-hidden />], Baseline: ['cyan', <CircleDashed key="i" className="h-3 w-3" aria-hidden />],
    'Needs tuning': ['amber', <AlertTriangle key="i" className="h-3 w-3" aria-hidden />], 'Not recommended': ['red', <XCircle key="i" className="h-3 w-3" aria-hidden />],
  }
  const [tone, icon] = m[status] ?? ['neutral', null]
  return <Badge tone={tone} icon={icon}>{status}</Badge>
}

const prov: Record<Provenance, { label: string; tone: Tone; tip: string }> = {
  verified: { label: 'Project result', tone: 'green', tip: 'Value supplied from the project’s own evaluation.' },
  repo: { label: 'Repo README', tone: 'cyan', tip: 'Value taken from the repository README benchmark tables.' },
  reconstructed: { label: 'Reconstructed', tone: 'amber', tip: 'Derived deterministically from reported metrics (e.g. confusion matrix, ROC curve). Replace with notebook exports.' },
  illustrative: { label: 'Illustrative', tone: 'neutral', tip: 'Plausible placeholder (e.g. timings, CV spread) until real exports are connected.' },
}
export function ProvenanceBadge({ kind }: { kind: Provenance }) {
  const p = prov[kind]
  return <Tooltip label={p.tip}><span tabIndex={0}><Badge tone={p.tone}>{p.label}</Badge></span></Tooltip>
}
export function SimulatedBadge() {
  return <Tooltip label="No trained model is connected. Output comes from a rule-based demo scorer."><span tabIndex={0}><Badge tone="amber" icon={<AlertTriangle className="h-3 w-3" aria-hidden />}>SIMULATED</Badge></span></Tooltip>
}
