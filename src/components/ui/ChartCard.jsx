import GlassPanel from '@/components/ui/GlassPanel'
import QueryState from '@/components/ui/QueryState'

/* Pembungkus grafik dan peta. Judul + caption definisi wajib (PRD 9.2). */
export default function ChartCard({
  title,
  caption,
  action,
  query,
  isEmpty,
  empty,
  skeleton,
  className = '',
  children,
}) {
  return (
    <GlassPanel elevated className={`flex flex-col gap-3 p-5 md:p-6 ${className}`}>
      <header className="flex items-start justify-between gap-3 border-b border-grid pb-3">
        <div>
          <h2 className="text-base font-semibold text-text-1">{title}</h2>
          {caption ? <p className="mt-1 text-xs leading-relaxed text-text-2">{caption}</p> : null}
        </div>
        {action}
      </header>
      <div className="pt-1">
        <QueryState query={query} isEmpty={isEmpty} empty={empty} skeleton={skeleton}>
          {children}
        </QueryState>
      </div>
    </GlassPanel>
  )
}
