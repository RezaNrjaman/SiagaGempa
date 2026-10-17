import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layers, Activity, MapPin, BellRing } from 'lucide-react'
import ChartCard from '@/components/ui/ChartCard'
import DataTable from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import KpiCard from '@/components/ui/KpiCard'
import StatusBadge from '@/components/ui/StatusBadge'
import { DEFAULT_MONTH, DEPTH_CLASSES, DATA_RANGE, MAG_CLASSES, NATIONAL } from '@/config'
import { useRpc } from '@/hooks/useRpc'
import {
  formatMonth,
  formatMonthShort,
  formatNumber,
  formatPercent,
  monthRange,
} from '@/lib/format'
import { PALETTE } from '@/lib/palette'
import ChartSkeleton from '@/components/ui/ChartSkeleton'
import SeriesChart from '@/components/charts/SeriesChart'

const MONTH_OPTIONS = monthRange(DATA_RANGE.start, DATA_RANGE.end).map((month) => ({
  value: month,
  label: formatMonth(month),
}))

const rankingColumns = [
  { key: 'province', label: 'Provinsi' },
  {
    key: 'quakes',
    label: 'Jumlah',
    align: 'right',
    render: (row) => <span className="tnum">{formatNumber(row.quakes)}</span>,
  },
  {
    key: 'baseline',
    label: 'Baseline',
    align: 'right',
    render: (row) => <span className="tnum text-text-2">{formatNumber(row.baseline, 1)}</span>,
  },
  {
    key: 'z_score',
    label: 'z-score',
    align: 'right',
    render: (row) => <span className="tnum">{formatNumber(row.z_score, 2)}</span>,
  },
  {
    key: 'is_alert',
    label: 'Status',
    render: (row) =>
      row.is_alert ? <StatusBadge label="Siaga" /> : <span className="text-text-2">—</span>,
  },
]

export default function Tactical() {
  const [searchParams, setSearchParams] = useSearchParams()

  const bulan = searchParams.get('bulan') || DEFAULT_MONTH
  const prov = searchParams.get('prov') || NATIONAL
  const mag = searchParams.get('mag') ? searchParams.get('mag').split(',') : MAG_CLASSES
  const dalam = searchParams.get('dalam') ? searchParams.get('dalam').split(',') : DEPTH_CLASSES

  /* PRD §8: p_month bertipe date (YYYY-MM-01), p_province null artinya nasional. */
  const pMonth = `${bulan}-01`
  const pProvince = prov === NATIONAL ? null : prov

  const series = useRpc('tactical_series', {
    p_month: pMonth,
    p_province: pProvince,
    p_mag: mag,
    p_depth: dalam,
  })
  const ranking = useRpc('tactical_ranking', { p_month: pMonth, p_mag: mag, p_depth: dalam })
  const distribution = useRpc('tactical_distribution', {
    p_month: pMonth,
    p_province: pProvince,
    p_mag: mag,
    p_depth: dalam,
  })

  const updateParams = (partial) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(partial)) {
      if (key === 'mag' || key === 'dalam') {
        const all = key === 'mag' ? MAG_CLASSES : DEPTH_CLASSES
        if (value.length === 0 || value.length === all.length) next.delete(key)
        else next.set(key, value.join(','))
      } else if (key === 'bulan') {
        if (value === DEFAULT_MONTH) next.delete(key)
        else next.set(key, value)
      } else if (key === 'prov') {
        if (value === NATIONAL) next.delete(key)
        else next.set(key, value)
      }
    }
    setSearchParams(next, { replace: true })
  }

  const seriesRows = series.data ?? []
  const rankingRows = ranking.data ?? []
  const current = seriesRows.length > 0 ? seriesRows[seriesRows.length - 1] : null
  const delta = current && current.baseline ? ((current.quakes - current.baseline) / current.baseline) * 100 : null
  const topProvince = rankingRows[0]?.province ?? '—'
  const alertRows = rankingRows.filter((row) => row.is_alert)

  const magnitudeRows = useMemo(
    () => (distribution.data ?? []).filter((row) => row.dimension === 'magnitude'),
    [distribution.data],
  )
  const depthRows = useMemo(
    () => (distribution.data ?? []).filter((row) => row.dimension === 'depth'),
    [distribution.data],
  )

  const provinceOptions = rankingRows.map((row) => row.province)

  const fields = [
    { key: 'bulan', label: 'Bulan', type: 'select', options: MONTH_OPTIONS },
    {
      key: 'prov',
      label: 'Provinsi',
      type: 'select',
      options: [
        { value: NATIONAL, label: 'Nasional' },
        ...provinceOptions.map((name) => ({ value: name, label: name })),
      ],
    },
    { key: 'mag', label: 'Kelas magnitudo', type: 'chips', options: MAG_CLASSES },
    { key: 'dalam', label: 'Kelas kedalaman', type: 'chips', options: DEPTH_CLASSES },
  ]

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-text-2">
            <Layers size={14} strokeWidth={1.75} aria-hidden="true" />
            SiagaGempa · Jendela bulan
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-xl font-semibold text-text-1">Dashboard Taktis</h1>
          </div>
        </div>
        <span className="text-xs text-text-2">
          {formatMonth(bulan)} · {prov}
        </span>
      </div>

      <FilterBar fields={fields} value={{ bulan, prov, mag, dalam }} onChange={updateParams} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Gempa bulan terpilih"
          value={current ? formatNumber(current.quakes) : ''}
          unit="gempa"
          delta={delta != null ? formatPercent(delta, 1) : undefined}
          caption={`Nasional/terfilter · ${formatMonth(bulan)}`}
          icon={Activity}
          query={series}
        />
        <KpiCard
          label="Provinsi teratas"
          value={topProvince}
          compact
          caption="Jumlah gempa terbanyak pada bulan terpilih"
          tone="neutral"
          icon={MapPin}
          query={ranking}
        />
        <KpiCard
          label="Wilayah siaga"
          value={rankingRows.length > 0 ? formatNumber(alertRows.length) : ''}
          unit="provinsi"
          tone="warn"
          caption="z-score > 1, minimal 5 tahun pembanding, gempa ≥ 3"
          icon={BellRing}
          query={ranking}
        />
      </section>

      <ChartCard
        title="Jumlah gempa 12 bulan"
        caption="Batang: jumlah gempa per bulan. Garis putus-putus: baseline bulan yang sama pada tahun sebelumnya."
        query={series}
        skeleton={<ChartSkeleton height={300} bars={12} withLegend />}
      >
        <SeriesChart
          data={seriesRows}
          xKey="month"
          formatX={formatMonthShort}
          ariaLabel="Grafik batang jumlah gempa 12 bulan dengan garis baseline"
          series={[
            { key: 'quakes', label: 'Jumlah gempa', type: 'bar', color: PALETTE.brand700 },
            {
              key: 'baseline',
              label: 'Baseline',
              type: 'line',
              color: PALETTE.text2,
              dashed: true,
            },
          ]}
        />
      </ChartCard>

      <section className="grid gap-4 md:gap-6 xl:grid-cols-12">
        <ChartCard
          className="xl:col-span-7"
          title="Peringkat provinsi"
          caption="Semua 38 provinsi, termasuk yang bernilai 0. z-score membandingkan jumlah bulan ini dengan rata-rata tahun sebelumnya."
          query={ranking}
        >
          <DataTable columns={rankingColumns} rows={rankingRows} rowKey={(row) => row.province} maxHeight="360px" />
        </ChartCard>

        <ChartCard
          className="xl:col-span-5"
          title="Wilayah siaga"
          caption="Provinsi dengan z-score > 1 dan jumlah gempa ≥ 3."
          query={ranking}
          isEmpty={alertRows.length === 0}
          empty="Tidak ada wilayah siaga pada bulan ini."
        >
          <ul className="flex flex-col gap-2">
            {alertRows.map((row) => (
              <li
                key={row.province}
                className="rounded-control border border-slate-200 bg-white/70 p-3 transition-colors hover:border-brand-300"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-text-1">{row.province}</span>
                  <StatusBadge label="Siaga" />
                </div>
                <p className="mt-1 text-xs text-text-2">
                  Jumlah {formatNumber(row.quakes)} vs rata-rata {formatNumber(row.baseline, 1)} (z ={' '}
                  {formatNumber(row.z_score, 2)})
                </p>
              </li>
            ))}
          </ul>
        </ChartCard>
      </section>

      <section className="grid gap-4 md:gap-6 md:grid-cols-2">
        <ChartCard
          title="Sebaran magnitudo"
          caption="Jumlah gempa per kelas magnitudo pada bulan terpilih."
          query={distribution}
          skeleton={<ChartSkeleton height={240} bars={4} withLegend />}
        >
          <SeriesChart
            data={magnitudeRows}
            xKey="bucket"
            height={240}
            ariaLabel="Histogram sebaran magnitudo"
            series={[{ key: 'quakes', label: 'Jumlah', type: 'bar', color: PALETTE.brand500 }]}
          />
        </ChartCard>

        <ChartCard
          title="Sebaran kedalaman"
          caption="Jumlah gempa per kelas kedalaman pada bulan terpilih."
          query={distribution}
          skeleton={<ChartSkeleton height={240} bars={4} withLegend />}
        >
          <SeriesChart
            data={depthRows}
            xKey="bucket"
            height={240}
            ariaLabel="Histogram sebaran kedalaman"
            series={[{ key: 'quakes', label: 'Jumlah', type: 'bar', color: PALETTE.brand500 }]}
          />
        </ChartCard>
      </section>

      <p className="text-xs text-text-2">
        Keterangan: data historis USGS 2010-2025. Baseline = rata-rata bulan yang sama pada
        tahun-tahun sebelumnya.
      </p>
    </div>
  )
}
