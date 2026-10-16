import GlassPanel from '@/components/ui/GlassPanel'
import QueryState from '@/components/ui/QueryState'

const TONE_TEXT = {
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-danger',
  neutral: 'text-text-1',
}

const TONE_ACCENT = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
  neutral: 'bg-brand-500',
}

/*
 * Aksen tone hanya pada kartu berstatus (PRD 10.2); kartu netral memakai
 * garis biru merek. Angka tabular agar baris KPI sejajar.
 */
export default function KpiCard({
  label,
  value,
  unit,
  caption,
  tone = 'neutral',
  compact = false,
  query,
  isEmpty,
  empty,
}) {
  return (
    <GlassPanel className="relative flex min-h-[124px] flex-col gap-1 overflow-hidden p-5">
      <span
        className={`absolute inset-y-0 left-0 w-[3px] ${TONE_ACCENT[tone]}`}
        aria-hidden="true"
      />
      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-2">
        {label}
      </span>
      <QueryState
        query={query}
        isEmpty={isEmpty}
        empty={empty}
        skeleton={<div className="mt-2 h-8 w-24 animate-pulse rounded-control bg-white/10" />}
      >
        <div className="flex items-baseline gap-2">
          <span
            className={`tnum font-semibold leading-tight ${
              compact ? 'text-xl' : 'text-[32px] leading-none'
            } ${TONE_TEXT[tone]}`}
          >
            {value}
          </span>
          {unit ? <span className="text-sm text-text-2">{unit}</span> : null}
        </div>
      </QueryState>
      {caption ? <span className="mt-auto pt-2 text-xs text-text-2">{caption}</span> : null}
    </GlassPanel>
  )
}
