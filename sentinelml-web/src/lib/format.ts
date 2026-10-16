export const fmtInt = (n: number) => Math.round(n).toLocaleString('en-US')
export const fmtNum = (n: number, d = 2) => n.toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: 0 })
export const fmt4 = (n: number) => n.toFixed(4)
export const fmtPct = (n: number, d = 1) => `${n.toFixed(d)}%`
export function fmtCompact(n: number) {
  const a = Math.abs(n)
  if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(Math.round(n * 100) / 100)
}
export function fmtSci(n: number) {
  if (n === 0) return '0'
  const a = Math.abs(n)
  return a >= 1e6 || a < 1e-3 ? n.toExponential(2) : fmtNum(n, 4)
}
export function fmtDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }) + ' IST'
}
export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')
