import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PALETTE } from '@/lib/palette'

function GlassTooltip({ active, payload, label, formatLabel, formatValue }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-control px-3 py-2 text-xs">
      <p className="mb-1 font-medium text-text-1">{formatLabel ? formatLabel(label) : label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2 text-text-2">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} aria-hidden="true" />
          <span>
            {entry.name}:{' '}
            <span className="tnum text-text-1">
              {formatValue ? formatValue(entry.value) : entry.value}
            </span>
          </span>
        </p>
      ))}
    </div>
  )
}

/*
 * Satu komponen untuk semua grafik (PRD 10.5).
 * Maksimum tiga seri; seri 1 --brand-700, seri 2 --brand-500, baseline putus-putus.
 */
export default function SeriesChart({
  data,
  xKey,
  series,
  height = 280,
  formatX,
  formatValue,
  ariaLabel,
}) {
  const hasRightAxis = series.some((item) => item.axis === 'right')

  return (
    <div role="img" aria-label={ariaLabel} style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={PALETTE.grid} vertical={false} />
          <XAxis
            dataKey={xKey}
            tickFormatter={formatX}
            tick={{ fill: PALETTE.text2, fontSize: 12 }}
            axisLine={{ stroke: PALETTE.grid }}
            tickLine={false}
            minTickGap={12}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: PALETTE.text2, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          {hasRightAxis ? (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: PALETTE.text2, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
          ) : null}
          <Tooltip
            content={<GlassTooltip formatLabel={formatX} formatValue={formatValue} />}
            cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
          />
          <Legend wrapperStyle={{ color: PALETTE.text2, fontSize: 12 }} />
          {series.map((item) =>
            item.type === 'line' ? (
              <Line
                key={item.key}
                yAxisId={item.axis ?? 'left'}
                type="monotone"
                dataKey={item.key}
                name={item.label}
                stroke={item.color}
                strokeWidth={2}
                strokeDasharray={item.dashed ? '5 4' : undefined}
                dot={false}
              />
            ) : (
              <Bar
                key={item.key}
                yAxisId={item.axis ?? 'left'}
                dataKey={item.key}
                name={item.label}
                fill={item.color}
                stackId={item.stackId}
                radius={item.stackId ? undefined : [4, 4, 0, 0]}
              />
            ),
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
