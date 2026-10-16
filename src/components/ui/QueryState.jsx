import { RefreshCw } from 'lucide-react'

function SkeletonBlock({ className = 'h-24 w-full' }) {
  return <div className={`animate-pulse rounded-control bg-white/10 ${className}`} />
}

function ErrorBox({ message = 'Gagal memuat data.', onRetry }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-control border border-danger/40 bg-danger/10 p-3">
      <p className="text-sm text-text-1">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-control border border-white/20 px-2.5 py-1 text-xs text-text-1 transition-colors hover:bg-white/10"
      >
        <RefreshCw size={14} strokeWidth={1.75} aria-hidden="true" />
        Coba lagi
      </button>
    </div>
  )
}

function EmptyBox({ message = 'Belum ada data.' }) {
  return (
    <div className="flex min-h-20 items-center justify-center rounded-control border border-white/10 bg-white/[0.03] p-4 text-center">
      <p className="text-sm text-text-2">{message}</p>
    </div>
  )
}

/* Empat status: memuat, error, kosong, sukses (PRD 9.6). */
export default function QueryState({ query, isEmpty = false, empty, skeleton, children }) {
  if (query?.isPending) return skeleton ?? <SkeletonBlock />
  if (query?.isError) return <ErrorBox onRetry={() => query.refetch()} />
  if (isEmpty) return <EmptyBox message={empty} />
  return children
}
