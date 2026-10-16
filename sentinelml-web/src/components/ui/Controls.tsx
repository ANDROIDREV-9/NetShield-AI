import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/format'

/** Segmented toggle (radio group semantics). */
export function Segmented<T extends string>({ value, onChange, options, label, size = 'md' }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; title?: string }[]; label: string; size?: 'sm' | 'md' }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-md border border-line bg-panel2 p-0.5">
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={value === o.value} title={o.title} onClick={() => onChange(o.value)}
          className={cn('rounded px-2.5 font-medium transition', size === 'sm' ? 'h-6 text-xs' : 'h-7 text-xs', value === o.value ? 'bg-cyan/15 text-cyan shadow-[inset_0_0_0_1px_rgb(var(--cyan)/.4)]' : 'text-muted hover:text-ink')}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Select({ value, onChange, options, label, className }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label: string; className?: string }) {
  const id = useId()
  return (
    <label htmlFor={id} className="inline-flex flex-col gap-1 text-xs text-muted">
      <span className="sr-only">{label}</span>
      <select id={id} aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}
        className={cn('h-9 rounded-md border border-line bg-panel2 px-2.5 text-sm text-ink hover:border-cyan/50', className)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

export function SearchInput({ value, onChange, placeholder, label, className }: { value: string; onChange: (v: string) => void; placeholder: string; label: string; className?: string }) {
  return (
    <input type="search" aria-label={label} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
      className={cn('h-9 w-full rounded-md border border-line bg-panel2 px-3 text-sm text-ink placeholder:text-faint hover:border-cyan/50 focus:border-cyan', className)} />
  )
}

export interface TabDef { id: string; label: string }
export function Tabs({ tabs, active, onChange, label }: { tabs: TabDef[]; active: string; onChange: (id: string) => void; label: string }) {
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const n = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length
      onChange(tabs[n].id); (document.getElementById(`tab-${tabs[n].id}`) as HTMLElement | null)?.focus()
    }
  }
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t, i) => (
        <button key={t.id} id={`tab-${t.id}`} role="tab" aria-selected={active === t.id} tabIndex={active === t.id ? 0 : -1} onKeyDown={(e) => onKey(e, i)} onClick={() => onChange(t.id)}
          className={cn('-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition', active === t.id ? 'border-cyan text-cyan' : 'border-transparent text-muted hover:text-ink')}>
          {t.label}
        </button>
      ))}
    </div>
  )
}
