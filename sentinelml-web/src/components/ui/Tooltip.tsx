import { cloneElement, useId, useState, type ReactElement } from 'react'

/** Accessible tooltip: shows on hover and keyboard focus, wired with aria-describedby. */
export function Tooltip({ label, children, side = 'bottom' }: { label: string; children: ReactElement<Record<string, unknown>>; side?: 'top' | 'bottom' | 'right' }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const pos = side === 'top' ? 'bottom-full mb-1.5 left-1/2 -translate-x-1/2' : side === 'right' ? 'left-full ml-2 top-1/2 -translate-y-1/2' : 'top-full mt-1.5 left-1/2 -translate-x-1/2'
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      {cloneElement(children, { 'aria-describedby': open ? id : undefined })}
      {open && (
        <span id={id} role="tooltip" className={`pointer-events-none absolute z-[70] ${pos} whitespace-nowrap rounded border border-line bg-panel2 px-2 py-1 text-xs text-ink shadow-lg`}>
          {label}
        </span>
      )}
    </span>
  )
}
