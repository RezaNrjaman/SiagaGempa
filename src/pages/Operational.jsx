import { useState } from 'react'
import { Activity, Radio, Waves, Zap } from 'lucide-react'
import ChartCard from '@/components/ui/ChartCard'
import DataTable from '@/components/ui/DataTable'
import GlassPanel from '@/components/ui/GlassPanel'
import KpiCard from '@/components/ui/KpiCard'
import StatusBadge from '@/components/ui/StatusBadge'
import QuakeMap from '@/components/map/QuakeMap'
import { TONE } from '@/config'
import { useRpc } from '@/hooks/useRpc'
import {
  formatDateWIB,
  formatMagnitude,
  formatNumber,
  formatRelative,
  formatTimeWIB,
} from '@/lib/format'

const columns = [
  {
    key: 'event_date',
    label: 'Tanggal',
    render: (row) => <span className="tnum">{formatDateWIB(row.event_time)}</span>,
  },
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
  const latest = useRpc('ops_latest', { p_limit: 15 }, 'live')

  /* Semua RPC `returns table(...)` -> PostgREST selalu mengirim larik baris.
     ops_summary mengembalikan tepat satu baris, jadi harus dibuka di sini;
     memakainya langsung sebagai objek membuat semua KPI kosong. */
  const data = Array.isArray(summary.data) ? (summary.data[0] ?? null) : summary.data
  const rows = latest.data ?? []
  const hasLatest = rows.length > 0

  /* OPS-08: tanpa baris ringkasan berarti tidak ada gempa 24 jam -> level
     Hijau, bukan "Memuat" yang menggantung. */
  const summarySettled = !summary.isPending && !summary.isError
  const summaryEmpty = summarySettled && !data
  const alertLevel = data ? data.alert_level : summarySettled ? 'Hijau' : 'Memuat'

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
            <StatusBadge label={alertLevel} />
          </div>
        </div>
        <span className="tnum inline-flex items-center gap-2 text-xs text-text-2">
          <span
            className={`ping-dot ${data ? 'text-emerald-500' : 'text-slate-400'}`}
            aria-hidden="true"
          >
            <span className={`block h-1.5 w-1.5 rounded-full ${data ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          </span>
          Diperbarui {data ? `${formatTimeWIB(data.updated_at)} WIB` : '—'}
        </span>
      </div>

      {/* OPS-08: kondisi kosong Replacing KPI agar tidak tampil kartu kosong. */}
      {summaryEmpty ? (
        <GlassPanel className="flex flex-col items-start gap-2 px-6 py-8 md:px-8">
          <p className="text-sm font-medium text-text-1">
            Belum ada gempa tercatat dalam 24 jam terakhir.
          </p>
          <p className="text-xs text-text-2">
            Level siaga <span className="text-text-1">Hijau</span>. Halaman ini diperbarui
            otomatis tiap 5 menit; data terbaru akan muncul begitu feed BMKG mengirim
            gempa berikutnya.
          </p>
        </GlassPanel>
      ) : null}

      <section
        className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4${summaryEmpty ? ' hidden' : ''}`}
      >
        <KpiCard
          label="Gempa terbaru"
          value={data ? formatMagnitude(data.latest_mag) : ''}
          unit="M"
          caption={data ? `${data.latest_place} · ${formatRelative(data.latest_time)}` : ''}
          tone="neutral"
          icon={Zap}
          query={summary}
        />
        <KpiCard
          label="Gempa 24 jam"
          value={data ? formatNumber(data.quakes_24h) : ''}
          unit="gempa"
          caption="Feed BMKG live, 24 jam terakhir"
          tone="neutral"
          icon={Activity}
          query={summary}
        />
        <KpiCard
          label="Magnitudo tertinggi hari ini"
          value={data ? formatMagnitude(data.max_mag_today) : ''}
          unit="M"
          caption="Maksimum pada tanggal WIB hari ini"
          tone={data && data.max_mag_today >= 6 ? 'danger' : 'warn'}
          icon={Radio}
          query={summary}
        />
        <KpiCard
          label="Status tsunami"
          value={data ? data.tsunami_status : ''}
          caption="Gempa berpotensi tsunami dalam 24 jam"
          tone={data ? (TONE[data.tsunami_status] ?? 'neutral') : 'neutral'}
          icon={Waves}
          query={summary}
        />
      </section>

      <section className="grid gap-4 md:gap-6 md:grid-cols-2">
        <ChartCard
          className="md:col-span-2"
          title="Peta gempa terkini"
          caption="Radius titik sebanding magnitudo. Warna: M < 5 biru, 5–5.9 kuning, ≥ 6 merah. Peta vektor tanpa tile."
          query={latest}
          skeleton={<div className="skeleton h-[320px] w-full rounded-control md:h-[420px]" aria-hidden="true" />}
        >
          <QuakeMap mode="points" data={rows} selectedId={selectedId} />
        </ChartCard>

        <ChartCard
          className="md:col-span-2"
          title="15 gempa terakhir"
          caption="Data terbaru dari feed BMKG live. Klik baris untuk menyorot titik di peta."
          query={latest}
          isEmpty={!hasLatest}
          empty="Belum ada data gempa terbaru."
        >
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => `${row.event_time}-${row.magnitude}`}
            onRowClick={(row) => setSelectedId(`${row.event_time}-${row.magnitude}`)}
            selectedId={selectedId}
            maxHeight="420px"
          />
        </ChartCard>
      </section>

      <p className="text-xs text-text-2">
        {/* OPS-07: keterangan permanen tentang cakupan feed. */}
        Feed BMKG berisi gempa M ≥ 5 atau yang dirasakan. Sumber: BMKG (live). Proyek
        akademik, bukan produk resmi BMKG.
      </p>
    </div>
  )
}
