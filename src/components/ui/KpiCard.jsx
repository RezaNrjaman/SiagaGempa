import GlassPanel from '@/components/ui/GlassPanel'
import QueryState from '@/components/ui/QueryState'

const TONE_CHIP = {
  ok: 'bg-gradient-to-br from-emerald-500 to-teal-400 shadow-emerald-500/30',
  warn: 'bg-gradient-to-br from-amber-500 to-orange-400 shadow-amber-500/30',
  danger: 'bg-gradient-to-br from-red-500 to-rose-400 shadow-red-500/30',
  neutral: 'bg-gradient-to-br from-brand-700 to-brand-500 shadow-brand-500/30',
}

const TONE_ORB = {
  ok: 'from-emerald-400 to-teal-300',
  warn: 'from-amber-400 to-orange-300',
  danger: 'from-red-400 to-rose-300',
  neutral: 'from-brand-500 to-brand-300',
}

/*
 * Sparkline mini (svg poligon, tanpa recharts) untuk memberi konteks tren
 * di kartu KPI tanpa menambah berat; dibaca sebagai bentuk, bukan angka.
 */
function Spark({ values, color = '#6366f1' }) {
  if (!Array.isArray(values) || values.length < 2) return null
  const nums = values.map((v) => Number(v) || 0)
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const range = max - min || 1
  const w = 100
  const h = 26
  const points = nums.map((v, i) => [
    (i / (nums.length - 1)) * w,
    h - ((v - min) / range) * (h - 3) - 1.5,
  ])
  const line = points.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-7 w-full"
      aria-hidden="true"
    >
      <polyline points={`0,${h} ${line} ${w},${h}`} fill={color} opacity={0.14} stroke="none" />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/*
 * Kartu KPI gaya aurora-glass: chip ikon gradasi, pil delta, orb redup di
 * sudut, naik halus saat kursor, dan animasi masuk sekali saat terpasang.
 * Warna tetap tidak membawa makna sendiri: label + delta selalu bertuliskan.
 */
export default function KpiCard({
  label,
  value,
  unit,
  caption,
  delta,
  tone = 'neutral',
  compact = false,
  icon: Icon,
  spark,
  query,
  isEmpty,
  empty,
}) {
  const up = delta && /^[+-]/.test(delta) ? delta.startsWith('+') : false
  const deltaChip = delta
    ? /^[+-]/.test(delta)
      ? up
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-red-50 text-red-700 border-red-200'
      : 'bg-slate-100 text-text-2 border-slate-200'
    : null

  return (
    <GlassPanel
      elevated
      hoverable
      className="rise-in relative flex min-h-[132px] flex-col gap-1 overflow-hidden p-5 md:p-6"
    >
      <span
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${TONE_ORB[tone]} opacity-[0.12] blur-2xl`}
        aria-hidden="true"
      />
      <div className="flex items-center gap-2.5">
        {Icon ? (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TONE_CHIP[tone]} text-white shadow-lg`}
          >
            <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
          </span>
        ) : null}
        <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-text-2">
          {label}
        </span>
      </div>
      <QueryState
        query={query}
        isEmpty={isEmpty}
        empty={empty}
        skeleton={<div className="skeleton mt-2 h-8 w-24 rounded-control" />}
      >
        <div className="mt-auto flex items-baseline gap-2">
          <span className={`tnum font-bold leading-none text-text-1 ${compact ? 'text-2xl' : 'text-[32px]'}`}>
            {value}
          </span>
          {unit ? <span className="text-sm text-text-2">{unit}</span> : null}
          {delta && deltaChip ? (
            <span
              className={`tnum ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${deltaChip}`}
            >
              {/^[+-]/.test(delta) ? (up ? '↑' : '↓') : '·'}
              {String(delta).replace(/^[+-]/, '')}
            </span>
          ) : null}
        </div>
      </QueryState>
      <Spark values={spark} />
      {caption ? <span className="mt-auto pt-2 text-xs text-text-2">{caption}</span> : null}
    </GlassPanel>
  )
}
