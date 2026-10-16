import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import type { Importance } from '@/data/types'
import { useTheme } from '@/hooks/useTheme'
import { ChartTooltip } from './charts/ChartTooltip'

export function FeatureImportanceChart({ data, height = 340, max = 12, tone = 'cyan' }: { data: Importance[]; height?: number; max?: number; tone?: 'cyan' | 'amber' | 'emerald' }) {
  const { colors } = useTheme()
  const rows = [...data].sort((a, b) => b.value - a.value).slice(0, max)
  return (
    <div role="img" aria-label={`Feature importance bar chart. Top feature: ${rows[0]?.feature}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ left: 6, right: 16, top: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" tickFormatter={(v) => v.toFixed(2)} tick={{ fontSize: 11 }} stroke={colors.line} />
          <YAxis type="category" dataKey="feature" width={150} tick={{ fontSize: 11, fill: colors.muted }} stroke={colors.line} interval={0} />
          <RTooltip cursor={{ fill: 'rgb(var(--panel2))' }} content={<ChartTooltip format={(v) => v.toFixed(3)} />} />
          <Bar dataKey="value" name="Importance" radius={[0, 3, 3, 0]}>
            {rows.map((r) => <Cell key={r.feature} fill={r.engineered ? colors.amber : colors[tone]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
