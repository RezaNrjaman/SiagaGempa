import { TONE } from '@/config'

const TONE_STYLE = {
  ok: { wrap: 'bg-emerald-50/90 border-emerald-200 text-emerald-700', dot: 'bg-emerald-500' },
  warn: { wrap: 'bg-amber-50/90 border-amber-200 text-amber-700', dot: 'bg-amber-500' },
  danger: { wrap: 'bg-red-50/90 border-red-200 text-red-700', dot: 'bg-red-500' },
  neutral: { wrap: 'bg-slate-100/90 border-slate-200 text-slate-600', dot: 'bg-slate-400' },
}

/* Warna tidak pernah menjadi satu-satunya pembawa makna: badge selalu bertuliskan (PRD 10.7). */
export default function StatusBadge({ label, tone }) {
  const resolved = tone ?? TONE[label] ?? 'neutral'
  const style = TONE_STYLE[resolved] ?? TONE_STYLE.neutral
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-control border px-2 py-0.5 text-xs font-medium ${style.wrap}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {label}
    </span>
  )
}
