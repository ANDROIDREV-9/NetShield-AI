import { useId } from 'react'
import { FLOW_FIELDS, type FlowField } from '@/data/samples'
import { cn } from '@/lib/format'
import { Tooltip } from './ui/Tooltip'
import { Info } from 'lucide-react'

export type FormValues = Record<string, string>
export type FormErrors = Record<string, string>

export function validateField(f: FlowField, raw: string): string | undefined {
  const t = raw.trim()
  if (t === '') return 'Required'
  const n = Number(t)
  if (!Number.isFinite(n)) return 'Enter a valid number'
  if (f.integer && !Number.isInteger(n)) return 'Must be a whole number'
  if (n < f.min) return `Minimum is ${f.min.toLocaleString()}`
  if (n > f.max) return `Maximum is ${f.max.toLocaleString()}`
  return undefined
}
export function validateAll(v: FormValues): FormErrors {
  const e: FormErrors = {}
  for (const f of FLOW_FIELDS) { const m = validateField(f, v[f.key] ?? ''); if (m) e[f.key] = m }
  return e
}

function Field({ f, value, error, onChange, onBlur, excluded }: { f: FlowField; value: string; error?: string; onChange: (v: string) => void; onBlur: () => void; excluded?: boolean }) {
  const id = useId()
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-1">
        <label htmlFor={id} className="truncate text-xs font-medium text-ink">{f.label}</label>
        <Tooltip label={f.hint} side="top"><button type="button" tabIndex={-1} aria-label={`About ${f.label}`} className="text-faint hover:text-ink"><Info className="h-3 w-3" /></button></Tooltip>
      </div>
      <div className="relative">
        <input id={id} name={f.key} inputMode="decimal" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur}
          aria-invalid={!!error} aria-describedby={`${id}-d`} spellCheck={false}
          className={cn('h-9 w-full rounded-md border bg-panel2 pl-2.5 pr-12 font-mono text-[13px] hover:border-cyan/50 focus:border-cyan', error ? 'border-red/70' : 'border-line')} />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-faint">{f.unit}</span>
      </div>
      <p id={`${id}-d`} className={cn('mt-0.5 min-h-[14px] text-[11px]', error ? 'text-red' : 'text-faint')}>
        {error ?? (excluded ? 'Ignored by regression (target-derived)' : `${f.min.toLocaleString()} – ${f.max.toLocaleString()}`)}
      </p>
    </div>
  )
}

export function PredictionForm({ values, errors, onChange, onBlur, excluded = [] }: { values: FormValues; errors: FormErrors; onChange: (k: string, v: string) => void; onBlur: (k: string) => void; excluded?: string[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
      {FLOW_FIELDS.map((f) => <Field key={f.key} f={f} value={values[f.key] ?? ''} error={errors[f.key]} onChange={(v) => onChange(f.key, v)} onBlur={() => onBlur(f.key)} excluded={excluded.includes(f.key)} />)}
    </div>
  )
}
