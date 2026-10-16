import { useState } from 'react'
import { Activity } from 'lucide-react'
import ChartCard from '@/components/ui/ChartCard'
import DataTable from '@/components/ui/DataTable'
import KpiCard from '@/components/ui/KpiCard'
import StatusBadge from '@/components/ui/StatusBadge'
import QuakeMap from '@/components/map/QuakeMap'
import { TONE } from '@/config'
import { useRpc } from '@/hooks/useRpc'
import {
  formatMagnitude,
  formatNumber,
  formatRelative,
  formatTimeWIB,
} from '@/lib/format'

const columns = [
  {
    key: 'event_time',
    label: 'Waktu WIB',
    render: (row) => <span className="tnum">{formatTimeWIB(row.event_time)}</span>,
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
  {
    key: 'felt_info',
    label: 'Dirasakan',
    render: (row) => (row.felt_info ? row.felt_info : <span className="text-text-2">—</span>),
  },
  {
    key: 'tsunami_potential',
    label: 'Tsunami',
    render: (row) =>
      row.tsunami_potential ? (
        <StatusBadge label="Berpotensi" />
      ) : (
        <span className="text-text-2">—</span>
      ),
  },
]

export default function Operational() {
  const [selectedId, setSelectedId] = useState(null)
  const summary = useRpc('ops_summary', null, 'live')
  const latest = useRpc('ops_latest', { limit: 15 }, 'live')

  const data = summary.data
  const rows = latest.data ?? []
  const hasLatest = rows.length > 0

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-text-2">
            <Activity size={14} strokeWidth={1.75} aria-hidden="true" />
            SiagaGempa · Jendela jam dan hari
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-xl font-semibold text-text-1">Dashboard Operasional</h1>
            <StatusBadge label={data ? data.alert_level : 'Memuat'} />
          </div>
        </div>
        <span className="tnum text-xs text-text-2">
          Diperbarui {data ? `${formatTimeWIB(data.updated_at)} WIB` : '—'}
        </span>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Gempa terbaru"
          value={data ? formatMagnitude(data.latest_mag) : ''}
          unit="M"
          caption={data ? `${data.latest_place} · ${formatRelative(data.latest_time)}` : ''}
          tone="neutral"
          query={summary}
        />
        <KpiCard
          label="Gempa 24 jam"
          value={data ? formatNumber(data.quakes_24h) : ''}
          unit="gempa"
          caption="Feed BMKG live, 24 jam terakhir"
          tone="neutral"
          query={summary}
        />
        <KpiCard
          label="Magnitudo tertinggi hari ini"
          value={data ? formatMagnitude(data.max_mag_today) : ''}
          unit="M"
          caption="Maksimum pada tanggal WIB hari ini"
          tone={data && data.max_mag_today >= 6 ? 'danger' : 'warn'}
          query={summary}
        />
        <KpiCard
          label="Status tsunami"
          value={data ? data.tsunami_status : ''}
          caption="Gempa berpotensi tsunami dalam 24 jam"
          tone={data ? (TONE[data.tsunami_status] ?? 'neutral') : 'neutral'}
          query={summary}
        />
      </section>

      <section className="grid gap-4 md:gap-6 xl:grid-cols-12">
        <ChartCard
          className="xl:col-span-5"
          title="Peta gempa terkini"
          caption="Radius titik sebanding magnitudo. Warna: M < 5 biru, 5–5.9 kuning, ≥ 6 merah. Peta vektor tanpa tile."
          query={latest}
          skeleton={
            <div
              className="h-[320px] w-full animate-pulse rounded-control border border-white/10 bg-white/5 md:h-[420px]"
              aria-hidden="true"
            />
          }
        >
          <QuakeMap
            mode="points"
            data={rows}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
          />
        </ChartCard>

        <ChartCard
          className="xl:col-span-7"
          title="15 gempa terakhir"
          caption="Sumber: BMKG. Klik baris untuk menyorot titik di peta."
          query={latest}
          isEmpty={!hasLatest}
          empty="Belum ada gempa tercatat dalam 24 jam terakhir."
        >
          <DataTable
            columns={columns}
            rows={rows}
            selectedId={selectedId}
            onRowClick={(row) => setSelectedId((prev) => (prev === row.id ? null : row.id))}
          />
        </ChartCard>
      </section>

      <p className="text-xs text-text-2">
        Keterangan: feed BMKG berisi gempa M ≥ 5 atau yang dirasakan.
      </p>
    </div>
  )
}
