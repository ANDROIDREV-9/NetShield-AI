import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type Theme = 'dark' | 'light'
const Ctx = createContext<{ theme: Theme; toggle: () => void; colors: Colors }>(null as never)

export interface Colors { cyan: string; emerald: string; amber: string; red: string; violet: string; slate: string; ink: string; muted: string; line: string; panel: string; series: string[] }

function read(): Colors {
  const s = getComputedStyle(document.documentElement)
  const v = (n: string) => `rgb(${s.getPropertyValue('--' + n).trim().replace(/\s+/g, ' ')})`
  const base = { cyan: v('cyan'), emerald: v('emerald'), amber: v('amber'), red: v('red'), ink: v('ink'), muted: v('muted'), line: v('line'), panel: v('panel'), violet: '#a78bfa', slate: '#8aa0b8' }
  return { ...base, series: [base.cyan, base.emerald, base.amber, base.red, base.violet, base.slate] }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try { const t = localStorage.getItem('sentinel-theme'); if (t === 'light' || t === 'dark') return t } catch { /* storage unavailable */ }
    return 'dark'
  })
  const [colors, setColors] = useState<Colors>(() => read())
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    setColors(read())
    try { localStorage.setItem('sentinel-theme', theme) } catch { /* ignore */ }
  }, [theme])
  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])
  const value = useMemo(() => ({ theme, toggle, colors }), [theme, toggle, colors])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export const useTheme = () => useContext(Ctx)
