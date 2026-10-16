import { Crown } from 'lucide-react'
import type { ClassifierMetrics } from '@/data/types'
import { cn } from '@/lib/format'
import { ModelStatusBadge } from './StatusBadge'

const Stat = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div><dt className="text-[10px] uppercase tracking-wider text-muted">{label}</dt><dd className={cn('num font-mono text-[13px]', strong && 'font-semibold text-amber')}>{value}</dd></div>
)

export function ModelCard({ m, rank, selected, onSelect, best }: { m: ClassifierMetrics; rank: number; selected: boolean; onSelect: () => void; best?: boolean }) {
  return (
    <button onClick={onSelect} aria-pressed={selected} className={cn('flex flex-col rounded-md border bg-panel p-3 text-left transition', selected ? 'border-cyan/70 shadow-glow' : 'border-line hover:border-cyan/40')}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0"><h3 className="truncate text-sm font-semibold">{m.name}</h3><p className="text-[11px] text-muted">{m.family}</p></div>
        <span className={cn('flex h-6 shrink-0 items-center gap-1 rounded border px-1.5 font-mono text-xs', rank === 1 ? 'border-emerald/50 bg-emerald/10 text-emerald' : 'border-line text-muted')} aria-label={`Rank ${rank}`}>{rank === 1 && <Crown className="h-3 w-3" aria-hidden />}#{rank}</span>
      </div>
      <div className="mt-2"><ModelStatusBadge status={m.status} /></div>
      <dl className="mt-3 grid grid-cols-3 gap-x-2 gap-y-2">
        <Stat label="Accuracy" value={m.accuracy.toFixed(4)} />
        <Stat label="Precision" value={m.precision.toFixed(4)} />
        <Stat label="Recall" value={m.recall.toFixed(4)} strong />
        <Stat label="Wtd F1" value={m.f1.toFixed(4)} />
        <Stat label="ROC-AUC" value={m.auc.toFixed(4)} />
        <Stat label="Train" value={m.trainSec >= 60 ? `${(m.trainSec / 60).toFixed(1)} min` : `${m.trainSec.toFixed(1)} s`} />
      </dl>
      {best && <p className="mt-2 text-[11px] text-emerald">Highest weighted F1</p>}
    </button>
  )
}
