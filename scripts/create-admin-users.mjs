/*
 * Membuat tiga akun admin lewat Admin Auth API Supabase (perbaiki masalah
 * constraint auth.identities yang tidak bisa di-insert via SQL langsung).
 * Butuh di .env.local: VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * Jalankan: npm run create:admins
 */
import fs from 'node:fs'

const envRaw = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : ''
const env = Object.fromEntries(
  envRaw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const index = line.indexOf('=')
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
    }),
)

const url = (env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')
const key = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Isi VITE_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local dulu.')
  process.exit(1)
}

const PASSWORDS = { admin1: 'admin1', admin2: 'admin2', admin3: 'admin3' }
const ROLES = { admin1: 'operational', admin2: 'tactical', admin3: 'strategic' }

async function rest(path, body) {
  const response = await fetch(`${url}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(`${path} → HTTP ${response.status}: ${JSON.stringify(data)}`)
  return data
}

for (const [username, password] of Object.entries(PASSWORDS)) {
  const email = `${username}@siagagempa.app`
  /* Upsert user (create kalau belum ada; error karena duplikat email diabaikan). */
  try {
    const user = await rest('/auth/v1/admin/users', { email, password, email_confirm: true })
    console.log(`✔ user ${email} (id ${user.id ?? '?'}) dibuat/baik-baik.`)

    try {
      await rest('/rest/v1/profiles', { id: user.id, username, role: ROLES[username] })
    } catch (profileError) {
      /* 409: profil sudah ada → perbarui saja. */
      const response = await fetch(`${url}/rest/v1/profiles?id=eq.${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: `Bearer ${key}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ username, role: ROLES[username] }),
      })
      if (!response.ok) throw profileError
    }
    console.log(`  profil terpasang: ${username} → ${ROLES[username]}`)
  } catch (error) {
    console.error(String(error))
    process.exit(1)
  }
}

/* Verifikasi kecil: daftar user via Auth API. */
const list = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=50`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
}).then((r) => r.json())
console.log(`Total user sekarang: ${list.users?.length ?? 0}`)
for (const user of list.users ?? []) console.log(` - ${user.email} (confirmed: ${!!user.email_confirmed_at})`)
