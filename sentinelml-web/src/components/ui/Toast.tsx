import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'

type Kind = 'success' | 'error' | 'warning' | 'info'
interface T { id: number; kind: Kind; title: string; body?: string }
const Ctx = createContext<(kind: Kind, title: string, body?: string) => void>(() => {})
let n = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<T[]>([])
  const push = useCallback((kind: Kind, title: string, body?: string) => {
    const id = ++n
    setItems((s) => [...s.slice(-3), { id, kind, title, body }])
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 4200)
  }, [])
  const icon = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info }
  const tone = { success: 'text-emerald', error: 'text-red', warning: 'text-amber', info: 'text-cyan' }
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[min(92vw,360px)] flex-col gap-2" role="region" aria-label="Notifications" aria-live="polite">
        {items.map((t) => {
          const I = icon[t.kind]
          return (
            <div key={t.id} role="status" className="pointer-events-auto flex animate-slidein items-start gap-2.5 rounded-md border border-line bg-panel2 p-3 shadow-xl">
              <I className={`mt-0.5 h-4 w-4 shrink-0 ${tone[t.kind]}`} aria-hidden />
              <div className="min-w-0 flex-1"><p className="text-sm font-medium">{t.title}</p>{t.body && <p className="mt-0.5 text-xs text-muted">{t.body}</p>}</div>
              <button aria-label="Dismiss notification" onClick={() => setItems((s) => s.filter((x) => x.id !== t.id))} className="text-muted hover:text-ink"><X className="h-4 w-4" /></button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}
export const useToast = () => useContext(Ctx)
