function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}
const esc = (v: unknown) => {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) throw new Error('Nothing to export')
  const cols = Object.keys(rows[0])
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n')
  download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename)
}
export function downloadText(filename: string, text: string, type = 'text/plain') {
  download(new Blob([text], { type }), filename)
}

/** Rasterise the first Recharts <svg> inside `root` to a PNG, inlining computed colours so the dark theme survives. */
export async function exportSvgAsPng(root: HTMLElement, filename: string) {
  const svg = root.querySelector('svg.recharts-surface') as SVGSVGElement | null
  if (!svg) throw new Error('No chart found to export')
  const rect = svg.getBoundingClientRect()
  const clone = svg.cloneNode(true) as SVGSVGElement
  const src = svg.querySelectorAll<SVGElement>('*'), dst = clone.querySelectorAll<SVGElement>('*')
  src.forEach((el, i) => {
    const cs = getComputedStyle(el), d = dst[i]
    if (!d) return
    for (const p of ['fill', 'stroke', 'stroke-width', 'opacity', 'font-size', 'font-family', 'font-weight', 'text-anchor']) {
      const v = cs.getPropertyValue(p); if (v) d.style.setProperty(p, v)
    }
  })
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(rect.width)); clone.setAttribute('height', String(rect.height))
  const bg = getComputedStyle(document.body).backgroundColor
  const xml = new XMLSerializer().serializeToString(clone)
  const img = new Image()
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml)
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('Could not render chart')); img.src = url })
  const scale = 2, c = document.createElement('canvas')
  c.width = rect.width * scale; c.height = rect.height * scale
  const ctx = c.getContext('2d')!
  ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(img, 0, 0, c.width, c.height)
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/png'))
  if (!blob) throw new Error('PNG export failed')
  download(blob, filename)
}
