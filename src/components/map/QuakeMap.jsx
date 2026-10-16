import 'leaflet/dist/leaflet.css'
import { CircleMarker, GeoJSON, MapContainer, Rectangle } from 'react-leaflet'
import provinces from '@/data/provinces.json'
import { PALETTE, heatColor, magColor } from '@/lib/palette'

const BOUNDS = [
  [-11.5, 94],
  [6.5, 142],
]

/*
 * isolation: isolate membatasi z-index panes Leaflet di dalam kontainernya
 * sendiri, sehingga legenda dan header tidak pernah tumpang tindih.
 */
const MAP_CLASS =
  'sg-map relative h-[320px] w-full overflow-hidden rounded-control border border-white/10 bg-brand-950/60 [isolation:isolate] md:h-[420px]'

const OUTLINE_STYLE = {
  color: 'rgba(255, 255, 255, 0.12)',
  weight: 1,
  fillColor: PALETTE.brand700,
  fillOpacity: 0.12,
}

function PointsLegend() {
  const items = [
    { label: 'M ≥ 6', color: PALETTE.danger },
    { label: 'M 5–5.9', color: PALETTE.warn },
    { label: 'M < 5', color: PALETTE.brand300 },
  ]
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-[10] rounded-control border border-white/15 bg-brand-900/90 px-3 py-2">
      <p className="mb-1 text-xs font-medium text-text-1">Kelas magnitudo</p>
      {items.map((item) => (
        <p key={item.label} className="flex items-center gap-2 text-xs text-text-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </p>
      ))}
    </div>
  )
}

function GridLegend({ min, max }) {
  const gradient = `linear-gradient(90deg, ${heatColor(min, min, max)}, ${heatColor(max, min, max)})`
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-[10] rounded-control border border-white/15 bg-brand-900/90 px-3 py-2">
      <p className="mb-1 text-xs font-medium text-text-1">Jumlah gempa per sel 0,5°</p>
      <div className="h-2 w-32 rounded-full" style={{ background: gradient }} aria-hidden="true" />
      <div className="mt-0.5 flex justify-between text-[10px] text-text-2">
        <span className="tnum">{min}</span>
        <span className="tnum">{max}</span>
      </div>
    </div>
  )
}

function PointsMap({ data, selectedId, onSelect }) {
  return (
    <div className={MAP_CLASS}>
      <MapContainer
        bounds={BOUNDS}
        boundsOptions={{ padding: [8, 8] }}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
      >
        <GeoJSON data={provinces} style={OUTLINE_STYLE} />
        {data.map((quake) => {
          const isSelected = quake.id === selectedId
          return (
            <CircleMarker
              key={quake.id}
              center={[quake.lat, quake.lon]}
              radius={3 + quake.magnitude * 1.1 + (isSelected ? 3 : 0)}
              eventHandlers={onSelect ? { click: () => onSelect(quake.id) } : undefined}
              pathOptions={{
                color: isSelected ? PALETTE.text1 : magColor(quake.magnitude),
                fillColor: magColor(quake.magnitude),
                fillOpacity: isSelected ? 0.9 : 0.7,
                weight: isSelected ? 2.5 : 1.5,
              }}
            />
          )
        })}
      </MapContainer>
      <PointsLegend />
    </div>
  )
}

function GridMap({ data }) {
  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${MAP_CLASS}`}>
        <p className="text-sm text-text-2">Tidak ada sebaran pada rentang ini.</p>
      </div>
    )
  }
  const counts = data.map((cell) => cell.quakes)
  const min = Math.min(...counts)
  const max = Math.max(...counts)
  return (
    <div className={MAP_CLASS}>
      <MapContainer
        bounds={BOUNDS}
        boundsOptions={{ padding: [8, 8] }}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
      >
        <GeoJSON data={provinces} style={OUTLINE_STYLE} />
        {data.map((cell) => (
          <Rectangle
            key={`${cell.cell_lat},${cell.cell_lon}`}
            bounds={[
              [cell.cell_lat, cell.cell_lon],
              [cell.cell_lat + 0.5, cell.cell_lon + 0.5],
            ]}
            pathOptions={{
              color: 'transparent',
              fillColor: heatColor(cell.quakes, min, max),
              fillOpacity: 0.85,
            }}
          />
        ))}
      </MapContainer>
      <GridLegend min={min} max={max} />
    </div>
  )
}

/* mode 'points' untuk operasional, 'grid' untuk strategis (PRD 10.5). */
export default function QuakeMap({ mode = 'points', data = [], selectedId, onSelect }) {
  if (mode === 'grid') return <GridMap data={data} />
  return <PointsMap data={data} selectedId={selectedId} onSelect={onSelect} />
}
