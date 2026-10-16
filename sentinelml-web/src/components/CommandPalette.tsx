import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Search } from 'lucide-react'
import { Modal } from './ui/Modal'
import { NAV } from './nav'
import { CLASSIFIERS } from '@/data/classification'
import { REGRESSORS } from '@/data/regression'
import { CLUSTER_ALGOS } from '@/data/clustering'
import { FEATURES } from '@/data/features'
import { CLASSES } from '@/data/dataset'
import { cn } from '@/lib/format'

interface Item { label: string; group: string; to: string; hint?: string }
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const items = useMemo<Item[]>(() => [
    ...NAV.map((n) => ({ label: n.label, group: 'Pages', to: n.path, hint: n.desc })),
    ...CLASSIFIERS.map((m) => ({ label: m.name, group: 'Classifiers', to: '/classification', hint: `F1 ${m.f1.toFixed(4)}` })),
    ...REGRESSORS.map((m) => ({ label: m.name, group: 'Regressors', to: '/regression', hint: `R² ${m.r2.toFixed(4)}` })),
    ...CLUSTER_ALGOS.map((m) => ({ label: m.name, group: 'Clustering', to: '/clustering', hint: `Silhouette ${m.silhouette.toFixed(4)}` })),
    ...CLASSES.map((c) => ({ label: c.name, group: 'Classes', to: '/dataset', hint: c.count.toLocaleString() })),
    ...FEATURES.map((f) => ({ label: f.name, group: 'Features', to: '/dataset', hint: f.group })),
  ], [])
  const res = useMemo(() => { const s = q.trim().toLowerCase(); return (s ? items.filter((i) => i.label.toLowerCase().includes(s) || i.group.toLowerCase().includes(s)) : items.filter((i) => i.group === 'Pages')).slice(0, 12) }, [q, items])
  useEffect(() => { setIdx(0) }, [q])
  useEffect(() => { if (!open) setQ('') }, [open])
  const go = (i?: Item) => { if (!i) return; nav(i.to); onClose() }
  return (
    <Modal open={open} onClose={onClose} title="Search SentinelML">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-faint" aria-hidden />
        <input autoFocus aria-label="Search pages, models, classes and features" placeholder="Search pages, models, classes, features…" value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, res.length - 1)) } if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)) } if (e.key === 'Enter') go(res[idx]) }}
          className="h-10 w-full rounded-md border border-line bg-panel2 pl-9 pr-3 text-sm placeholder:text-faint focus:border-cyan" role="combobox" aria-expanded="true" aria-controls="cmd-list" />
      </div>
      <ul id="cmd-list" role="listbox" aria-label="Results" className="mt-2 max-h-[50vh] overflow-y-auto">
        {res.map((r, i) => (
          <li key={`${r.group}-${r.label}`} role="option" aria-selected={i === idx} onMouseEnter={() => setIdx(i)} onClick={() => go(r)}
            className={cn('flex cursor-pointer items-center gap-2 rounded px-2.5 py-2 text-sm', i === idx ? 'bg-cyan/10 text-cyan' : 'hover:bg-panel2')}>
            <span className="w-24 shrink-0 text-[11px] uppercase tracking-wider text-faint">{r.group}</span>
            <span className="flex-1 truncate">{r.label}</span>
            {r.hint && <span className="hidden truncate text-xs text-muted sm:block">{r.hint}</span>}
            {i === idx && <CornerDownLeft className="h-3.5 w-3.5" aria-hidden />}
          </li>
        ))}
        {!res.length && <li className="px-2.5 py-6 text-center text-sm text-muted">No matches for “{q}”.</li>}
      </ul>
    </Modal>
  )
}
