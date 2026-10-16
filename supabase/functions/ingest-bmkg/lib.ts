/**
 * Menormalkan satu item feed BMKG menjadi baris `earthquakes` (PRD §6.2).
 * Baris dengan Magnitude/Kedalaman/Coordinates tidak valid dibuang (NOT NULL).
 * Dirasakan/Potensi hilang tetap dikirim: felt_info = null, tsunami = false.
 */
export const TSUNAMI_RE = /berpotensi\s+tsunami/i
export const NOT_TSUNAMI_RE = /tidak\s+berpotensi/i

export function normalize(item) {
  if (!item || typeof item !== 'object') return null

  const magnitude = parseFloat(item.Magnitude)
  if (!Number.isFinite(magnitude)) return null

  const depthKm = parseFloat(item.Kedalaman)
  if (!Number.isFinite(depthKm)) return null

  if (typeof item.Coordinates !== 'string' || !item.Coordinates.includes(',')) return null
  const [latText, lonText] = item.Coordinates.split(',')
  const lat = Number(latText?.trim())
  const lon = Number(lonText?.trim())
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

  const eventTime = new Date(item.DateTime)
  if (Number.isNaN(eventTime.getTime())) return null

  const potential = String(item.Potensi ?? '')
  return {
    event_time: eventTime.toISOString(),
    lat,
    lon,
    depth_km: depthKm,
    magnitude,
    location_text: item.Wilayah ?? null,
    felt_info: item.Dirasakan?.trim() ? item.Dirasakan.trim() : null,
    tsunami_potential: TSUNAMI_RE.test(potential) && !NOT_TSUNAMI_RE.test(potential),
    source: 'bmkg_live',
  }
}

export function rowKey(row) {
  return `${row.event_time}|${row.lat}|${row.lon}`
}

/**
 * Menggabungkan duplikat antar feed dalam satu batch (PRD §6.3).
 * Kunci event_time+lat+lon; felt_info non-null menang; tsunami_potential OR.
 */
export function mergeByKey(rows) {
  const byKey = new Map()
  for (const row of rows) {
    const key = rowKey(row)
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, row)
      continue
    }
    existing.felt_info = existing.felt_info ?? row.felt_info
    existing.tsunami_potential = existing.tsunami_potential || row.tsunami_potential
  }
  return [...byKey.values()]
}

/** Mengumpulkan item dari ketiga bentuk respons endpoint BMKG. */
export function collectItems(payload) {
  const root = payload?.Infogempa
  if (!root) return []
  return [
    ...(Array.isArray(root.gempa) ? root.gempa : root.gempa ? [root.gempa] : []),
    ...(Array.isArray(root.gempaterkini) ? root.gempaterkini : []),
    ...(Array.isArray(root.gempadirasakan) ? root.gempadirasakan : []),
  ]
}
