import { TONE } from '@/config'

const TONE_STYLE = {
  ok: { wrap: 'bg-ok/10 border-ok/40 text-ok', dot: 'bg-ok' },
  warn: { wrap: 'bg-warn/10 border-warn/40 text-warn', dot: 'bg-warn' },
  danger: { wrap: 'bg-danger/10 border-danger/40 text-danger', dot: 'bg-danger' },
  neutral: { wrap: 'bg-white/5 border-white/20 text-text-2', dot: 'bg-text-2' },
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
