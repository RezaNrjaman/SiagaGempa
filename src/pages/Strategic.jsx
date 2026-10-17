import { useMemo } from 'react'
import { Compass, AlertOctagon, Crosshair, Globe2, Layers, Mountain, CalendarRange } from 'lucide-react'
import ChartCard from '@/components/ui/ChartCard'
import ChartSkeleton from '@/components/ui/ChartSkeleton'
import DataTable from '@/components/ui/DataTable'
import KpiCard from '@/components/ui/KpiCard'
import StatusBadge from '@/components/ui/StatusBadge'
import QuakeMap from '@/components/map/QuakeMap'
import SeriesChart from '@/components/charts/SeriesChart'
import DepthScatter from '@/components/charts/DepthScatter'
import { useRpc } from '@/hooks/useRpc'
import { PALETTE } from '@/lib/palette'
import { formatDateWIB, formatMagnitude, formatNumber } from '@/lib/format'

const riskColumns = [
  {
    key: 'rank',
    label: '#',
    align: 'right',
    render: (row) => <span className="tnum text-text-2">{row.rank}</span>,
  },
  { key: 'province', label: 'Provinsi' },
  {
    key: 'score',
    label: 'Skor',
    align: 'right',
    render: (row) => (
      <div className="flex items-center justify-end gap-2">
        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
          <span
            className="bar-fill block h-full rounded-full bg-gradient-to-r from-brand-700 to-brand-500"
            style={{ width: `${Math.min(100, row.score)}%` }}
          />
        </span>
        <span className="tnum w-10 text-right">{formatNumber(row.score, 1)}</span>
      </div>
    ),
  },
  {
    key: 'category',
    label: 'Kategori',
    render: (row) => <StatusBadge label={row.category} />,
  },
  {
    key: 'quakes',
    label: 'Jumlah',
    align: 'right',
    render: (row) => <span className="tnum">{formatNumber(row.quakes)}</span>,
  },
  {
    key: 'avg_mag',
    label: 'Rata M',
    align: 'right',
    render: (row) => <span className="tnum">{formatNumber(row.avg_mag, 2)}</span>,
  },
  {
    key: 'm6_plus',
    label: 'M ≥ 6',
    align: 'right',
    render: (row) => <span className="tnum">{formatNumber(row.m6_plus)}</span>,
  },
]

const significantColumns = [
  {
    key: 'event_time',
    label: 'Tanggal',
    render: (row) => <span className="tnum">{formatDateWIB(row.event_time)}</span>,
  },
  {
    key: 'magnitude',
    label: 'M',
    align: 'right',
    render: (row) => <span className="tnum font-medium">{formatMagnitude(row.magnitude)}</span>,
  },
  {
    key: 'depth_km',
    label: 'Kedalaman',
    align: 'right',
    render: (row) => <span className="tnum">{formatNumber(row.depth_km)} km</span>,
  },
  { key: 'location_text', label: 'Lokasi' },
  { key: 'province', label: 'Provinsi' },
]

export default function Strategic() {
  const yearly = useRpc('strategic_yearly')
  const risk = useRpc('strategic_risk')
  const heat = useRpc('strategic_heat')
  const significant = useRpc('strategic_significant')
  const magHist = useRpc('strategic_mag_hist')
  const scatter = useRpc('strategic_scatter', { p_sample: 800 })

  const yearlyRows = yearly.data ?? []
  const riskRows = risk.data ?? []
  const magHistRows = magHist.data ?? []
  const scatterRows = scatter.data ?? []
  const heatRows = heat.data ?? []
  const significantRows = significant.data ?? []

  const totals = useMemo(() => {
    const rows = yearly.data ?? []
    const quakes = rows.reduce((sum, row) => sum + row.quakes, 0)
    const m6 = rows.reduce((sum, row) => sum + row.m6_plus, 0)
    const shallow = rows.reduce((sum, row) => sum + row.shallow, 0)
    return { quakes, m6, shallow, shallowPct: quakes ? (shallow / quakes) * 100 : 0 }
  }, [yearly.data])

  const topRisk = riskRows[0]
  const priority = riskRows.slice(0, 5)

  /* Gempa terbesar katalog + tahun dengan jumlah gempa tertinggi. */
  const strongest = significantRows[0] ?? null
  const busiestYear = yearlyRows.reduce(
    (best, row) => (row.quakes > (best?.quakes ?? -1) ? row : best),
    null,
  )

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-text-2">
            <Compass size={14} strokeWidth={1.75} aria-hidden="true" />
            SiagaGempa · Jendela tahun dan dekade
          </div>
          <h1 className="mt-1 text-xl font-semibold text-text-1">Dashboard Strategis</h1>
        </div>
        <span className="text-xs text-text-2">Snapshot historis USGS 2010-2025</span>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Total gempa 2010-2025"
          value={yearlyRows.length > 0 ? formatNumber(totals.quakes) : ''}
          unit="gempa"
          caption="M ≥ 4.0 di bounding box Indonesia"
          icon={Globe2}
          query={yearly}
        />
        <KpiCard
          label="Total M ≥ 6"
          value={yearlyRows.length > 0 ? formatNumber(totals.m6) : ''}
          unit="gempa"
          caption="Gempa kuat 2010-2025"
          tone="danger"
          icon={AlertOctagon}
          query={yearly}
        />
        <KpiCard
          label="Provinsi skor tertinggi"
          value={topRisk ? topRisk.province : ''}
          compact
          caption={topRisk ? `Skor kerawanan ${formatNumber(topRisk.score, 1)}` : ''}
          tone="neutral"
          icon={Crosshair}
          query={risk}
        />
        <KpiCard
          label="Persentase gempa dangkal"
          value={yearlyRows.length > 0 ? formatNumber(totals.shallowPct, 1) : ''}
          unit="%"
          caption="Kedalaman < 70 km"
          icon={Layers}
          query={yearly}
        />
        <KpiCard
          label="M terbesar katalog"
          value={strongest ? formatMagnitude(strongest.magnitude) : ''}
          unit="M"
          caption={
            strongest
              ? `${formatDateWIB(strongest.event_time)} · ${strongest.province}`
              : ''
          }
          tone="danger"
          icon={Mountain}
          query={significant}
        />
        <KpiCard
          label="Tahun teraktif"
          value={busiestYear ? formatNumber(busiestYear.quakes) : ''}
          unit="gempa"
          caption={busiestYear ? `Tahun ${busiestYear.year}` : ''}
          tone="neutral"
          icon={CalendarRange}
          query={yearly}
        />
      </section>

      <ChartCard
        title="Tren tahunan"
        caption="Batang (sumbu kiri): jumlah gempa per tahun. Garis (sumbu kanan): jumlah gempa M ≥ 6."
        query={yearly}
        skeleton={<ChartSkeleton height={300} bars={16} withLegend />}
      >
        <SeriesChart
          data={yearlyRows}
          xKey="year"
          formatValue={(value) => formatNumber(value)}
          ariaLabel="Grafik tren jumlah gempa tahunan dan gempa M ≥ 6"
          series={[
            { key: 'quakes', label: 'Jumlah gempa', type: 'bar', color: PALETTE.brand700 },
            { key: 'm6_plus', label: 'M ≥ 6', type: 'line', color: PALETTE.brand500, axis: 'right' },
          ]}
        />
      </ChartCard>

      <ChartCard
        title="Komposisi kedalaman per tahun"
        caption="Batang bertumpuk: Dangkal (< 70 km), Menengah (70–300 km), Dalam (> 300 km)."
        query={yearly}
        skeleton={<ChartSkeleton height={300} bars={16} withLegend />}
      >
        <SeriesChart
          data={yearlyRows}
          xKey="year"
          ariaLabel="Grafik batang bertumpuk komposisi kedalaman per tahun"
          series={[
            { key: 'shallow', label: 'Dangkal', type: 'bar', color: PALETTE.brand300, stackId: 'd' },
            { key: 'intermediate', label: 'Menengah', type: 'bar', color: PALETTE.brand500, stackId: 'd' },
            { key: 'deep', label: 'Dalam', type: 'bar', color: PALETTE.brand700, stackId: 'd' },
          ]}
        />
      </ChartCard>

      <section className="grid gap-4 md:gap-6 md:grid-cols-2">
        <ChartCard
          title="Sebaran magnitudo"
          caption="Seluruh gempa M ≥ 4 pada katalog USGS 2010-2025, kelas langkah 0,5. Ekor panjang: gempa besar jarang namun menentukan risiko."
          query={magHist}
          skeleton={<ChartSkeleton height={260} bars={8} withLegend />}
        >
          <SeriesChart
            data={magHistRows}
            xKey="bucket"
            height={260}
            formatValue={(value) => formatNumber(value)}
            ariaLabel="Histogram sebaran magnitudo katalog penuh"
            series={[{ key: 'quakes', label: 'Jumlah gempa', type: 'bar', color: PALETTE.brand500 }]}
          />
        </ChartCard>

        <ChartCard
          title="Kedalaman × magnitudo"
          caption="Sampel acak 800 gempa dari katalog. Sumbu kedalaman dibalik: permukaan di atas, populasi dangkal dan dalam terlihat terpisah."
          query={scatter}
          isEmpty={scatterRows.length === 0}
          empty="Tidak ada sampel pada rentang ini."
          skeleton={<div className="skeleton h-[260px] w-full rounded-control" aria-hidden="true" />}
        >
          <DepthScatter
            data={scatterRows}
            height={260}
            ariaLabel="Diagram titik sebaran kedalaman terhadap magnitudo"
          />
        </ChartCard>
      </section>

      <ChartCard
        title="Peta kerawanan (sel 0,5°)"
        caption="Warna sekuensial biru sesuai jumlah gempa per sel. Peta vektor tanpa tile."
        query={heat}
        isEmpty={heatRows.length === 0}
        empty="Tidak ada sebaran pada rentang ini."
        skeleton={
          <div
            className="skeleton h-[320px] w-full rounded-control md:h-[420px]"
            aria-hidden="true"
          />
        }
      >
        <QuakeMap mode="grid" data={heatRows} />
      </ChartCard>

      <section className="grid gap-4 md:gap-6 xl:grid-cols-12">
        <ChartCard
          className="xl:col-span-7"
          title="Skor kerawanan 38 provinsi"
          caption="Skor 0-100 dari frekuensi, rata-rata magnitudo, dan jumlah gempa M ≥ 6."
          query={risk}
        >
          <DataTable columns={riskColumns} rows={riskRows} rowKey={(row) => row.province} maxHeight="420px" />
        </ChartCard>

        <ChartCard
          className="xl:col-span-5"
          title="Prioritas mitigasi"
          caption="Lima provinsi dengan skor kerawanan tertinggi."
          query={risk}
        >
          <ol className="flex flex-col gap-2">
            {priority.map((row, index) => (
              <li
                key={row.province}
                className="rise-in rounded-control border border-slate-200 bg-white/70 p-3 text-sm text-text-1 transition-colors hover:border-brand-300"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <span className="tnum text-text-2">{index + 1}.</span> {row.province}, skor{' '}
                <span className="tnum">{formatNumber(row.score, 1)}</span>, faktor dominan:{' '}
                {row.main_factor}
              </li>
            ))}
          </ol>
        </ChartCard>
      </section>

      <ChartCard
        title="20 gempa terkuat"
        caption="Gempa dengan magnitudo terbesar pada periode 2010-2025 (sumber USGS)."
        query={significant}
      >
        <DataTable
          columns={significantColumns}
          rows={significantRows}
          rowKey={(row) => `${row.event_time}-${row.magnitude}`}
          maxHeight="420px"
        />
      </ChartCard>

      <p className="text-xs text-text-2">
        Rumus skor kerawanan: 100 × (0,4·F + 0,4·E + 0,2·S), dengan F = jumlah gempa, E = rata-rata
        magnitudo, S = jumlah M ≥ 6, masing-masing dinormalisasi min-max antar provinsi. Kategori:{' '}
        <StatusBadge label="Tinggi" /> ≥ 67, <StatusBadge label="Sedang" /> 34–66,9,{' '}
        <StatusBadge label="Rendah" /> &lt; 34. Faktor dominan menentukan komponen terbesar.
      </p>
    </div>
  )
}
