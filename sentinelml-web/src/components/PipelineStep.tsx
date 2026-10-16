import { FolderInput, Type, CopyMinus, Infinity as Inf, Wrench, Columns, Scissors, FlaskConical, Target, Split, ShieldCheck, Cpu, type LucideIcon } from 'lucide-react'
import type { PipelineStepData } from '@/data/pipeline'
import { cn } from '@/lib/format'

const ICONS: Record<string, LucideIcon> = { FolderInput, Type, CopyMinus, Infinity: Inf, Wrench, Columns, Scissors, FlaskConical, Target, Split, ShieldCheck, Cpu }

export function PipelineStep({ step, active, onSelect, leakageKey }: { step: PipelineStepData; active: boolean; onSelect: () => void; leakageKey?: boolean }) {
  const Icon = ICONS[step.icon] ?? Cpu
  return (
    <button onClick={onSelect} aria-pressed={active} aria-label={`Step ${step.id}: ${step.title}`}
      className={cn('group relative flex w-full items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition',
        active ? 'border-cyan/60 bg-cyan/10 shadow-glow' : 'border-line bg-panel hover:border-cyan/40 hover:bg-panel2')}>
      <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded border font-mono text-xs', active ? 'border-cyan/60 text-cyan' : 'border-line text-muted')}>{step.id}</span>
      <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium">{step.title}</span></span>
      <Icon className={cn('h-4 w-4 shrink-0', leakageKey ? 'text-emerald' : active ? 'text-cyan' : 'text-faint')} aria-hidden />
    </button>
  )
}
