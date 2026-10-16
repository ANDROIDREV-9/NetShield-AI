import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Bell, CheckCheck, CircleUser, Database, Keyboard, Menu, Moon, Search, Sun, Info } from 'lucide-react'
import { IconButton } from './ui/Button'
import { Tooltip } from './ui/Tooltip'
import { Badge } from './StatusBadge'
import { useTheme } from '@/hooks/useTheme'
import { DATASET, ACTIVITY } from '@/data/dataset'
import { fmtDateTime } from '@/lib/format'
import { cn } from '@/lib/format'
import { BACKEND_CONNECTED } from '@/api/client'

function Popover({ button, children, align = 'right', label }: { button: (p: { onClick: () => void; open: boolean }) => ReactNode; children: (close: () => void) => ReactNode; align?: 'left' | 'right'; label: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const down = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', down); document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key) }
  }, [open])
  return (
    <div ref={ref} className="relative">
      {button({ onClick: () => setOpen((o) => !o), open })}
      {open && <div role="menu" aria-label={label} className={cn('absolute top-full z-50 mt-1.5 w-72 max-w-[85vw] animate-slidein rounded-md border border-line bg-panel shadow-2xl', align === 'right' ? 'right-0' : 'left-0')}>{children(() => setOpen(false))}</div>}
    </div>
  )
}

export function TopHeader({ onMenu, onSearch, onShortcuts, onAbout }: { onMenu: () => void; onSearch: () => void; onShortcuts: () => void; onAbout: () => void }) {
  const { theme, toggle } = useTheme()
  const [read, setRead] = useState(false)
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-bg/90 px-3 backdrop-blur sm:px-4">
      <IconButton label="Open navigation menu" className="lg:hidden" onClick={onMenu} aria-controls="mobile-drawer"><Menu className="h-5 w-5" /></IconButton>
      <div className="min-w-0 leading-tight lg:hidden">
        <div className="truncate text-sm font-semibold">SentinelML</div>
      </div>
      <div className="hidden min-w-0 leading-tight lg:block">
        <h1 className="text-sm font-semibold">SentinelML <span className="font-normal text-muted">· CICIDS 2017 Intrusion Intelligence</span></h1>
      </div>
      <button onClick={onSearch} className="ml-auto hidden h-8 w-56 items-center gap-2 rounded-md border border-line bg-panel2 px-2.5 text-xs text-muted hover:border-cyan/50 md:flex" aria-label="Search pages, models and features (Ctrl+K)">
        <Search className="h-3.5 w-3.5" aria-hidden /> Search… <kbd className="ml-auto rounded border border-line px-1 font-mono text-[10px]">Ctrl K</kbd>
      </button>
      <div className="ml-auto flex items-center gap-1 md:ml-0">
        <div className="mr-1 hidden items-center gap-2 xl:flex">
          <Tooltip label={`${DATASET.records.toLocaleString()} flows · ${DATASET.files} CSV files`}>
            <span tabIndex={0}><Badge tone="green" icon={<Database className="h-3 w-3" aria-hidden />}>Dataset loaded</Badge></span>
          </Tooltip>
          <Tooltip label={BACKEND_CONNECTED ? 'Predictor is calling the configured API' : 'No backend model connected — predictions are simulated'}>
            <span tabIndex={0}><Badge tone={BACKEND_CONNECTED ? 'green' : 'amber'}>{BACKEND_CONNECTED ? 'API connected' : 'Demo mode'}</Badge></span>
          </Tooltip>
          <span className="text-[11px] text-muted">Last eval <time dateTime={DATASET.lastEvaluation} className="text-ink">{fmtDateTime(DATASET.lastEvaluation)}</time></span>
        </div>
        <Tooltip label="Search (Ctrl+K)"><IconButton label="Search" className="md:hidden" onClick={onSearch}><Search className="h-[18px] w-[18px]" /></IconButton></Tooltip>
        <Tooltip label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
          <IconButton label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggle}>{theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}</IconButton>
        </Tooltip>
        <Popover label="Notifications" button={({ onClick, open }) => (
          <Tooltip label="Notifications"><IconButton label={`Notifications${read ? '' : ', 3 unread'}`} aria-expanded={open} aria-haspopup="menu" onClick={onClick} className="relative">
            <Bell className="h-[18px] w-[18px]" />{!read && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red" aria-hidden />}
          </IconButton></Tooltip>)}>
          {() => (
            <div>
              <div className="flex items-center justify-between border-b border-line px-3 py-2"><span className="text-sm font-semibold">Notifications</span>
                <button onClick={() => setRead(true)} className="flex items-center gap-1 text-xs text-cyan hover:underline"><CheckCheck className="h-3.5 w-3.5" aria-hidden />Mark all read</button></div>
              <ul className="max-h-72 divide-y divide-line overflow-y-auto">
                {ACTIVITY.slice(0, 4).map((a, i) => (
                  <li key={a.time} className="flex gap-2 px-3 py-2.5 text-xs">
                    <span className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', !read && i < 3 ? 'bg-cyan' : 'bg-line')} aria-hidden />
                    <div><p className="font-medium text-ink">{a.title}</p><p className="text-muted">{a.detail}</p><p className="mt-0.5 text-faint">{a.time}</p></div>
                  </li>))}
              </ul>
            </div>)}
        </Popover>
        <Popover label="Profile menu" button={({ onClick, open }) => (
          <Tooltip label="Profile"><IconButton label="Profile menu" aria-expanded={open} aria-haspopup="menu" onClick={onClick}><CircleUser className="h-5 w-5" /></IconButton></Tooltip>)}>
          {(close) => (
            <div className="py-1 text-sm">
              <div className="border-b border-line px-3 py-2"><p className="font-medium">Evaluator view</p><p className="text-xs text-muted">23CSE301 Machine Learning Capstone</p></div>
              <button role="menuitem" onClick={() => { close(); onShortcuts() }} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-panel2"><Keyboard className="h-4 w-4 text-muted" aria-hidden />Keyboard shortcuts</button>
              <button role="menuitem" onClick={() => { close(); onAbout() }} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-panel2"><Info className="h-4 w-4 text-muted" aria-hidden />About this build & data sources</button>
              <button role="menuitem" onClick={() => { toggle(); close() }} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-panel2">{theme === 'dark' ? <Sun className="h-4 w-4 text-muted" aria-hidden /> : <Moon className="h-4 w-4 text-muted" aria-hidden />}Toggle theme</button>
            </div>)}
        </Popover>
      </div>
    </header>
  )
}
