import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/format'
import { Button } from './Button'

export function LoadingSkeleton({ className, lines = 0 }: { className?: string; lines?: number }) {
  if (lines) return <div className="space-y-2" aria-hidden>{Array.from({ length: lines }, (_, i) => <div key={i} className={cn('skeleton h-4', i === lines - 1 && 'w-2/3')} />)}</div>
  return <div className={cn('skeleton h-24', className)} aria-hidden />
}
export function PageSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <LoadingSkeleton key={i} className="h-24" />)}</div>
      <div className="grid gap-3 lg:grid-cols-2"><LoadingSkeleton className="h-72" /><LoadingSkeleton className="h-72" /></div>
      <span className="sr-only">Loading analytics…</span>
    </div>
  )
}
export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-line px-4 py-10 text-center">
      <Inbox className="h-6 w-6 text-faint" aria-hidden />
      <p className="text-sm font-medium">{title}</p>
      {body && <p className="max-w-sm text-xs text-muted">{body}</p>}
      {action}
    </div>
  )
}
export function ErrorState({ title = 'Something went wrong', body, onRetry }: { title?: string; body?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 rounded-md border border-red/40 bg-red/5 px-4 py-8 text-center">
      <AlertTriangle className="h-6 w-6 text-red" aria-hidden />
      <p className="text-sm font-medium">{title}</p>
      {body && <p className="max-w-md text-xs text-muted">{body}</p>}
      {onRetry && <Button size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={onRetry}>Retry</Button>}
    </div>
  )
}
