// Edge Function ingest-bmkg (PRD §6.3, §7.6).
// Dipanggil pg_cron tiap 5 menit; token JWT kosong dilewati (--no-verify-jwt)
// dan diganti cek secret header x-cron-secret.
// Deploy: supabase functions deploy ingest-bmkg --no-verify-jwt
// Secret: supabase secrets set CRON_SECRET=<nilai sama dengan cron_secret Vault>
#!/usr/bin/env -S deno run --allow-net --allow-env
import { collectItems, mergeByKey, normalize } from './lib.ts'

const SUPABASE_URL = (Deno.env.get('SUPABASE_URL') ?? '').replace(/\/$/, '')
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? ''

const FEEDS = [
  'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json',
  'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json',
  'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json',
]

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
    body: JSON.stringify(rows),
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`ingest_quakes → HTTP ${response.status}: ${text}`)
  return Number(text) || 0
}

Deno.serve({ port: 8787 }, async (request) => {
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
