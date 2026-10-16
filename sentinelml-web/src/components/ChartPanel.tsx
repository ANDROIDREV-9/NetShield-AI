import { useRef, useState, type ReactNode } from 'react'
import { ImageDown } from 'lucide-react'
import { cn } from '@/lib/format'
import { exportSvgAsPng } from '@/lib/export'
import { useToast } from './ui/Toast'
import { IconButton } from './ui/Button'
import { Tooltip } from './ui/Tooltip'
import { ProvenanceBadge } from './StatusBadge'
import type { Provenance } from '@/data/types'
import { LoadingSkeleton, ErrorState } from './ui/States'

export function ChartPanel({ title, subtitle, children, actions, provenance, exportName, className, height, loading, error, footer }: {
  title: string; subtitle?: string; children: ReactNode; actions?: ReactNode; provenance?: Provenance; exportName?: string; className?: string; height?: number; loading?: boolean; error?: string; footer?: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const doExport = async () => {
    if (!ref.current) return
    setBusy(true)
    try { await exportSvgAsPng(ref.current, `${exportName ?? title.toLowerCase().replace(/\W+/g, '-')}.png`); toast('success', 'Chart exported', 'PNG saved to your downloads.') }
    catch (e) { toast('error', 'Export failed', e instanceof Error ? e.message : undefined) }
    finally { setBusy(false) }
  }
  return (
    <section className={cn('flex min-w-0 flex-col rounded-md border border-line bg-panel', className)} aria-label={title}>
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-3 py-2.5">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          {provenance && <ProvenanceBadge kind={provenance} />}
          {actions}
          {exportName !== '' && (
            <Tooltip label="Export chart as PNG"><IconButton label={`Export ${title} as PNG`} onClick={doExport} disabled={busy || loading} className="h-7 w-7"><ImageDown className="h-4 w-4" /></IconButton></Tooltip>
          )}
        </div>
      </header>
      <div ref={ref} className="min-w-0 flex-1 p-3" style={height ? { height: height + 24 } : undefined}>
        {error ? <ErrorState body={error} /> : loading ? <LoadingSkeleton className="h-full min-h-40" /> : children}
      </div>
      {footer && <footer className="border-t border-line px-3 py-2 text-xs text-muted">{footer}</footer>}
    </section>
  )
}
