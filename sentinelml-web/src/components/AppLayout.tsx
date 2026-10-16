import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar, MobileDrawer } from './Sidebar'
import { TopHeader } from './TopHeader'
import { CommandPalette } from './CommandPalette'
import { Modal } from './ui/Modal'
import { ProvenanceBadge } from './StatusBadge'
import { NAV } from './nav'
import type { Provenance } from '@/data/types'
import { BACKEND_CONNECTED } from '@/api/client'

const SHORTCUTS: [string, string][] = [['Ctrl / ⌘ + K', 'Open search'], ['/', 'Open search'], ['G then 1–9', 'Jump to page (Overview … Review Presentation)'], ['← →', 'Previous / next slide in presentation mode'], ['Esc', 'Close dialogs, menus and presentation mode'], ['Tab / Shift+Tab', 'Move between controls']]

export function AppLayout() {
  const [drawer, setDrawer] = useState(false)
  const [search, setSearch] = useState(false)
  const [help, setHelp] = useState(false)
  const [about, setAbout] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const closeDrawer = useCallback(() => setDrawer(false), [])
  const closeSearch = useCallback(() => setSearch(false), [])
  useEffect(() => { setDrawer(false); document.getElementById('main')?.focus({ preventScroll: true }); window.scrollTo(0, 0); document.title = `${NAV.find((n) => n.path === pathname)?.label ?? 'SentinelML'} · SentinelML` }, [pathname])
  useEffect(() => {
    let g = false, t: ReturnType<typeof setTimeout>
    const k = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch(true); return }
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === '/') { e.preventDefault(); setSearch(true); return }
      if (e.key === '?') { setHelp(true); return }
      if (g && /^[0-9]$/.test(e.key)) { const n = NAV[e.key === '0' ? 9 : Number(e.key) - 1]; if (n) navigate(n.path); g = false; return }
      if (e.key.toLowerCase() === 'g') { g = true; clearTimeout(t); t = setTimeout(() => (g = false), 900) }
    }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [navigate])
  const provs: Provenance[] = ['verified', 'repo', 'reconstructed', 'illustrative']
  return (
    <div className="min-h-full">
      <a href="#main" className="sr-only z-[100] rounded bg-cyan px-3 py-2 text-sm font-semibold text-black focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Skip to content</a>
      <Sidebar />
      <MobileDrawer open={drawer} onClose={closeDrawer} />
      <div className="lg:pl-60">
        <TopHeader onMenu={() => setDrawer(true)} onSearch={() => setSearch(true)} onShortcuts={() => setHelp(true)} onAbout={() => setAbout(true)} />
        <main id="main" tabIndex={-1} className="mx-auto max-w-[1500px] p-3 outline-none sm:p-4 lg:p-5"><Outlet /></main>
      </div>
      <CommandPalette open={search} onClose={closeSearch} />
      <Modal open={help} onClose={() => setHelp(false)} title="Keyboard shortcuts">
        <dl className="divide-y divide-line text-sm">{SHORTCUTS.map(([k, d]) => <div key={k} className="flex items-center justify-between gap-4 py-2"><dt><kbd className="rounded border border-line bg-panel2 px-1.5 py-0.5 font-mono text-xs">{k}</kbd></dt><dd className="text-right text-muted">{d}</dd></div>)}</dl>
      </Modal>
      <Modal open={about} onClose={() => setAbout(false)} title="About this build" wide>
        <div className="space-y-3 text-sm text-muted">
          <p><span className="font-medium text-ink">SentinelML</span> is a presentation and demo console for the CICIDS 2017 intrusion-detection capstone. It runs entirely in the browser on structured mock data.</p>
          <p>{BACKEND_CONNECTED ? 'A backend API is configured: Live Predictor calls it directly.' : 'No backend model is connected. Live Predictor output is produced by a rule-based demo scorer and is always labelled SIMULATED.'}</p>
          <p className="text-ink">Every figure is tagged with where it came from:</p>
          <ul className="space-y-1.5">{provs.map((p) => <li key={p} className="flex items-center gap-2"><ProvenanceBadge kind={p} /></li>)}</ul>
          <p>Headline metrics supplied by the project owner (dataset audit, KNN/Decision-Tree classification, Random-Forest/Decision-Tree/Gradient-Boosting regression) are used exactly. Confusion matrices, ROC and residual plots are reconstructed from those metrics; replace the files in <code className="rounded bg-panel2 px-1 font-mono text-xs">src/data/</code> with notebook exports to make them exact.</p>
        </div>
      </Modal>
    </div>
  )
}
