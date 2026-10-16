// =============================================================================
// SiagaGempa — Edge Function `ingest-bmkg` (PRD §6.3, §7.6) — VERSI SATU FILE
//
// Dipakai kalau Supabase CLI tidak tersedia: seluruh isi index.ts + lib.ts
// digabung di sini agar bisa langsung di-paste di Dashboard → Edge Functions.
//
// Cara deploy:
//   1. Supabase Dashboard → Edge Functions → Deploy a new function → Via Editor
//   2. Nama fungsi: ingest-bmkg
//   3. Hapus isi contoh, paste SELURUH berkas ini, lalu Deploy
//   4. Matikan "Enforce JWT verification" (kita memakai header x-cron-secret)
//   5. Edge Functions → Secrets → tambah CRON_SECRET=<nilai acak panjang>
//      (harus SAMA dengan secret 'cron_secret' di Vault, lihat 0006_cron.sql)
//
// Versi multi-file (index.ts + lib.ts) tetap sumber utama untuk CLI/Deno test.
// =============================================================================

const SUPABASE_URL = (Deno.env.get('SUPABASE_URL') ?? '').replace(/\/$/, '')
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? ''

const FEEDS = [
  'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json',
  'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json',
  'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json',
]

/* ------------------------------- lib.ts ---------------------------------- */

const TSUNAMI_RE = /berpotensi\s+tsunami/i
const NOT_TSUNAMI_RE = /tidak\s+berpotensi/i

function normalize(item) {
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

function rowKey(row) {
  return `${row.event_time}|${row.lat}|${row.lon}`
}

function mergeByKey(rows) {
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

function collectItems(payload) {
  const root = payload?.Infogempa
  if (!root) return []
  return [
    ...(Array.isArray(root.gempa) ? root.gempa : root.gempa ? [root.gempa] : []),
    ...(Array.isArray(root.gempaterkini) ? root.gempaterkini : []),
    ...(Array.isArray(root.gempadirasakan) ? root.gempadirasakan : []),
  ]
}

/* ------------------------------- index.ts -------------------------------- */

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function fetchFeed(url) {
  const response = await fetch(url, { cache: 'no-cache' })
  if (!response.ok) throw new Error(`${url} → HTTP ${response.status}`)
  return response.json()
}

async function ingest(rows) {
  if (rows.length === 0) return 0
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/ingest_quakes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
    },
    // PRD §7.2: fungsi bernama ingest_quakes(p_rows jsonb) → wajib objek p_rows.
    body: JSON.stringify({ p_rows: rows }),
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`ingest_quakes → HTTP ${response.status}: ${text}`)
  return Number(text) || 0
}

Deno.serve(async (request) => {
  if (new URL(request.url).pathname.endsWith('/healthz')) {
    return json(200, { ok: true })
  }

  // Cron adalah caller satu-satunya: wajib membawa secret yang sama dgn Vault.
  if (CRON_SECRET === '' || request.headers.get('x-cron-secret') !== CRON_SECRET) {
    return json(401, { ok: false, error: 'unauthorized' })
  }

  try {
    const payloads = await Promise.all(FEEDS.map(fetchFeed))
    const normalized = payloads.flatMap((payload) => collectItems(payload).map(normalize).filter(Boolean))
    const merged = mergeByKey(normalized)
    const inserted = await ingest(merged)
    return json(200, { ok: true, received: normalized.length, batch: merged.length, inserted })
  } catch (error) {
    return json(500, { ok: false, error: String(error) })
  }
})
