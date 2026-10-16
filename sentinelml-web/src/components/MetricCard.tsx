import type { ReactNode } from 'react'
import { cn } from '@/lib/format'
import { Tooltip } from './ui/Tooltip'
import { Info } from 'lucide-react'

type Tone = 'cyan' | 'emerald' | 'amber' | 'red' | 'neutral'
const toneText: Record<Tone, string> = { cyan: 'text-cyan', emerald: 'text-emerald', amber: 'text-amber', red: 'text-red', neutral: 'text-ink' }
const toneBar: Record<Tone, string> = { cyan: 'bg-cyan', emerald: 'bg-emerald', amber: 'bg-amber', red: 'bg-red', neutral: 'bg-muted' }

export function MetricCard({ label, value, sub, tone = 'neutral', icon, hint, progress, className }: { label: string; value: ReactNode; sub?: ReactNode; tone?: Tone; icon?: ReactNode; hint?: string; progress?: number; className?: string }) {
  return (
    <div className={cn('rounded-md border border-line bg-panel p-3', className)}>
      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <span className="flex items-center gap-1.5 truncate">{icon}{label}</span>
        {hint && <Tooltip label={hint}><button aria-label={`About ${label}`} className="text-faint hover:text-ink"><Info className="h-3.5 w-3.5" /></button></Tooltip>}
      </div>
      <div className={cn('num mt-1.5 font-mono text-[22px] font-semibold leading-none', toneText[tone])}>{value}</div>
      {sub && <div className="mt-1.5 text-xs text-muted">{sub}</div>}
      {progress !== undefined && (
        <div className="mt-2 h-1 overflow-hidden rounded bg-line" role="progressbar" aria-label={label} aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div className={cn('h-full', toneBar[tone])} style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      )}
    </div>
  )
}
