interface P { active?: boolean; payload?: { name?: string; value?: number | string; color?: string; dataKey?: string; payload?: Record<string, unknown> }[]; label?: string | number; format?: (v: number, name?: string) => string; labelFormat?: (l: string | number) => string }
export function ChartTooltip({ active, payload, label, format, labelFormat }: P) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded border border-line bg-panel2 px-2.5 py-1.5 text-xs shadow-lg">
      {label !== undefined && <div className="mb-1 font-medium">{labelFormat ? labelFormat(label) : String(label)}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} aria-hidden />
          <span className="text-muted">{p.name ?? p.dataKey}</span>
          <span className="num ml-auto pl-3 font-mono">{typeof p.value === 'number' ? (format ? format(p.value, p.name) : p.value.toLocaleString()) : p.value}</span>
        </div>
      ))}
    </div>
  )
}
