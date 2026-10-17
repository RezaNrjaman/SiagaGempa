# SiagaGempa

Dashboard mitigasi dan respons gempa untuk BPBD: satu situs, tiga dashboard berbasis peran
(operasional, taktis, strategis). Lihat `prd.md` untuk spesifikasi dan `desain.md` untuk panduan
visual.

> **Status saat ini: fase tampilan (UI) dengan data dummy.** Belum tersambung ke Supabase.
> Seluruh keluaran RPC diambil dari `src/data/dummy.js` dengan bentuk yang sama seperti kontrak di
> `prd.md` bagian 8, sehingga penggantian ke backend tidak mengubah komponen.

## Menjalankan

```bash
npm install
npm run dev          # http://localhost:5173
```

Akun demo (fase dummy):

| Username | Role | Dashboard |
|---|---|---|
| `admin1` | operational | `/operational` |
| `admin2` | tactical | `/tactical` |
| `admin3` | strategic | `/strategic` |

Password ketiganya: `siagagempa123`.

## Skrip

| Skrip | Kegunaan |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | `lint` lalu `vite build` |
| `npm run preview` | Pratinjau hasil build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run gen:provinces` | Generator data provinsi |
| `npm run create:admins` | Membuat tiga akun admin di Supabase |

## Ganti ke backend nyata

1. Isi `.env` dari `.env.example` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_AUTH_DOMAIN`).
2. Ganti isi `signIn`/`getSession`/`signOut` di `src/lib/auth.js` dengan Supabase Auth
   (adapter `sessionStorage`, bukan `localStorage`).
3. Ganti isi `src/lib/rpc.js` agar memanggil `supabase.rpc(name, params)`.
4. Hapus `src/data/dummy.js` bila sudah tidak dipakai.

### Backend SQL (sudah disiapkan, `supabase/`)

Migrasi dijalankan berurutan via SQL Editor atau `supabase db push` (PRD §15):

1. `migrations/0001_schema.sql` — PostGIS, tabel `provinces`/`earthquakes`/`profiles`,
   fungsi `assert_role`, `norm01`, trigger `set_province`.
2. `migrations/0002_functions.sql` — `ingest_quakes` & `ingest_provinces` (service_role).
3. `migrations/0003_views.sql` — materialized view `mv_quake_cube` & `mv_heat_grid`.
4. `migrations/0004_rpc.sql` — 9 RPC dasbor sesuai kontrak §8 (semua memanggil `assert_role`).
5. `migrations/0005_protection.sql` — RLS, revoke/grant (PRD §7.4).
6. `migrations/0006_cron.sql` — cron ingest 5 menit + purge 30 hari (perlu pg_cron/pg_net + Vault).
7. `migrations/0007_pgtap.sql` — uji pgTAP (PRD §16.1).
8. `seed/profiles.sql` — isi `profiles` setelah 3 user Auth dibuat (PRD §7.5).
9. `npm run gen:provinces`, lalu jalankan `supabase/seed/provinces.sql` di SQL Editor
   — seed geometri 38 provinsi (PRD §6.3). Verifikasi `select count(*) from provinces` = 38.
10. `supabase/seed/usgs.sql` — import historis USGS (prasyarat: staging `usgs_staging`
   sudah berisi CSV USGS lewat Table Editor; PRD §6.3). Lalu refresh kedua materialized view.

Komponen, halaman, dan hook tidak perlu diubah karena hanya bergantung pada `lib/rpc.js`,
`hooks/useRpc.js`, dan `lib/auth.js`.

## Struktur

```
src/
├─ main.jsx            # provider Query + Auth + Router
├─ App.jsx             # rute + lazy loading per halaman
├─ config.js           # ROLES, TONE, CACHE, MAG_CLASSES, DEPTH_CLASSES, DATA_RANGE
├─ styles/             # tokens.css, glass.css, base.css
├─ data/               # dummy.js (kontrak RPC), provinces.json (vektor 38 provinsi)
├─ lib/                # supabase (belum), rpc.js, queryClient.js, format.js, auth.js, palette.js
├─ context/AuthContext.jsx
├─ hooks/useRpc.js
├─ components/
│  ├─ ui/              # GlassPanel, KpiCard, ChartCard, DataTable, FilterBar, StatusBadge, QueryState
│  ├─ charts/SeriesChart.jsx
│  ├─ map/QuakeMap.jsx
│  └─ layout/          # AppShell, ProtectedRoute, Wordmark
└─ pages/              # Login, Operational, Tactical, Strategic, Forbidden, NotFound
```

## Catatan fase dummy

- Peta memakai GeoJSON 38 provinsi (`src/data/provinces.json`, dari GADM level-1 + pemekaran
  Papua sebagai potongan garis lurus, disederhanakan 0,05°). Geometri provinsi pemekaran Papua
  adalah aproksimasi, bukan batas resmi.
- Autentikasi disimulasikan di klien. Sesi disimpan di `sessionStorage`.
- Foto visual halaman login dihilangkan atas keputusan pemilik (halaman login tanpa foto).
