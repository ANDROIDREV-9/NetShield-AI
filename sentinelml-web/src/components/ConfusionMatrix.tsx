import { fmtInt } from '@/lib/format'
import { cn } from '@/lib/format'

export function ConfusionMatrix({ tn, fp, fn, tp, normalize = false }: { tn: number; fp: number; fn: number; tp: number; normalize?: boolean }) {
  const rowSum = [tn + fp, fn + tp]
  const cell = (v: number, row: number) => (normalize ? `${((v / rowSum[row]) * 100).toFixed(2)}%` : fmtInt(v))
  const tone = {
    tn: 'border-emerald/40 bg-emerald/10', tp: 'border-emerald/40 bg-emerald/10',
    fp: 'border-amber/50 bg-amber/10', fn: 'border-red/60 bg-red/15',
  }
  const Cell = ({ k, v, row, name, desc }: { k: 'tn' | 'fp' | 'fn' | 'tp'; v: number; row: number; name: string; desc: string }) => (
    <div className={cn('flex min-h-[84px] flex-col items-center justify-center rounded border p-2 text-center', tone[k])} role="cell" aria-label={`${name}: ${cell(v, row)}. ${desc}`}>
      <span className="num font-mono text-lg font-semibold">{cell(v, row)}</span>
      <span className="text-[11px] font-semibold tracking-wide">{name}</span>
      <span className="hidden text-[10px] text-muted sm:block">{desc}</span>
    </div>
  )
  return (
    <div>
      <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-1.5 text-center text-xs text-muted" role="table" aria-label="Confusion matrix">
        <span />
        <span className="font-medium">Predicted BENIGN</span><span className="font-medium">Predicted ATTACK</span>
        <span className="[writing-mode:vertical-rl] rotate-180 font-medium">Actual BENIGN</span>
        <Cell k="tn" v={tn} row={0} name="TN" desc="Benign passed" />
        <Cell k="fp" v={fp} row={0} name="FP" desc="False alarm" />
        <span className="[writing-mode:vertical-rl] rotate-180 font-medium">Actual ATTACK</span>
        <Cell k="fn" v={fn} row={1} name="FN" desc="MISSED attack" />
        <Cell k="tp" v={tp} row={1} name="TP" desc="Attack caught" />
      </div>
    </div>
  )
}
