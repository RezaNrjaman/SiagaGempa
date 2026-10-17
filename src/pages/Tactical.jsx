import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layers, Activity, MapPin, BellRing, PieChart } from 'lucide-react'
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
    key: 'delta',
    label: 'Δ',
    align: 'right',
    render: (row) => {
      if (!row.baseline) return <span className="text-text-2">—</span>
      const pct = ((row.quakes - row.baseline) / row.baseline) * 100
      const tone = pct > 0 ? 'text-warn' : pct < 0 ? 'text-ok' : 'text-text-2'
      return (
        <span className={`tnum ${tone}`}>
          {formatPercent(pct, 1)}
        </span>
      )
    },
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
  const contrib = useRpc('tactical_contrib', {
    p_month: pMonth,
    p_mag: mag,
    p_depth: dalam,
    p_provinces: 8,
  })
  const alertHistory = useRpc('tactical_alert_history', null)

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
  const contribRows = contrib.data ?? []
  const alertRows = alertHistory.data ?? []
  const current = seriesRows.length > 0 ? seriesRows[seriesRows.length - 1] : null
  const delta = current && current.baseline ? ((current.quakes - current.baseline) / current.baseline) * 100 : null
  const topProvince = rankingRows[0]?.province ?? '—'
  const provinceAlertRows = rankingRows.filter((row) => row.is_alert)

  /* Share lima provinsi teratas dari total gempa bulan terpilih (semua provinsi). */
  const totalQuakes = rankingRows.reduce((sum, row) => sum + Number(row.quakes), 0)
  const top5Quakes = rankingRows.slice(0, 5).reduce((sum, row) => sum + Number(row.quakes), 0)
  const top5Share = totalQuakes > 0 ? (top5Quakes / totalQuakes) * 100 : null

  /* Flat provinsi x kelas magnitudo -> satu baris per provinsi (untuk tumpuk). */
  const contribData = useMemo(() => {
    const byProvince = new Map()
    for (const row of contribRows) {
      if (!byProvince.has(row.province)) byProvince.set(row.province, { province: row.province })
      byProvince.get(row.province)[row.bucket] = row.quakes
    }
    return [...byProvince.values()]
  }, [contribRows])

  /* Riwayat siaga per bulan (sudah urut desc dari RPC). */
  const alertByMonth = useMemo(() => {
    const byMonth = new Map()
    for (const row of alertRows) {
      if (!byMonth.has(row.month)) byMonth.set(row.month, [])
      byMonth.get(row.month).push(row)
    }
    return [...byMonth.entries()]
  }, [alertRows])

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
          value={rankingRows.length > 0 ? formatNumber(provinceAlertRows.length) : ''}
          unit="provinsi"
          tone="warn"
          caption="z-score > 1, minimal 5 tahun pembanding, gempa ≥ 3"
          icon={BellRing}
          query={ranking}
        />
        <KpiCard
          label="Kontribusi 5 besar"
          value={top5Share != null ? formatNumber(top5Share, 1) : ''}
          unit="%"
          tone="neutral"
          caption="Pangsa lima provinsi atas dari total gempa bulan ini"
          icon={PieChart}
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
          title="Wilayah siaga bulan ini"
          caption="Provinsi dengan z-score > 1 dan jumlah gempa ≥ 3."
          query={ranking}
          isEmpty={provinceAlertRows.length === 0}
          empty="Tidak ada wilayah siaga pada bulan ini."
        >
          <ul className="flex flex-col gap-2">
            {provinceAlertRows.map((row) => (
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

      <ChartCard
        title="Kontribusi provinsi teratas"
        caption="Delapan provinsi dengan gempa terbanyak pada bulan terpilih, dipecah per kelas magnitudo (mengikuti filter kelas)."
        query={contrib}
        isEmpty={contribData.length === 0}
        empty="Tidak ada kontribusi pada rentang dan filter ini."
        skeleton={<ChartSkeleton height={280} bars={8} withLegend />}
      >
        <SeriesChart
          data={contribData}
          yKey="province"
          height={280}
          layout="vertical"
          ariaLabel="Grafik batang horizontal kontribusi provinsi per kelas magnitudo"
          series={[
            { key: '4.0-4.9', label: 'M 4.0-4.9', type: 'bar', color: '#a5b4fc', stackId: 'm' },
            { key: '5.0-5.9', label: 'M 5.0-5.9', type: 'bar', color: '#6366f1', stackId: 'm' },
            { key: '6.0-6.9', label: 'M 6.0-6.9', type: 'bar', color: '#4338ca', stackId: 'm' },
            { key: '7.0+', label: 'M 7.0+', type: 'bar', color: '#312e81', stackId: 'm' },
          ]}
        />
      </ChartCard>

      <ChartCard
        title="Riwayat wilayah siaga"
        caption="Bulan-bulan ketika sebuah provinsi melampaui ambang (z > 1, gempa ≥ 3, minimal 5 tahun pembanding) dalam 24 bulan terakhir katalog."
        query={alertHistory}
        isEmpty={alertByMonth.length === 0}
        empty="Tidak ada wilayah siaga dalam 24 bulan terakhir katalog."
        skeleton={<div className="skeleton h-[180px] w-full rounded-control" aria-hidden="true" />}
      >
        <ol className="flex flex-col gap-2">
          {alertByMonth.map(([month, rows]) => (
            <li
              key={month}
              className="rise-in flex flex-wrap items-center gap-2 rounded-control border border-slate-200 bg-white/70 p-3"
            >
              <span className="tnum rounded-full border border-brand-500/30 bg-brand-500/10 px-2 py-0.5 text-xs font-semibold text-brand-700">
                {formatMonth(month.slice(0, 7))}
              </span>
              {rows.map((row) => (
                <span
                  key={row.province}
                  className="inline-flex items-center gap-1.5 rounded-control border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
                >
                  <StatusBadge label="Siaga" tone="warn" /> {row.province}
                  <span className="tnum text-text-2">
                    {formatNumber(row.quakes)} vs {formatNumber(row.baseline, 1)} (z{' '}
                    {formatNumber(row.z_score, 1)})
                  </span>
                </span>
              ))}
            </li>
          ))}
        </ol>
      </ChartCard>

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
