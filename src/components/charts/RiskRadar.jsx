import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { PALETTE } from '@/lib/palette'

function RadarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-control px-3 py-2 text-xs">
      <p className="mb-1 font-semibold text-text-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 text-text-2">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} aria-hidden="true" />
          <span>
            {entry.name}:{' '}
            <span className="tnum font-medium text-text-1">{Math.round(entry.value)}</span>
          </span>
        </p>
      ))}
    </div>
  )
}

/*
 * Radar profil: fungsi tunggal - membandingkan bentuk kerawanan (bukan hanya
 * skornya) antar provinsi teratas pada dimensi yang dinormalkan 0-100.
 */
export default function RiskRadar({ data = [], series = [], height = 280, ariaLabel }) {
  return (
    <div role="img" aria-label={ariaLabel} style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke={PALETTE.grid} />
          <PolarAngleAxis
            dataKey="dim"
            tick={{ fill: PALETTE.text2, fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={45}
            domain={[0, 100]}
            tick={{ fill: PALETTE.text2, fontSize: 10 }}
            axisLine={false}
            tickCount={5}
          />
          <Tooltip content={<RadarTooltip />} />
          <Legend wrapperStyle={{ color: PALETTE.text2, fontSize: 12 }} />
          {series.map((item) => (
            <Radar
              key={item.key}
              name={item.label}
              dataKey={item.key}
              stroke={item.color}
              fill={item.color}
              fillOpacity={0.18}
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: item.color, strokeWidth: 0 }}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
