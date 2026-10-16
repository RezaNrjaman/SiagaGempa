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
  delta,
  tone = 'neutral',
  compact = false,
  query,
  isEmpty,
  empty,
}) {
  const deltaStyle =
    delta && /^[+-]/.test(delta)
      ? delta.startsWith('+')
        ? 'text-warn'
        : 'text-ok'
      : 'text-text-2'

  return (
    <GlassPanel elevated className="relative flex min-h-[132px] flex-col gap-1 overflow-hidden p-6 md:p-8">
      <span className={`absolute inset-y-0 left-0 w-[3px] ${TONE_ACCENT[tone]}`} aria-hidden="true" />
      <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-text-2">
        {label}
      </span>
      <QueryState
        query={query}
        isEmpty={isEmpty}
        empty={empty}
        skeleton={<div className="mt-2 h-8 w-24 animate-pulse rounded-control bg-white/10" />}
      >
        <div className="flex items-baseline gap-2 mt-auto">
          <span
            className={`tnum font-bold leading-none ${compact ? 'text-2xl' : 'text-[32px]'} ${TONE_TEXT[tone]}`}
          >
            {value}
          </span>
          {unit ? <span className="text-sm text-text-2">{unit}</span> : null}
          {delta ? <span className={`ml-auto text-xs font-medium ${deltaStyle}`}>{delta}</span> : null}
        </div>
      </QueryState>
      {caption ? <span className="mt-auto pt-2 text-xs text-text-2">{caption}</span> : null}
    </GlassPanel>
  )
}
