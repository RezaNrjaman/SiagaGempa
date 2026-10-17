import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PALETTE } from '@/lib/palette'

function DepthTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="glass rounded-control px-3 py-2 text-xs">
      <p className="font-semibold text-text-1">M {point.magnitude}</p>
      <p className="text-text-2">
        Kedalaman <span className="tnum text-text-1">{point.depth_km} km</span>
      </p>
    </div>
  )
}

/* Tiga populasi kedalaman mengikuti kelas yang sama dengan diagram tumpuk. */
const DEPTH_SERIES = [
  { key: 'Dangkal', label: 'Dangkal (< 70 km)', color: '#a5b4fc' },
  { key: 'Menengah', label: 'Menengah (70–300 km)', color: '#6366f1' },
  { key: 'Dalam', label: 'Dalam (> 300 km)', color: '#312e81' },
]

function depthClass(depth) {
  if (depth < 70) return 'Dangkal'
  if (depth <= 300) return 'Menengah'
  return 'Dalam'
}

/*
 * Sebaran kedalaman x magnitudo dari sampel katalog. Sumbu kedalaman dibalik
 * (0 km = permukaan di atas) agar membaca seperti penampang bumi.
 */
export default function DepthScatter({ data = [], height = 280, ariaLabel }) {
  const groups = DEPTH_SERIES.map((series) => ({
    ...series,
    points: data
      .filter((row) => depthClass(row.depth_km) === series.key)
      .map((row) => ({ depth_km: row.depth_km, magnitude: row.magnitude })),
  }))

  return (
    <div role="img" aria-label={ariaLabel} style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={PALETTE.grid} />
          <XAxis
            type="number"
            dataKey="magnitude"
            name="M"
            domain={[4, 'auto']}
            tick={{ fill: PALETTE.text2, fontSize: 12 }}
            axisLine={{ stroke: PALETTE.grid }}
            tickLine={false}
          />
          <YAxis
            type="number"
            dataKey="depth_km"
            name="Kedalaman (km)"
            reversed
            tick={{ fill: PALETTE.text2, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip content={<DepthTooltip />} cursor={{ strokeDasharray: '4 4' }} />
          <Legend wrapperStyle={{ color: PALETTE.text2, fontSize: 12 }} />
          {groups.map((group) => (
            <Scatter
              key={group.key}
              name={group.label}
              data={group.points}
              fill={group.color}
              fillOpacity={0.65}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
