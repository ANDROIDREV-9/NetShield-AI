import { useCallback, useEffect, useRef, useState } from 'react'
import { Bar, BarChart, Cell, CartesianGrid, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, NotebookPen, Play, X } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useSessionState } from '@/hooks/useSessionState'
import { useTheme } from '@/hooks/useTheme'
import { SLIDES, type Slide } from '@/data/presentation'
import { CLASSES } from '@/data/dataset'
import { CLASSIFIERS } from '@/data/classification'
import { REGRESSORS } from '@/data/regression'
import { cn, fmtCompact } from '@/lib/format'

const tone = { cyan: 'text-cyan', emerald: 'text-emerald', amber: 'text-amber', red: 'text-red' }

function Visual({ id, big }: { id: string; big: boolean }) {
  const { colors } = useTheme()
  const h = big ? 300 : 200
  const wrap = (children: React.ReactNode, label: string) => <div role="img" aria-label={label} style={{ height: h }} className="w-full">{<ResponsiveContainer width="100%" height="100%">{children as React.ReactElement}</ResponsiveContainer>}</div>
  if (id === 'dataset') {
    const d = CLASSES.map((c) => ({ name: c.name, v: c.count, benign: c.name === 'BENIGN' }))
    return wrap(<BarChart data={d} layout="vertical" margin={{ right: 40 }}><XAxis type="number" scale="log" domain={[1, 'auto']} allowDataOverflow hide /><YAxis type="category" dataKey="name" width={140} tick={{ fontSize: big ? 12 : 10, fill: colors.muted }} interval={0} stroke={colors.line} /><Bar dataKey="v" radius={[0, 3, 3, 0]}>{d.map((x) => <Cell key={x.name} fill={x.benign ? colors.emerald : colors.red} />)}<LabelList dataKey="v" position="right" formatter={(v: number) => fmtCompact(v)} style={{ fontSize: 10, fill: colors.muted }} /></Bar></BarChart>, 'Class distribution')
  }
  if (id === 'classification') {
    const d = [...CLASSIFIERS].sort((a, b) => b.f1 - a.f1).map((m) => ({ name: m.short, v: m.f1 }))
    return wrap(<BarChart data={d} margin={{ top: 18 }}><CartesianGrid vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 12 }} stroke={colors.line} /><YAxis domain={[0, 1]} hide /><Bar dataKey="v" radius={[3, 3, 0, 0]}>{d.map((x, i) => <Cell key={x.name} fill={i < 2 ? colors.emerald : colors.slate} />)}<LabelList dataKey="v" position="top" formatter={(v: number) => v.toFixed(4)} style={{ fontSize: 11, fill: colors.muted }} /></Bar></BarChart>, 'Weighted F1 by classifier')
  }
  if (id === 'regression') {
    const d = [...REGRESSORS].sort((a, b) => b.r2 - a.r2).map((m) => ({ name: m.name.replace(' Regressor', '').replace(' Regression', ''), v: m.r2 }))
    return wrap(<BarChart data={d} layout="vertical" margin={{ right: 50 }}><XAxis type="number" domain={[0.5, 1]} hide /><YAxis type="category" dataKey="name" width={120} tick={{ fontSize: big ? 12 : 10, fill: colors.muted }} interval={0} stroke={colors.line} /><Bar dataKey="v" radius={[0, 3, 3, 0]}>{d.map((x, i) => <Cell key={x.name} fill={i < 3 ? colors.emerald : colors.slate} />)}<LabelList dataKey="v" position="right" formatter={(v: number) => v.toFixed(4)} style={{ fontSize: 10, fill: colors.muted }} /></Bar></BarChart>, 'R squared by regressor')
  }
  if (id === 'audit') {
    const d = [{ name: 'Missing', v: 1358, c: colors.amber }, { name: 'Infinite', v: 4376, c: colors.red }, { name: 'Duplicates', v: 308381, c: colors.slate }]
    return wrap(<BarChart data={d} margin={{ top: 18 }}><XAxis dataKey="name" tick={{ fontSize: 12 }} stroke={colors.line} /><YAxis scale="log" domain={[100, 'auto']} allowDataOverflow hide /><Bar dataKey="v" radius={[3, 3, 0, 0]}>{d.map((x) => <Cell key={x.name} fill={x.c} />)}<LabelList dataKey="v" position="top" formatter={(v: number) => v.toLocaleString()} style={{ fontSize: 11, fill: colors.muted }} /></Bar></BarChart>, 'Data quality issues')
  }
  return null
}

function SlideBody({ s, big }: { s: Slide; big: boolean }) {
  const hasVisual = ['dataset', 'classification', 'regression', 'audit'].includes(s.id)
  return (
    <div className={cn('grid gap-6', hasVisual ? 'lg:grid-cols-[1.1fr_1fr]' : '')}>
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-cyan">{s.kicker}</p>
        <h3 className={cn('mt-2 font-semibold leading-tight tracking-tight', big ? 'text-3xl sm:text-4xl' : 'text-2xl')}>{s.title}</h3>
        <ul className={cn('mt-5 space-y-3 text-muted', big ? 'text-lg' : 'text-base')}>{s.bullets.map((b) => <li key={b} className="flex gap-3"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" aria-hidden /><span>{b}</span></li>)}</ul>
        {s.stats && <dl className="mt-6 flex flex-wrap gap-3">{s.stats.map((x) => <div key={x.label} className="min-w-[110px] rounded-md border border-line bg-panel px-3 py-2"><dt className="text-[11px] uppercase tracking-wider text-muted">{x.label}</dt><dd className={cn('num font-mono font-semibold', big ? 'text-2xl' : 'text-xl', x.tone ? tone[x.tone] : '')}>{x.value}</dd></div>)}</dl>}
      </div>
      {hasVisual && <div className="self-center rounded-md border border-line bg-panel p-3"><Visual id={s.id} big={big} /></div>}
    </div>
  )
}

function Notes({ s, onClose }: { s: Slide; onClose: () => void }) {
  return (
    <aside aria-label="Speaker notes" className="border-t border-line bg-panel px-4 py-3 md:border-l md:border-t-0 md:w-80 md:shrink-0 md:overflow-y-auto">
      <div className="flex items-center justify-between"><h4 className="flex items-center gap-1.5 text-sm font-semibold"><NotebookPen className="h-4 w-4 text-amber" aria-hidden />Speaker notes</h4><button aria-label="Close speaker notes" onClick={onClose} className="text-muted hover:text-ink"><X className="h-4 w-4" /></button></div>
      <p className="mt-2 text-sm leading-relaxed text-muted">{s.notes}</p>
    </aside>
  )
}

export default function Presentation() {
  const toast = useToast()
  const [idx, setIdx] = useSessionState('pres-idx', 0)
  const [notes, setNotes] = useSessionState('pres-notes', false)
  const [present, setPresent] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const s = SLIDES[idx]
  const go = useCallback((d: number) => setIdx((i) => Math.min(SLIDES.length - 1, Math.max(0, i + d))), [setIdx])

  useEffect(() => {
    if (!present) return
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); go(1) }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1) }
      if (e.key === 'Escape') setPresent(false)
      if (e.key.toLowerCase() === 'n') setNotes((n) => !n)
    }
    document.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [present, go, setNotes])
  useEffect(() => { const f = () => { if (!document.fullscreenElement && present) { /* stay in presentation overlay */ } }; document.addEventListener('fullscreenchange', f); return () => document.removeEventListener('fullscreenchange', f) }, [present])

  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else { setPresent(true); await (stage.current ?? document.documentElement).requestFullscreen() }
    } catch { setPresent(true); toast('info', 'Presentation mode on', 'Browser fullscreen is blocked in this embed — the focus view fills the window instead.') }
  }
  const stop = () => { setPresent(false); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}) }

  const controls = (compact: boolean) => (
    <div className="flex items-center gap-1.5">
      <Button size="sm" aria-label="Previous slide" disabled={idx === 0} onClick={() => go(-1)} icon={<ChevronLeft className="h-4 w-4" />}>{compact ? '' : 'Prev'}</Button>
      <span className="num w-14 text-center font-mono text-xs text-muted" aria-live="polite">{idx + 1} / {SLIDES.length}</span>
      <Button size="sm" aria-label="Next slide" disabled={idx === SLIDES.length - 1} onClick={() => go(1)} variant="primary">{compact ? '' : 'Next'}<ChevronRight className="h-4 w-4" /></Button>
      <Button size="sm" aria-pressed={notes} aria-expanded={notes} onClick={() => setNotes((n) => !n)} icon={<NotebookPen className="h-3.5 w-3.5" />}>Notes</Button>
    </div>
  )
  const progress = ((idx + 1) / SLIDES.length) * 100

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Review presentation" title="Evaluator walkthrough" subtitle="Ten sections built from the project’s real findings. Use Present for a distraction-free view; arrow keys navigate and N toggles speaker notes."
        actions={<><Button icon={<Maximize2 className="h-4 w-4" />} onClick={fullscreen}>Fullscreen</Button><Button variant="primary" icon={<Play className="h-4 w-4" />} onClick={() => setPresent(true)}>Present</Button></>} />

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <nav aria-label="Slides" className="order-2 lg:order-1"><ol className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">{SLIDES.map((x, i) => (
          <li key={x.id}><button onClick={() => setIdx(i)} aria-current={i === idx ? 'step' : undefined} className={cn('flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-[13px] transition', i === idx ? 'border-cyan/60 bg-cyan/10 text-cyan' : 'border-line bg-panel text-muted hover:text-ink')}><span className="font-mono text-[11px]">{String(i + 1).padStart(2, '0')}</span><span className="truncate">{x.kicker.split('· ')[1]}</span></button></li>))}</ol></nav>
        <section className="order-1 min-w-0 overflow-hidden rounded-md border border-line bg-panel2/40 lg:order-2" aria-label={`Slide ${idx + 1}: ${s.title}`}>
          <div className="h-1 bg-line" role="progressbar" aria-label="Presentation progress" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-cyan transition-all" style={{ width: `${progress}%` }} /></div>
          <div className="flex flex-col md:flex-row"><div className="min-w-0 flex-1 p-5 sm:p-7"><SlideBody s={s} big={false} /></div>{notes && <Notes s={s} onClose={() => setNotes(false)} />}</div>
          <div className="flex items-center justify-between border-t border-line px-4 py-2.5">{controls(false)}</div>
        </section>
      </div>

      {present && (
        <div ref={stage} role="dialog" aria-modal="true" aria-label="Presentation mode" className="fixed inset-0 z-[60] flex flex-col bg-bg">
          <div className="h-1 bg-line" role="progressbar" aria-label="Presentation progress" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-cyan transition-all" style={{ width: `${progress}%` }} /></div>
          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <div className="flex min-h-0 flex-1 items-center overflow-y-auto px-6 py-8 sm:px-12 lg:px-20"><div className="mx-auto w-full max-w-6xl"><SlideBody s={s} big /></div></div>
            {notes && <Notes s={s} onClose={() => setNotes(false)} />}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2">
            {controls(true)}
            <div className="flex items-center gap-1.5"><Button size="sm" variant="ghost" aria-label="Toggle browser fullscreen" onClick={fullscreen} icon={document.fullscreenElement ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}>Fullscreen</Button><Button size="sm" onClick={stop} icon={<X className="h-3.5 w-3.5" />}>Exit</Button></div>
          </div>
        </div>
      )}
    </div>
  )
}
