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
      <p className="mb-1 font-semibold text-text-1">{formatLabel ? formatLabel(label) : label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2 text-text-2">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} aria-hidden="true" />
          <span>
            {entry.name}:{' '}
            <span className="tnum font-medium text-text-1">
              {formatValue ? formatValue(entry.value) : entry.value}
            </span>
          </span>
        </p>
      ))}
    </div>
  )
}

/*
 * Satu komponen untuk semua grafik (PRD 10.5). Batang memakai gradasi per seri
 * (indigo/sky/violet) agar dasar terang tetap bertenaga; tooltip kaca punya
 * latar putih sehingga terbaca di atas batang.
 */
const SERIES_GRADIENTS = [
  ['#6366f1', '#a5b4fc'],
  ['#0ea5e9', '#7dd3fc'],
  ['#8b5cf6', '#c4b5fd'],
]

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
  const gradientId = (key) => `sg-bar-${String(key).replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <div role="img" aria-label={ariaLabel} style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            {series.map((item, index) => {
              const [deep, soft] = SERIES_GRADIENTS[index % SERIES_GRADIENTS.length]
              return (
                <linearGradient key={item.key} id={gradientId(item.key)} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={deep} stopOpacity={0.95} />
                  <stop offset="95%" stopColor={soft} stopOpacity={0.75} />
                </linearGradient>
              )
            })}
          </defs>
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
            cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }}
          />
          <Legend wrapperStyle={{ color: PALETTE.text2, fontSize: 12 }} />
          {series.map((item) => {
            const gradient = `url(#${gradientId(item.key)})`
            return item.type === 'line' ? (
              <Line
                key={item.key}
                yAxisId={item.axis ?? 'left'}
                type="monotone"
                dataKey={item.key}
                name={item.label}
                stroke={item.color}
                strokeWidth={2.5}
                strokeDasharray={item.dashed ? '5 4' : undefined}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
              />
            ) : (
              <Bar
                key={item.key}
                yAxisId={item.axis ?? 'left'}
                dataKey={item.key}
                name={item.label}
                fill={item.stackId ? item.color : gradient}
                stackId={item.stackId}
                radius={item.stackId ? undefined : [6, 6, 0, 0]}
                maxBarSize={44}
              />
            )
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
