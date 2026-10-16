import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { cn } from '@/lib/format'
import { Button } from './ui/Button'
import { SearchInput } from './ui/Controls'
import { EmptyState } from './ui/States'
import { downloadCsv } from '@/lib/export'
import { useToast } from './ui/Toast'
import { useSessionState } from '@/hooks/useSessionState'

export interface Column<T> { key: string; header: string; value?: (r: T) => string | number; render?: (r: T) => ReactNode; numeric?: boolean; sortable?: boolean; className?: string; hideOnMobile?: boolean }

export function DataTable<T>({ id, columns, rows, rowKey, searchKeys, searchPlaceholder = 'Search…', initialSort, pageSize = 10, filters, exportName, onRowClick, selectedKey, caption, emptyTitle = 'No results', emptyBody = 'Try a different search or clear filters.', dense, maxHeight }: {
  id: string; columns: Column<T>[]; rows: T[]; rowKey: (r: T) => string; searchKeys?: (r: T) => string; searchPlaceholder?: string
  initialSort?: { key: string; dir: 'asc' | 'desc' }; pageSize?: number; filters?: ReactNode; exportName?: string; onRowClick?: (r: T) => void; selectedKey?: string; caption: string
  emptyTitle?: string; emptyBody?: string; dense?: boolean; maxHeight?: number
}) {
  const toast = useToast()
  const [q, setQ] = useSessionState(`dt-${id}-q`, '')
  const [sort, setSort] = useSessionState<{ key: string; dir: 'asc' | 'desc' } | undefined>(`dt-${id}-sort`, initialSort)
  const [page, setPage] = useState(0)
  const get = (c: Column<T>, r: T) => c.value ? c.value(r) : ((r as Record<string, unknown>)[c.key] as string | number)

  const data = useMemo(() => {
    let out = rows
    if (q && searchKeys) out = out.filter((r) => searchKeys(r).toLowerCase().includes(q.toLowerCase()))
    if (sort) {
      const col = columns.find((c) => c.key === sort.key)
      if (col) out = [...out].sort((a, b) => {
        const x = get(col, a), y = get(col, b)
        const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true })
        return sort.dir === 'asc' ? r : -r
      })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, sort, columns])

  const pages = Math.max(1, Math.ceil(data.length / pageSize))
  const cur = Math.min(page, pages - 1)
  const view = data.slice(cur * pageSize, cur * pageSize + pageSize)
  const toggle = (c: Column<T>) => { if (c.sortable === false) return; setPage(0); setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: c.key, dir: c.numeric ? 'desc' : 'asc' })) }
  const exportCsv = () => {
    try {
      downloadCsv(`${exportName ?? id}.csv`, data.map((r) => Object.fromEntries(columns.map((c) => [c.header, get(c, r)]))))
      toast('success', 'CSV exported', `${data.length} rows saved.`)
    } catch (e) { toast('error', 'Export failed', e instanceof Error ? e.message : undefined) }
  }

  return (
    <div className="min-w-0">
      {(searchKeys || filters || exportName) && (
        <div className="mb-2 flex flex-wrap items-center gap-2 [&>*]:max-w-full">
          {searchKeys && <div className="min-w-[180px] flex-1 sm:max-w-xs"><SearchInput label={`Search ${caption}`} value={q} onChange={(v) => { setQ(v); setPage(0) }} placeholder={searchPlaceholder} /></div>}
          {filters}
          {exportName && <Button size="sm" className="ml-auto" icon={<Download className="h-3.5 w-3.5" />} onClick={exportCsv}>Export CSV</Button>}
        </div>
      )}
      <div className="overflow-auto rounded-md border border-line focus-visible:outline-cyan" tabIndex={0} role="region" aria-label={`${caption} table`} style={maxHeight ? { maxHeight } : undefined}>
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 z-10 bg-panel2 text-xs text-muted">
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.key
                return (
                  <th key={c.key} scope="col" aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className={cn('whitespace-nowrap border-b border-line px-3 py-2 font-medium', c.numeric && 'text-right', c.hideOnMobile && 'hidden md:table-cell', c.className)}>
                    {c.sortable === false ? c.header : (
                      <button onClick={() => toggle(c)} className={cn('inline-flex items-center gap-1 hover:text-ink', active && 'text-cyan', c.numeric && 'flex-row-reverse')}>
                        {c.header}{active ? (sort!.dir === 'asc' ? <ArrowUp className="h-3 w-3" aria-hidden /> : <ArrowDown className="h-3 w-3" aria-hidden />) : <span className="h-3 w-3" />}
                      </button>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {view.map((r) => {
              const k = rowKey(r), sel = selectedKey === k
              return (
                <tr key={k} onClick={onRowClick ? () => onRowClick(r) : undefined} onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(r) } } : undefined}
                  tabIndex={onRowClick ? 0 : undefined} aria-selected={onRowClick ? sel : undefined}
                  className={cn('border-b border-line/60 last:border-0 hover:bg-panel2/70', onRowClick && 'cursor-pointer', sel && 'bg-cyan/5 shadow-[inset_2px_0_0_rgb(var(--cyan))]')}>
                  {columns.map((c) => (
                    <td key={c.key} className={cn('px-3', dense ? 'py-1.5' : 'py-2', c.numeric && 'num text-right font-mono text-[13px]', c.hideOnMobile && 'hidden md:table-cell', c.className)}>
                      {c.render ? c.render(r) : String(get(c, r) ?? '')}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
        {!view.length && <div className="p-3"><EmptyState title={emptyTitle} body={emptyBody} action={q ? <Button size="sm" onClick={() => setQ('')}>Clear search</Button> : undefined} /></div>}
      </div>
      {pages > 1 && (
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span aria-live="polite">{data.length.toLocaleString()} rows · page {cur + 1} of {pages}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" aria-label="Previous page" disabled={cur === 0} onClick={() => setPage(cur - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" aria-label="Next page" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  )
}
