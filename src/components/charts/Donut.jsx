import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { PALETTE } from '@/lib/palette'

function DonutTooltip({ active, payload, formatValue }) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="glass rounded-control px-3 py-2 text-xs">
      <p className="font-semibold text-text-1">{entry.name}</p>
      <p className="text-text-2">
        <span className="tnum font-medium text-text-1">
          {formatValue ? formatValue(entry.value) : entry.value}
        </span>{' '}
        gempa
      </p>
    </div>
  )
}

/*
 * Donat proporsi: fungsi tunggal - seberapa besar pangsa tiap irisan.
 * Dipakai untuk kontribusi lima provinsi atas vs sisanya; nilai total
 * ditulis di lubang tengah agar tidak butuh legenda angka.
 */
export default function Donut({
  data = [],
  height = 260,
  centerValue,
  centerLabel,
  formatValue,
  ariaLabel,
}) {
  return (
    <div role="img" aria-label={ariaLabel} className="relative" style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<DonutTooltip formatValue={formatValue} />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={2}
            startAngle={90}
            endAngle={-270}
            stroke="#ffffff"
            strokeWidth={2}
            cornerRadius={6}
            isAnimationActive
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={entry.color ?? [PALETTE.brand500, PALETTE.brand700, PALETTE.brand300, '#8b5cf6', PALETTE.text2][index % 5]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum text-2xl font-bold text-text-1">{centerValue}</span>
        <span className="text-xs text-text-2">{centerLabel}</span>
      </div>
    </div>
  )
}
