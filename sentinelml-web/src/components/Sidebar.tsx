import { NavLink } from 'react-router-dom'
import { ShieldCheck, X } from 'lucide-react'
import { NAV } from './nav'
import { cn } from '@/lib/format'
import { useEffect } from 'react'

function Links({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Primary" className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
      {NAV.map(({ path, label, icon: Icon }) => (
        <NavLink key={path} to={path} end={path === '/'} onClick={onNavigate}
          className={({ isActive }) => cn('flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition', isActive ? 'bg-cyan/10 text-cyan shadow-[inset_2px_0_0_rgb(var(--cyan))]' : 'text-muted hover:bg-panel2 hover:text-ink')}>
          <Icon className="h-4 w-4 shrink-0" aria-hidden />{label}
        </NavLink>
      ))}
    </nav>
  )
}
function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-md border border-cyan/40 bg-cyan/10 text-cyan shadow-glow"><ShieldCheck className="h-4.5 w-4.5" aria-hidden /></span>
      <div className="leading-tight"><div className="text-sm font-semibold tracking-wide">SentinelML</div><div className="text-[10px] text-muted">CICIDS 2017 Intrusion Intelligence</div></div>
    </div>
  )
}
const Foot = () => (
  <div className="border-t border-line px-4 py-3 text-[11px] leading-snug text-muted">
    23CSE301 ML Capstone<br /><span className="text-faint">Mock-data build · no live inference</span>
  </div>
)

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-panel lg:flex" aria-label="Sidebar">
      <Brand /><Links /><Foot />
    </aside>
  )
}

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [open, onClose])
  return (
    <div className={cn('fixed inset-0 z-50 lg:hidden', !open && 'invisible pointer-events-none')} aria-hidden={!open}>
      <div className={cn('absolute inset-0 bg-black/60 transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={onClose} />
      <aside id="mobile-drawer" role="dialog" aria-modal="true" aria-label="Navigation menu"
        className={cn('absolute inset-y-0 left-0 flex w-64 max-w-[85vw] flex-col border-r border-line bg-panel transition-transform', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between pr-2"><Brand /><button aria-label="Close navigation menu" onClick={onClose} className="rounded p-1.5 text-muted hover:bg-panel2 hover:text-ink"><X className="h-4 w-4" /></button></div>
        <Links onNavigate={onClose} /><Foot />
      </aside>
    </div>
  )
}
