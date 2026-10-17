/*
 * Skeleton presisi: meniru bentuk grafik/panel (batang + garis sumbu) dan tetap
 * di dalam kotak yang sama tingginya dengan grafik jadi (PRD 9.6).
 */
export default function ChartSkeleton({ height = 280, bars = 10, withLegend = true }) {
  const heights = Array.from({ length: bars }, (_, index) => {
    const seed = Math.sin((index + 1) * 12.9898) * 43758.5453
    return 0.35 + Math.abs(seed - Math.floor(seed)) * 0.6
  })
  return (
    <div className="flex flex-col" style={{ height }} aria-hidden="true">
      <div className="flex flex-1 items-end gap-2">
        {heights.map((scale, index) => (
          <div
            key={index}
            className="skeleton w-full rounded-t"
            style={{ height: `${Math.round(scale * 100)}%` }}
          />
        ))}
      </div>
      <div className="mt-2 h-px w-full bg-grid" />
      {withLegend ? (
        <div className="mt-2 flex justify-center gap-4">
          <span className="skeleton h-2 w-20 rounded-full" />
          <span className="skeleton h-2 w-16 rounded-full" />
        </div>
      ) : null}
    </div>
  )
}
