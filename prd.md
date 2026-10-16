# PRD SiagaGempa: Dashboard Mitigasi dan Respons Gempa

| | |
|---|---|
| Versi | 1.0 |
| Tanggal | 16 Oktober 2026 |
| Status | Final, siap dikerjakan |
| Stack | React (Vite) + Supabase (Postgres, Auth, Edge Function) + Vercel |

---

## 1. Ringkasan

SiagaGempa adalah satu website dengan tiga dashboard berbasis peran untuk pengambil keputusan kebencanaan (BPBD). Setiap peran melihat rentang waktu dan keputusan yang berbeda.

| Akun | Role | Dashboard | Rentang | Keputusan yang dibantu |
|---|---|---|---|---|
| `admin1` | `operational` | `/operational` | Jam dan hari | Siaga atau tidak, wilayah mana yang dihubungi dulu |
| `admin2` | `tactical` | `/tactical` | Bulan | Penempatan logistik dan jadwal simulasi evakuasi |
| `admin3` | `strategic` | `/strategic` | Tahun dan dekade | Prioritas anggaran mitigasi dan tata ruang |

**Tujuan produk:** satu sistem yang cepat, ringan, aman per peran, dan setiap angka di layar bisa dijelaskan (ada definisi dan sumbernya).

**Bukan tujuan:** prediksi gempa, notifikasi push, manajemen pengguna, peta dasar bergambar.

---

## 2. Ruang Lingkup

### Termasuk (v1.0)
- Login 3 akun tetap dan routing berbasis role
- Dashboard operasional (data live BMKG)
- Dashboard taktis (historis USGS 2010-2025, dengan filter)
- Dashboard strategis (historis USGS 2010-2025)
- Ingest otomatis BMKG tiap 5 menit
- Cache berlapis, aset gambar WebP, design system glassmorphism

### Di luar lingkup (tidak dibuat di v1.0)
- Registrasi, lupa password, kelola user, dan mode terang
- Pembaruan bulanan data USGS (data historis adalah snapshot statis 2010-2025, jadi bulan default dashboard taktis adalah Desember 2025)
- Ekspor PDF/CSV, notifikasi, multi bahasa, dan peta dasar (tile)
- Halaman pengaturan, profil, atau navigasi antar dashboard

---

## 3. Pengguna dan Hak Akses

- Tiap role hanya boleh membuka satu dashboard dan memanggil RPC miliknya.
- Hak akses ditegakkan di tiga lapis: (1) rute React, (2) fungsi RPC memanggil `assert_role`, (3) tabel mentah tertutup dengan RLS.
- Sign-up publik dimatikan. Ketiga user dibuat manual oleh pemilik proyek.

---

## 4. Keputusan Teknis (dikunci)

| Hal | Keputusan |
|---|---|
| Bahasa | JavaScript (ES modules) dengan ESLint + Prettier |
| UI | React 18, React Router, Tailwind CSS v4 (token lewat `@theme`) |
| Data fetching dan cache | TanStack Query + persist ke `sessionStorage` |
| Grafik | Recharts, hanya lewat satu komponen `SeriesChart` |
| Peta | Leaflet + react-leaflet, **vektor saja** (GeoJSON provinsi), tanpa tile |
| Ikon | `lucide-react` (impor per ikon) |
| Font | Inter variable, self-hosted lewat `@fontsource-variable/inter` |
| Data live | API BMKG: `autogempa.json`, `gempaterkini.json`, `gempadirasakan.json` |
| Data historis | USGS Earthquake Catalog, M ≥ 4.0, 2010-2025, bounding box Indonesia |
| Penggabungan sumber | Tidak digabung. Kolom `source` memisahkan `bmkg_live` dan `usgs` |
| Logika bisnis | Seluruhnya di SQL. UI hanya menampilkan hasil |
| Sesi Auth | `createClient` memakai adapter `sessionStorage` khusus; `localStorage` tidak dipakai (lihat 5.2 dan 13) |
| Error RPC | Pemetaan error terpusat di `lib/rpc.js`: `42501` → `/forbidden`, sisanya → error jaringan generik dengan tombol "Coba lagi" |
| Zona waktu | Penyimpanan UTC (`timestamptz`), tampilan dan agregasi bulan memakai `Asia/Jakarta` (WIB) |

### Perubahan dari planning sebelumnya

| Sebelumnya | Sekarang | Alasan |
|---|---|---|
| Titik di luar daratan diberi label "Perairan Lepas" | Titik diberi provinsi **terdekat dalam radius 150 km**, selebihnya `Luar Cakupan` dan dikeluarkan dari semua analitik | Gempa subduksi terjadi di laut. Tanpa aturan ini sebagian besar gempa terbuang atau gempa negara tetangga ikut terhitung |
| Banyak view agregat terpisah | Satu `mv_quake_cube` melayani dashboard taktis dan strategis, ditambah `mv_heat_grid` | Satu sumber agregat, tanpa duplikasi query |
| Peta dengan tile OpenStreetMap | Peta vektor tanpa tile | Lebih ringan, tidak melanggar kebijakan tile, tanpa gambar PNG eksternal, serasi dengan glassmorphism |
| Daftar gempa signifikan M ≥ 6.5 | 20 gempa terkuat | Jumlah tetap, layout stabil |
| Fungsi `tactical_alert` terpisah | Digabung ke `tactical_ranking` | Satu query, satu cache |

---

## 5. Aturan Kode Bersih (wajib)

### 5.1 Larangan
- Tidak ada fitur di luar daftar kebutuhan di dokumen ini.
- Tidak ada kode mati, komponen tidak terpakai, `console.log`, atau komentar yang hanya mengulang kode.
- Tidak ada angka ajaib atau teks label yang tersebar. Semua konstanta di `src/config.js`.
- Tidak ada logika bisnis (ambang siaga, rumus skor, z-score) di React. Ambang hanya hidup di SQL.
- Tidak ada `localStorage` untuk data sensitif, dan tidak ada `service_role` key di frontend atau repo.

### 5.2 Satu fungsi untuk banyak kebutuhan

| Kebutuhan | Satu-satunya implementasi |
|---|---|
| Klien Supabase (URL, anon key, storage sesi) | `lib/supabase.js` → satu `createClient` dengan adapter `sessionStorage` |
| Panggil RPC Supabase | `lib/rpc.js` → `rpc(name, params)` |
| Ambil data + cache + loading/error | `hooks/useRpc.js` → `useRpc(name, params, cacheClass)` |
| Format angka, tanggal WIB, magnitudo, waktu relatif | `lib/format.js` |
| Username → email, login, logout | `lib/auth.js` |
| Role → halaman beranda, label role | `config.js` → `ROLES` |
| Label status (Hijau, Aman, Tinggi, dll.) → warna | `config.js` → `TONE` dan `StatusBadge` |
| Proteksi halaman | `ProtectedRoute` (parameter `role`) |
| Panel kaca | `GlassPanel` (dipakai semua kartu) |
| Loading, error, kosong | `QueryState` (dibungkus di `ChartCard`, `DataTable`, `KpiCard`) |
| Grafik batang, garis, gabungan, bertumpuk, dua sumbu | `SeriesChart` (prop `series`) |
| Tabel | `DataTable` (prop `columns`) |
| Peta titik dan peta grid | `QuakeMap` (prop `mode`) |
| Cek hak akses di database | `assert_role(role)` |
| Normalisasi skor 0-1 | `norm01(v, lo, hi)` |
| Penentuan provinsi | trigger `set_province()` untuk semua sumber data |
| Normalisasi item BMKG | `normalize()` untuk ketiga endpoint |

### 5.3 Tooling
- ESLint (aturan `react-hooks`, `no-unused-vars`, `no-console`) dan Prettier. Build gagal jika lint gagal.
- Satu komponen per berkas, nama berkas sama dengan nama komponen, impor absolut lewat alias `@/`.

---

## 6. Data

### 6.1 Sumber

| Data | Sumber | Dipakai oleh |
|---|---|---|
| Gempa terkini (M ≥ 5), gempa dirasakan, gempa terbaru | `https://data.bmkg.go.id/DataMKG/TEWS/` (`autogempa.json`, `gempaterkini.json`, `gempadirasakan.json`) | Operasional |
| Katalog historis | USGS FDSN Event API, format CSV | Taktis, strategis |
| Batas 38 provinsi | GeoJSON batas administrasi (versi setelah pemekaran Papua 2022), disederhanakan ke ±0.01° | Peta dan penentuan provinsi |

URL unduhan USGS (jalankan per tahun karena batas 20.000 baris per permintaan, ganti tahunnya):

```
https://earthquake.usgs.gov/fdsnws/event/1/query?format=csv&starttime=2010-01-01&endtime=2010-12-31&minmagnitude=4&minlatitude=-11.5&maxlatitude=6.5&minlongitude=94&maxlongitude=142&orderby=time-asc
```

Syarat penggunaan: USGS adalah data publik. Untuk BMKG, cantumkan atribusi "Sumber: BMKG" dan cek ketentuan penggunaan terbaru di situs resmi pada Hari 1. UI wajib menampilkan disclaimer: *"Proyek akademik, bukan produk resmi BMKG."*

### 6.2 Kontrak data live BMKG

| Field BMKG | Kolom DB | Transformasi |
|---|---|---|
| `DateTime` | `event_time` | Parse ISO (UTC) |
| `Coordinates` ("-6.10,106.50") | `lat`, `lon` | Split koma lalu `Number` |
| `Kedalaman` ("10 km") | `depth_km` | `parseFloat` |
| `Magnitude` ("5.2") | `magnitude` | `parseFloat` |
| `Wilayah` | `location_text` | Apa adanya |
| `Dirasakan` (hanya di feed dirasakan) | `felt_info` | Null jika tidak ada |
| `Potensi` | `tsunami_potential` | `true` jika cocok `/berpotensi tsunami/i` dan tidak cocok `/tidak berpotensi/i` |
| `Shakemap` | tidak disimpan | Berupa gambar JPG, tidak dipakai (aturan WebP) |

Nama field dan format di atas diverifikasi terhadap respons nyata pada **Hari 1**. Jika berubah, hanya `normalize()` yang diubah.

Aturan nilai hilang: baris dengan `Magnitude`, `Kedalaman`, atau `Coordinates` yang tidak ada / tidak bisa di-parse **dibuang** oleh `normalize()` dan tidak dikirim ke `ingest_quakes`, karena `lat`, `lon`, `depth_km`, dan `magnitude` bersifat `NOT NULL`. Baris yang hanya kehilangan `Dirasakan` atau `Potensi` tetap dikirim, masing-masing dengan `felt_info = null` dan `tsunami_potential = false`.

### 6.3 Pipeline

**Satu kali (historis):**
1. Impor CSV USGS ke tabel sementara `usgs_staging` lewat Table Editor.
2. Jalankan `supabase/seed/usgs.sql` yang menyalin kolom `time, latitude, longitude, depth, mag, place` (filter `type = 'earthquake'` dan `depth is not null`) ke `earthquakes` dengan `source = 'usgs'`. Trigger mengisi provinsi.
3. `drop table usgs_staging;`
4. `refresh materialized view mv_quake_cube; refresh materialized view mv_heat_grid;`

**Berkala (live):** `pg_cron` tiap 5 menit memanggil Edge Function `ingest-bmkg`. Fungsi mengambil tiga endpoint, menormalkan, menggabungkan duplikat dalam satu batch lewat `mergeByKey()` (kunci `event_time+lat+lon`, `felt_info` non-null menang), lalu memanggil RPC `ingest_quakes`.

**Retensi:** cron harian menghapus `bmkg_live` yang lebih tua dari 30 hari.

**Normalisasi provinsi (gate Hari 2):** `provinces.name` adalah satu-satunya kunci yang dipakai peta, filter, `mv_quake_cube`, dan `mv_heat_grid`. Skrip `gen:provinces` menormalkan `src/data/provinces.json` (38 fitur pasca-2022) menjadi `supabase/seed/provinces.sql`, dan geometri di-cast dengan `ST_Multi` agar cocok dengan tipe kolom `geometry(MultiPolygon, 4326)`. Nama fitur GeoJSON harus identik dengan label yang dipakai UI dan filter. Verifikasi `select count(*) from provinces` = 38 sebelum lanjut.

---

## 7. Database

### 7.1 Skema

```sql
create extension if not exists postgis;

create table provinces (
  id   serial primary key,
  name text unique not null,
  geom geometry(MultiPolygon, 4326) not null
);
create index provinces_geom_idx on provinces using gist (geom);

create table earthquakes (
  id                bigserial primary key,
  event_time        timestamptz not null,
  lat               double precision not null,
  lon               double precision not null,
  depth_km          real not null,
  magnitude         real not null,
  location_text     text,
  province          text,
  felt_info         text,
  tsunami_potential boolean not null default false,
  source            text not null check (source in ('bmkg_live', 'usgs')),
  unique (source, event_time, lat, lon)
);
create index earthquakes_live_idx on earthquakes (source, event_time desc);

create table profiles (
  id       uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  role     text not null check (role in ('operational', 'tactical', 'strategic'))
);
```

### 7.2 Fungsi pendukung

```sql
-- Satu-satunya pemeriksa hak akses
create function assert_role(required text) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = required) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end $$;

-- Normalisasi 0-1 (dipakai skor kerawanan)
create function norm01(v numeric, lo numeric, hi numeric) returns numeric
language sql immutable as $$
  select coalesce((v - lo) / nullif(hi - lo, 0), 0)
$$;

-- Penentuan provinsi untuk semua sumber data
create function set_province() returns trigger language plpgsql as $$
declare pt geometry := ST_SetSRID(ST_MakePoint(new.lon, new.lat), 4326);
begin
  select name into new.province from provinces where ST_Contains(geom, pt) limit 1;
  if new.province is null then
    select name into new.province from provinces
    where ST_DWithin(geom::geography, pt::geography, 150000)
    order by geom <-> pt limit 1;
  end if;
  new.province := coalesce(new.province, 'Luar Cakupan');
  return new;
end $$;

create trigger earthquakes_set_province
before insert on earthquakes for each row execute function set_province();

-- Dipanggil Edge Function (service_role saja)
create function ingest_quakes(p_rows jsonb) returns int
language sql security definer set search_path = public as $$
  with ins as (
    insert into earthquakes (event_time, lat, lon, depth_km, magnitude,
                             location_text, felt_info, tsunami_potential, source)
    select event_time, lat, lon, depth_km, magnitude,
           location_text, felt_info, tsunami_potential, source
    from jsonb_populate_recordset(null::earthquakes, p_rows)
    on conflict (source, event_time, lat, lon) do update
      set felt_info = coalesce(excluded.felt_info, earthquakes.felt_info),
          tsunami_potential = excluded.tsunami_potential or earthquakes.tsunami_potential
    returning 1
  )
  select count(*)::int from ins
$$;
```

### 7.3 Agregat (cache di database)

```sql
create materialized view mv_quake_cube as
select (date_trunc('month', event_time at time zone 'Asia/Jakarta'))::date as month,
       province,
       case when magnitude < 5 then '4.0-4.9'
            when magnitude < 6 then '5.0-5.9'
            when magnitude < 7 then '6.0-6.9'
            else '7.0+' end as mag_class,
       case when depth_km < 70 then 'Dangkal'
            when depth_km <= 300 then 'Menengah'
            else 'Dalam' end as depth_class,
       count(*)       as quakes,
       sum(magnitude) as sum_mag
from earthquakes
where source = 'usgs' and province <> 'Luar Cakupan'
group by 1, 2, 3, 4;
create unique index on mv_quake_cube (month, province, mag_class, depth_class);

create materialized view mv_heat_grid as
select floor(lat / 0.5) * 0.5 as cell_lat,
       floor(lon / 0.5) * 0.5 as cell_lon,
       count(*) as quakes
from earthquakes
where source = 'usgs' and province <> 'Luar Cakupan'
group by 1, 2;
```

Materialized view tidak mendukung RLS, jadi aksesnya dicabut dan hanya dibuka lewat fungsi RPC.

### 7.4 Proteksi

```sql
alter table earthquakes enable row level security;   -- tanpa policy: tertutup
alter table provinces   enable row level security;
alter table profiles    enable row level security;

create policy profiles_self_read on profiles
  for select to authenticated using (id = auth.uid());

revoke all on earthquakes, provinces, mv_quake_cube, mv_heat_grid from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function
  ops_summary(), ops_latest(int),
  tactical_series(date, text, text[], text[]),
  tactical_ranking(date, text[], text[]),
  tactical_distribution(date, text, text[], text[]),
  strategic_yearly(), strategic_risk(), strategic_heat(), strategic_significant()
to authenticated;
```

Semua fungsi RPC berstatus `security definer`, `stable`, `set search_path = public`, dan baris pertamanya memanggil `perform assert_role('<role>')`. `ingest_quakes`, `assert_role`, `norm01`, `set_province` tidak diberi grant ke `authenticated`.

### 7.5 Seed user

Buat tiga user di Supabase Auth (email `admin1@siagagempa.app`, dst., password minimal 12 karakter, auto-confirm), lalu:

```sql
insert into profiles (id, username, role)
select id, split_part(email, '@', 1),
       case split_part(email, '@', 1)
         when 'admin1' then 'operational'
         when 'admin2' then 'tactical'
         when 'admin3' then 'strategic' end
from auth.users
where email in ('admin1@siagagempa.app', 'admin2@siagagempa.app', 'admin3@siagagempa.app');
```

Password tidak ditulis di repo atau laporan publik. Simpan di password manager dan serahkan ke penguji lewat jalur terpisah.

### 7.6 Penjadwalan

```sql
select cron.schedule('ingest-bmkg', '*/5 * * * *', $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/ingest-bmkg',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body    := '{}'::jsonb)
$$);

select cron.schedule('purge-live', '15 3 * * *', $$
  delete from earthquakes where source = 'bmkg_live' and event_time < now() - interval '30 days'
$$);
```

---

## 8. Kontrak API (RPC)

Semua dipanggil lewat `supabase.rpc(...)` oleh user terautentikasi. Role lain menerima error `42501`.

| RPC | Role | Parameter | Kolom hasil |
|---|---|---|---|
| `ops_summary()` | operational | | `latest_time, latest_mag, latest_place, quakes_24h, max_mag_today, tsunami_status, alert_level, updated_at` (0 atau 1 baris) |
| `ops_latest(p_limit int = 15)` | operational | | `id, event_time, lat, lon, depth_km, magnitude, location_text, province, felt_info, tsunami_potential` |
| `tactical_series(p_month, p_province, p_mag, p_depth)` | tactical | `p_province` null = nasional | `month, quakes, baseline` (12 bulan sampai `p_month`) |
| `tactical_ranking(p_month, p_mag, p_depth)` | tactical | | `province, quakes, baseline, z_score, is_alert` (38 provinsi, termasuk yang bernilai 0) |
| `tactical_distribution(p_month, p_province, p_mag, p_depth)` | tactical | `p_province` null = nasional | `dimension ('magnitude'/'depth'), bucket, sort, quakes` |
| `strategic_yearly()` | strategic | | `year, quakes, m6_plus, shallow, intermediate, deep` |
| `strategic_risk()` | strategic | | `rank, province, quakes, avg_mag, m6_plus, score, category, main_factor` (38 provinsi) |
| `strategic_heat()` | strategic | | `cell_lat, cell_lon, quakes` |
| `strategic_significant()` | strategic | | `event_time, magnitude, depth_km, location_text, province` (20 gempa terkuat, `source = 'usgs'`) |

`p_mag` berisi subset `{'4.0-4.9','5.0-5.9','6.0-6.9','7.0+'}`, `p_depth` berisi subset `{'Dangkal','Menengah','Dalam'}`. Default (semua kelas) dikirim oleh frontend dari `config.js`.

### 8.1 Aturan bisnis (sumber tunggal: SQL)

| Indikator | Aturan |
|---|---|
| Level siaga | Magnitudo tertinggi 24 jam: ≥ 6.0 **Merah**, 5.0-5.9 **Kuning**, selain itu **Hijau** |
| Status tsunami | **Berpotensi** jika ada gempa 24 jam dengan `tsunami_potential = true`, selain itu **Aman** |
| Magnitudo tertinggi hari ini | Maksimum pada tanggal WIB hari ini |
| Baseline taktis | Rata-rata jumlah gempa pada bulan kalender yang sama di tahun-tahun **sebelum** tahun terpilih (nol dihitung), dengan filter yang sama. Null jika belum ada tahun sebelumnya |
| Wilayah siaga | `z_score > 1` dengan `z = (n - rata-rata) / simpangan baku sampel`, minimal 5 tahun pembanding, simpangan baku > 0, dan `quakes ≥ 3` |
| Skor kerawanan | `100 × (0.4·F + 0.4·E + 0.2·S)`, F = jumlah gempa, E = rata-rata magnitudo, S = jumlah M ≥ 6, masing-masing dinormalisasi min-max antar provinsi |
| Kategori risiko | ≥ 67 **Tinggi**, 34-66.9 **Sedang**, < 34 **Rendah** |
| Faktor dominan | Komponen terbesar dari `0.4F`, `0.4E`, `0.2S` → "Frekuensi", "Magnitudo rata-rata", "Gempa besar" |
| Kelas kedalaman | < 70 km Dangkal, 70-300 km Menengah, > 300 km Dalam |

**Catatan implementasi agregat:** `mv_quake_cube` hanya berisi `(month, province, mag_class, depth_class)` yang punya data, dan `mv_heat_grid` hanya sel yang terisi. Karena baseline dan z-score menghitung bulan/tahun bernilai nol, setiap RPC taktis **wajib** membangkitkan kerangka waktu dengan `generate_series` lalu `LEFT JOIN` ke agregat; peringkat provinsi (`tactical_ranking`, `strategic_risk`) **wajib** `LEFT JOIN provinces` agar selalu 38 baris. Ambang kelas magnitudo dan kedalaman hanya didefinisikan di SQL; `config.js` hanya memuat daftar label untuk chip filter, bukan ambangnya.

### 8.2 Contoh implementasi: `ops_summary`

```sql
create function ops_summary()
returns table (latest_time timestamptz, latest_mag real, latest_place text,
               quakes_24h bigint, max_mag_today real, tsunami_status text,
               alert_level text, updated_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform assert_role('operational');
  return query
  with w as (
    select magnitude, tsunami_potential from earthquakes
    where source = 'bmkg_live' and event_time >= now() - interval '24 hours'),
  l as (
    select event_time, magnitude, location_text from earthquakes
    where source = 'bmkg_live' order by event_time desc limit 1)
  select l.event_time, l.magnitude, l.location_text,
         (select count(*) from w),
         (select max(e.magnitude) from earthquakes e
           where e.source = 'bmkg_live'
             and (e.event_time at time zone 'Asia/Jakarta')::date = (now() at time zone 'Asia/Jakarta')::date),
         case when exists (select 1 from w where tsunami_potential) then 'Berpotensi' else 'Aman' end,
         case when coalesce((select max(magnitude) from w), 0) >= 6 then 'Merah'
              when coalesce((select max(magnitude) from w), 0) >= 5 then 'Kuning'
              else 'Hijau' end,
         now()
  from l;
end $$;
```

### 8.3 Contoh implementasi: `strategic_risk`

```sql
create function strategic_risk()
returns table (rank int, province text, quakes bigint, avg_mag numeric,
               m6_plus bigint, score numeric, category text, main_factor text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform assert_role('strategic');
  return query
  with base as (
    select p.name as province,
           coalesce(sum(c.quakes), 0)::bigint as quakes,
           coalesce(sum(c.sum_mag), 0)       as sum_mag,
           coalesce(sum(c.quakes) filter (where c.mag_class in ('6.0-6.9', '7.0+')), 0)::bigint as m6_plus
    from provinces p
    left join mv_quake_cube c on c.province = p.name
    group by p.name),
  agg as (
    select b.province, b.quakes, b.m6_plus,
           round((b.sum_mag / nullif(b.quakes, 0))::numeric, 2) as avg_mag
    from base b),
  n as (
    select a.*,
           0.4 * norm01(a.quakes,  min(a.quakes)  over (), max(a.quakes)  over ()) as f,
           0.4 * norm01(a.avg_mag, min(a.avg_mag) over (), max(a.avg_mag) over ()) as e,
           0.2 * norm01(a.m6_plus, min(a.m6_plus) over (), max(a.m6_plus) over ()) as s
    from agg a),
  r as (
    select n.*, round(100 * (n.f + n.e + n.s), 1) as score from n)
  select (rank() over (order by r.score desc))::int, r.province, r.quakes, r.avg_mag, r.m6_plus,
         r.score,
         case when r.score >= 67 then 'Tinggi' when r.score >= 34 then 'Sedang' else 'Rendah' end,
         case when r.f >= r.e and r.f >= r.s then 'Frekuensi'
              when r.e >= r.s then 'Magnitudo rata-rata'
              else 'Gempa besar' end
  from r order by r.score desc;
end $$;
```

### 8.4 Pola kerangka waktu untuk baseline dan z-score

`mv_quake_cube` hanya berisi bulan/provinsi yang ada datanya, jadi baseline ("nol dihitung") dan z-score ("minimal 5 tahun pembanding") harus membangkitkan kerangka waktu lebih dulu. Pola tunggal di bawah dipakai `tactical_series` dan `tactical_ranking`; jangan menyalin logikanya ke React.

```sql
-- Kerangka 12 bulan + jumlah terfilter (nol bila tidak ada baris)
with months as (
  select gs::date as month
  from generate_series(date_trunc('month', p_month) - interval '11 months',
                       date_trunc('month', p_month), interval '1 month') gs),
cur as (
  select m.month, coalesce(sum(c.quakes), 0)::int as quakes
  from months m
  left join mv_quake_cube c
    on c.month = m.month
   and (p_province is null or c.province = p_province)
   and c.mag_class = any (p_mag) and c.depth_class = any (p_depth)
  group by m.month),
-- Baseline: rata-rata bulan kalender yang sama pada tahun-tahun sebelum tahun terpilih.
-- Semua tahun 2010..tahun-1 masuk walau tidak ada baris (dianggap nol); null bila belum ada tahun sebelumnya.
base as (
  select m.month,
         (select avg(yr.quakes)
          from generate_series(2010, extract(year from m.month)::int - 1) as g(yr)
          cross join lateral (
            select coalesce(sum(c.quakes), 0) as quakes
            from mv_quake_cube c
            where c.month = make_date(g.yr, extract(month from m.month)::int, 1)
              and (p_province is null or c.province = p_province)
              and c.mag_class = any (p_mag) and c.depth_class = any (p_depth)) yr) as baseline
  from months m)
select m.month, cur.quakes, base.baseline
from months m
join cur  using (month)
join base using (month)
order by m.month;
```

Untuk `tactical_ranking`, ganti langkah baseline dengan kumpulan jumlah per tahun (2010..tahun-1, nol dihitung), lalu hitung `(n - avg) / nullif(stddev_samp, 0)`; `is_alert` mengikuti syarat di 8.1 (minimal 5 tahun, `stddev > 0`, `n ≥ 3`, `z > 1`).

Fungsi lain mengikuti pola yang sama (`assert_role`, lalu query ke `mv_quake_cube` atau `mv_heat_grid`) dan aturan di 8.1.

---

## 9. Kebutuhan Fungsional

### 9.1 Autentikasi dan rute

| ID | Kebutuhan | Kriteria penerimaan |
|---|---|---|
| AUTH-01 | Halaman `/login` dengan field username dan password | Mengetik `admin1` login sebagai `admin1@siagagempa.app` (domain dari `VITE_AUTH_DOMAIN`) |
| AUTH-02 | Setelah login, ambil `role` dari `profiles` lalu arahkan ke beranda role | `operational`→`/operational`, `tactical`→`/tactical`, `strategic`→`/strategic` |
| AUTH-03 | Kredensial salah menampilkan satu pesan generik | "Username atau password salah." tanpa membedakan penyebab |
| AUTH-04 | `ProtectedRoute role="..."` | Belum login → `/login`. Role tidak sesuai → `/forbidden` |
| AUTH-05 | Profil tidak ditemukan | Sesi diakhiri dan pesan error ditampilkan |
| AUTH-06 | Logout | Sesi diakhiri, **seluruh cache query dan `sessionStorage` dibersihkan**, lalu ke `/login` |
| AUTH-07 | Sudah login membuka `/login` | Diarahkan ke beranda role |
| AUTH-08 | Rute tidak dikenal | Halaman 404 dengan tautan kembali |

### 9.2 Layout bersama (`AppShell`)

- Header sticky berbahan kaca: wordmark SiagaGempa, label role, username, tombol keluar.
- Footer: sumber data (BMKG/USGS) dan disclaimer "Proyek akademik, bukan produk resmi BMKG."
- Setiap KPI, grafik, dan tabel memiliki **judul + keterangan definisi singkat** (prop `caption`) dan sumber data. Tidak ada tooltip tersembunyi.

### 9.3 Dashboard operasional (`/operational`)

| ID | Kebutuhan | Data |
|---|---|---|
| OPS-01 | Empat `KpiCard`: Gempa terbaru (M, lokasi, waktu WIB + relatif), Gempa 24 jam, Magnitudo tertinggi hari ini, Status tsunami | `ops_summary` |
| OPS-02 | `StatusBadge` level siaga (Hijau/Kuning/Merah) di bagian atas dengan teks, bukan hanya warna | `ops_summary.alert_level` |
| OPS-03 | `QuakeMap mode="points"`: titik 15 gempa terakhir, radius sebanding magnitudo, warna per kelas (M < 5 biru muda, 5-5.9 kuning, ≥ 6 merah) | `ops_latest` |
| OPS-04 | `DataTable` 15 gempa: waktu WIB, M, kedalaman, lokasi, provinsi, dirasakan, tsunami | `ops_latest` |
| OPS-05 | Klik baris tabel menyorot titik di peta | state `selectedId` di halaman |
| OPS-06 | Label "Diperbarui HH:mm WIB" dan refetch otomatis tiap 5 menit (hanya saat tab aktif) | `updated_at`, cache `live` |
| OPS-07 | Keterangan permanen: "Feed BMKG berisi gempa M ≥ 5 atau yang dirasakan." | statis |
| OPS-08 | Kondisi kosong: "Belum ada gempa tercatat dalam 24 jam terakhir." dan level Hijau | |

### 9.4 Dashboard taktis (`/tactical`)

Filter disimpan di URL (`useSearchParams`) sehingga bisa dibagikan: `?bulan=2025-12&prov=Aceh&mag=...&dalam=...`.

| ID | Kebutuhan | Data |
|---|---|---|
| TAC-01 | `FilterBar`: bulan (2010-01 s.d. 2025-12, default 2025-12), provinsi (default Nasional, opsi dari `tactical_ranking`), kelas magnitudo (chip multi-pilih), kelas kedalaman (chip multi-pilih) | |
| TAC-02 | Empat `KpiCard`: Gempa bulan terpilih, Selisih vs baseline (%), Provinsi teratas, Jumlah wilayah siaga | turunan dari `tactical_series` + `tactical_ranking` (tanpa RPC baru) |
| TAC-03 | `SeriesChart`: batang jumlah gempa 12 bulan + garis putus-putus baseline | `tactical_series` |
| TAC-04 | `DataTable` ranking provinsi: jumlah, baseline, z-score, badge "Siaga" | `tactical_ranking` |
| TAC-05 | Panel "Wilayah Siaga": daftar provinsi `is_alert` beserta alasan ("Jumlah 14 vs rata-rata 6.2") | `tactical_ranking` |
| TAC-06 | Dua `SeriesChart` histogram: sebaran magnitudo dan sebaran kedalaman, ikut filter bulan, provinsi, magnitudo, dan kedalaman | `tactical_distribution` |
| TAC-07 | Perubahan filter memperbarui seluruh komponen | |
| TAC-08 | Keterangan permanen: "Data historis USGS 2010-2025. Baseline = rata-rata bulan yang sama pada tahun-tahun sebelumnya." | statis |

### 9.5 Dashboard strategis (`/strategic`)

| ID | Kebutuhan | Data |
|---|---|---|
| STR-01 | Empat `KpiCard`: Total gempa 2010-2025, Total M ≥ 6, Provinsi skor tertinggi, Persentase gempa dangkal | `strategic_yearly`, `strategic_risk` |
| STR-02 | `SeriesChart` tren tahunan: batang jumlah gempa (sumbu kiri) + garis M ≥ 6 (sumbu kanan) | `strategic_yearly` |
| STR-03 | `SeriesChart` bertumpuk: komposisi kedalaman per tahun | `strategic_yearly` |
| STR-04 | `QuakeMap mode="grid"`: sel 0.5° berwarna sekuensial biru sesuai jumlah, legenda skala | `strategic_heat` |
| STR-05 | `DataTable` skor kerawanan 38 provinsi: peringkat, skor (dengan bar), kategori, jumlah, rata-rata M, jumlah M ≥ 6 | `strategic_risk` |
| STR-06 | Panel "Prioritas Mitigasi": 5 teratas dengan kalimat otomatis, mis. "1. Sulawesi Tengah, skor 82.4, faktor dominan: Frekuensi" | `strategic_risk` |
| STR-07 | `DataTable` 20 gempa terkuat | `strategic_significant` |
| STR-08 | Keterangan rumus skor kerawanan ditampilkan di bawah tabel | statis |

### 9.6 Status tampilan umum

Setiap komponen berdata menangani empat status lewat `QueryState`: memuat (skeleton kaca), error (pesan + tombol "Coba lagi"), kosong (pesan spesifik), dan sukses.

---

## 10. Design System: Glassmorphism

### 10.1 Prinsip
1. **Setiap warna punya fungsi.** Biru = merek dan data, kuning/merah/hijau = status saja.
2. **Kaca hanya untuk permukaan konten.** Latar tetap statis dan tenang agar kontras terjaga.
3. **Tanpa dekorasi kosong.** Tidak ada blob gradien, partikel, emoji, ikon pemanis, teks contoh, atau animasi tanpa makna.
4. **Satu tema (gelap).** Tidak ada mode terang.

### 10.2 Token warna

Warna merek diturunkan dari logo BMKG (dominan biru tua dan biru muda dengan putih). Nilai di bawah adalah nilai tetap proyek. Pada Hari 1, ambil sampel warna dari berkas logo resmi dengan eyedropper dan sesuaikan **hanya** di `src/styles/tokens.css` jika ada selisih.

| Token | Nilai | Fungsi |
|---|---|---|
| `--brand-950` | `#061A3A` | Dasar latar |
| `--brand-900` | `#0A2A5E` | Latar atas, header |
| `--brand-700` | `#0F4C9C` | Tombol utama, seri data utama |
| `--brand-500` | `#1E78D2` | Fokus, tautan, seri data kedua |
| `--brand-300` | `#7DB7F0` | Titik data M < 5, skala heatmap rendah |
| `--text-1` | `#F2F7FF` | Teks utama |
| `--text-2` | `#A9BCD9` | Teks sekunder, keterangan |
| `--ok` | `#34C38F` | Hijau, Aman, Rendah |
| `--warn` | `#F5B82E` | Kuning, Sedang |
| `--danger` | `#F0524F` | Merah, Berpotensi, Tinggi |
| `--grid` | `rgb(255 255 255 / 0.10)` | Garis grafik dan pemisah |

Kuning dan merah **hanya** dipakai untuk status dan kelas magnitudo besar. Skala heatmap memakai gradasi biru (`--brand-950` → `--brand-300`), bukan warna status.

### 10.3 Permukaan kaca

```css
:root {
  --glass-bg: rgb(255 255 255 / 0.08);
  --glass-bg-hover: rgb(255 255 255 / 0.12);
  --glass-border: rgb(255 255 255 / 0.18);
  --glass-blur: 16px;
  --glass-shadow: 0 8px 32px rgb(0 0 0 / 0.28);
}
.glass {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  backdrop-filter: blur(var(--glass-blur)) saturate(120%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(120%);
}
@supports not (backdrop-filter: blur(1px)) {
  .glass { background: rgb(10 42 94 / 0.92); }
}
@media (max-width: 768px) { :root { --glass-blur: 10px; } }
@media (prefers-reduced-transparency: reduce) { .glass { background: rgb(10 42 94 / 0.96); backdrop-filter: none; } }
```

Dukungan `prefers-reduced-transparency` masih terbatas di browser; media query di atas hanya peningkatan progresif, sedangkan fallback utama tetap blok `@supports not (backdrop-filter: ...)`.

Aturan performa kaca: maksimum dua lapis kaca bertumpuk, tidak ada `backdrop-filter` pada baris tabel atau elemen berulang, dan latar adalah gradien CSS statis (`--brand-900` ke `--brand-950`, vertikal) tanpa gambar.

### 10.4 Tipografi, spasi, bentuk

| Aspek | Aturan |
|---|---|
| Font | Inter variable. Angka memakai `font-variant-numeric: tabular-nums` |
| Skala | 12 / 14 / 16 / 20 / 24 / 32 px. Bobot 400, 500, 600 |
| Spasi | Kelipatan 4 px. Jarak antar panel 16 px (mobile) dan 24 px (desktop) |
| Radius | 12 px (elemen kecil), 16 px (panel) |
| Grid | 12 kolom, lebar maksimum 1440 px |
| Breakpoint | 360 (mobile), 768 (tablet), 1280 (desktop) |
| Ikon | `lucide-react`, ukuran 16 atau 20, stroke 1.75, hanya bila memberi informasi |
| Gerak | Transisi 150 ms untuk hover dan fokus. Hormati `prefers-reduced-motion` |

### 10.5 Spesifikasi komponen

| Komponen | Props | Catatan |
|---|---|---|
| `GlassPanel` | `as`, `className`, `children` | Satu-satunya pembawa kelas `.glass` |
| `KpiCard` | `label, value, unit, caption, tone, query` | `tone` memberi aksen status; `query` memicu `QueryState` |
| `ChartCard` | `title, caption, query, children` | Pembungkus grafik dan peta |
| `SeriesChart` | `data, xKey, series[{key,label,type,color,axis,stackId,dashed}]` | `type`: `bar` atau `line`. Satu komponen untuk semua grafik |
| `DataTable` | `columns[{key,label,render,align}], rows, onRowClick, selectedId, query` | Header sticky, area scroll horizontal di mobile |
| `QuakeMap` | `mode ('points'/'grid'), data, selectedId` | Kanvas renderer, batas provinsi sebagai latar, tanpa tile |
| `FilterBar` | `value, onChange, fields[]` | Dikendalikan dari URL |
| `StatusBadge` | `label` | Warna dari `TONE[label]`, selalu menampilkan teks |
| `QueryState` | `query, empty, children` | Loading, error, kosong |

### 10.6 Grafik
- Maksimum tiga seri per grafik. Seri 1 `--brand-700`, seri 2 `--brand-500`, baseline putus-putus `--text-2`.
- Sumbu dan label memakai `--text-2`, garis bantu `--grid`.
- Tooltip bergaya kaca. Setiap grafik punya `aria-label` yang diisi dari `caption`.

### 10.7 Aksesibilitas
- Kontras teks minimum WCAG AA (4.5:1) di atas latar dan kaca.
- Warna tidak pernah menjadi satu-satunya pembawa makna (badge selalu bertuliskan).
- Semua kontrol dapat dioperasikan dengan keyboard dan memiliki indikator fokus `--brand-300`.

---

## 11. Strategi Cache dan Performa

| Lapis | Mekanisme | Isi |
|---|---|---|
| Database | Materialized view `mv_quake_cube`, `mv_heat_grid`, di-refresh hanya saat impor | Agregasi 2010-2025 |
| Query client | TanStack Query | Lihat kelas cache di bawah |
| Persist | `sessionStorage` (hilang saat tab ditutup, `maxAge` 24 jam, `buster` = versi aplikasi) | Hasil RPC |
| Aset statis | Berkas Vite ber-hash di `/assets/*` dengan `Cache-Control: public, max-age=31536000, immutable` | JS, CSS, font, gambar |
| Kode | Rute `React.lazy`; chunk `charts` (Recharts) dan `map` (Leaflet) terpisah; GeoJSON provinsi dimuat dinamis di chunk peta | Muatan awal kecil |

```js
// config.js
export const CACHE = {
  live:       { staleTime: 4 * 60_000, refetchInterval: 5 * 60_000, refetchIntervalInBackground: false },
  historical: { staleTime: 24 * 3_600_000, gcTime: 7 * 24 * 3_600_000 },
};
```

Aturan:
- Kunci cache otomatis `[nama RPC, parameter]`, sehingga filter yang sama tidak diambil dua kali.
- Operasional memakai kelas `live`. Taktis dan strategis memakai `historical`.
- Saat logout, `queryClient.clear()` dan penghapusan `sessionStorage` dijalankan (mencegah data role lain bocor di perangkat bersama).
- Permintaan RPC tidak diulang otomatis lebih dari 1 kali.

### Anggaran performa

| Metrik | Target |
|---|---|
| JS awal (halaman login) | ≤ 150 KB gzip |
| JS dashboard termuat (termasuk chart) | ≤ 350 KB gzip |
| LCP (4G, mid-range) | < 2.5 s |
| Lighthouse Performance dan Accessibility | ≥ 90 |
| Panggilan jaringan saat pindah filter yang sudah pernah dibuka | 0 |

---

## 12. Aset Gambar (WebP)

- **Semua gambar raster wajib `.webp`.** JPG, JPEG, PNG, dan GIF dilarang di `src/` dan `public/`. Ikon, wordmark, dan favicon memakai SVG (bukan raster).
- Aset raster v1: foto visual halaman login (satu foto bebas lisensi dari Wikimedia Commons atau Unsplash, atribusi dicatat di footer halaman login). Disajikan sebagai dua ukuran, `login-visual-640.webp` dan `login-visual-1280.webp`, lewat `srcset` dengan atribut `width`, `height`, dan `decoding="async"`.
- Batas ukuran: ≤ 80 KB per berkas, kualitas WebP 78-82.
- Alur: simpan sumber asli di luar repo, jalankan `npm run webp` (skrip `sharp`) yang menghasilkan dua ukuran ke `src/assets/`.
- Gambar dari API (mis. `Shakemap` BMKG) tidak ditampilkan.
- `npm run check:assets` gagal bila ada raster non-WebP atau berkas > 80 KB (batas yang sama dengan butir di atas), dan dijalankan otomatis sebelum build.

---

## 13. Keamanan

| Ancaman | Mitigasi |
|---|---|
| Akses data role lain lewat API langsung | Tabel tertutup RLS + `assert_role` di setiap RPC + grant eksplisit |
| Kebocoran kunci | Frontend hanya memakai `anon` key. `service_role` hanya ada di environment Edge Function |
| Pemanggilan sembarang Edge Function | Fungsi dideploy dengan `--no-verify-jwt` tetapi menolak permintaan tanpa header `x-cron-secret` yang cocok |
| Pendaftaran pihak asing | Sign-up dimatikan (Auth → Providers → Email → "Allow new users to sign up" off) |
| Tebakan password | Password ≥ 12 karakter dan rate limit bawaan Supabase Auth |
| XSS dan clickjacking | Header keamanan dan CSP di `vercel.json`. Tidak ada `dangerouslySetInnerHTML` |
| Sesi auth tertinggal di perangkat bersama | `createClient` memakai adapter `sessionStorage`; default `localStorage` dari supabase-js tidak dipakai, sesi hilang saat tab ditutup |
| Data query tertinggal di perangkat bersama | Cache dibersihkan saat logout lewat `queryClient.clear()`, persist memakai `sessionStorage` (bukan `localStorage`) |
| Rahasia di repo | `.env` di `.gitignore`. Hanya `.env.example` yang di-commit |

---

## 14. Struktur Proyek, Dependensi, Konfigurasi

```
siagagempa/
├─ prd.md
├─ index.html
├─ vercel.json
├─ vite.config.js
├─ package.json
├─ .env.example
├─ scripts/
│  ├─ to-webp.mjs
│  ├─ check-assets.mjs
│  └─ provinces-to-sql.mjs        # src/data/provinces.json → supabase/seed/provinces.sql
├─ src/
│  ├─ main.jsx
│  ├─ App.jsx                     # rute + lazy loading
│  ├─ config.js                   # ROLES, TONE, CACHE, MAG_CLASSES, DEPTH_CLASSES, DATA_RANGE
│  ├─ styles/                     # tokens.css, glass.css, base.css
│  ├─ data/provinces.json         # GeoJSON tunggal untuk peta dan seed DB
│  ├─ assets/                     # *.webp
│  ├─ lib/                        # supabase.js (adapter sessionStorage), rpc.js, queryClient.js, format.js, auth.js
│  ├─ context/AuthContext.jsx
│  ├─ hooks/useRpc.js
│  ├─ components/
│  │  ├─ ui/                      # GlassPanel, KpiCard, ChartCard, DataTable, FilterBar, StatusBadge, QueryState
│  │  ├─ charts/SeriesChart.jsx
│  │  ├─ map/QuakeMap.jsx
│  │  └─ layout/                  # AppShell, ProtectedRoute
│  └─ pages/                      # Login, Operational, Tactical, Strategic, Forbidden, NotFound
└─ supabase/
   ├─ migrations/                 # 01_schema, 02_functions, 03_views, 04_rpc, 05_security, 06_cron
   ├─ seed/                       # provinces.sql, usgs.sql, profiles.sql
   └─ functions/
      ├─ _shared/normalize.ts     # normalize() + mergeByKey() + tes
      └─ ingest-bmkg/index.ts
```

### Dependensi (versi stabil terbaru saat inisialisasi, dikunci `package-lock.json`)
- Runtime: `react`, `react-dom`, `react-router-dom`, `@supabase/supabase-js`, `@tanstack/react-query`, `@tanstack/react-query-persist-client`, `@tanstack/query-sync-storage-persister`, `recharts`, `leaflet`, `react-leaflet`, `lucide-react`, `@fontsource-variable/inter`
- Dev: `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`, `sharp`, `eslint`, `prettier`, `vitest`

Tidak ada dependensi lain yang boleh ditambahkan tanpa mengubah dokumen ini.

### Skrip npm
`dev`, `build` (= `lint` lalu `check:assets` lalu `vite build`), `preview`, `lint`, `format`, `test`, `webp`, `check:assets`, `gen:provinces`.

### Environment

```
# .env.example (frontend)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_AUTH_DOMAIN=siagagempa.app

# Secret Edge Function (supabase secrets set)
CRON_SECRET=
```

### `vercel.json`

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; connect-src 'self' https://*.supabase.co" }
      ]
    }
  ]
}
```

---

## 15. Deploy dan Operasional

**Supabase**
1. Buat project, aktifkan ekstensi `postgis`, `pg_cron`, `pg_net`, dan Vault.
2. Jalankan migrasi `01` sampai `05`, lalu seed `provinces.sql` dan `usgs.sql`.
3. Refresh dua materialized view.
4. Buat tiga user, jalankan `profiles.sql`, matikan sign-up.
5. Simpan `cron_secret` di Vault, set `CRON_SECRET` di secrets Edge Function, deploy `ingest-bmkg --no-verify-jwt`.
6. Jalankan migrasi `06_cron`.

**Vercel**
1. Impor repo GitHub, framework Vite.
2. Isi `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_AUTH_DOMAIN`.
3. Deploy. Setiap push ke `main` otomatis memicu build (lint, cek aset, dan build).

**Pemantauan:** cek tabel `cron.job_run_details` dan baris terbaru `bmkg_live` bila dashboard operasional menampilkan "Diperbarui" yang lama.

---

## 16. Pengujian dan Akseptasi

### 16.1 Uji otomatis (Vitest, Deno test, dan pgTAP)
- `normalize()`: koordinat, magnitudo, kedalaman, `Potensi` ("Tidak berpotensi tsunami" → false), field opsional hilang, dan baris dengan `Magnitude`/`Kedalaman`/`Coordinates` kosong dibuang.
- `mergeByKey()`: duplikat antar feed digabung dan `felt_info` non-null menang.
- `format.js`: tanggal WIB, angka, waktu relatif.
- `ProtectedRoute`: tiga kasus (belum login, role salah, role benar).
- `rpc.js`: pemetaan error `42501` → `/forbidden` dan error lain → status error generik.
- pgTAP: `assert_role` menolak role yang salah dengan `42501`; `strategic_risk` dan `tactical_ranking` selalu mengembalikan 38 baris; baseline menghitung bulan bernilai nol.

### 16.2 Uji akses (manual, 27 kasus)
Tiap akun memanggil sembilan RPC lewat console. Hanya RPC milik rolenya yang berhasil, selebihnya error `42501`. Panggilan `select` langsung ke `earthquakes` dan `mv_quake_cube` harus ditolak untuk semua akun.

### 16.3 Verifikasi angka
Bandingkan dengan query SQL manual: total baris `usgs` per tahun, jumlah per provinsi untuk satu bulan, skor kerawanan tiga provinsi teratas, dan jumlah gempa 24 jam.

### 16.4 Checklist selesai (Definition of Done)

- [ ] `admin1/2/3` login ke dashboard yang benar, URL dashboard lain menuju `/forbidden`
- [ ] 27 kasus uji akses lulus
- [ ] Tidak ada `service_role` key di repo atau bundel (`grep` bersih)
- [ ] Tidak ada sesi auth di `localStorage` (default supabase-js diganti adapter `sessionStorage`)
- [ ] Data BMKG masuk otomatis, tidak duplikat, dan ditandai waktu "Diperbarui"
- [ ] Semua ID kebutuhan di bagian 9 terpenuhi
- [ ] Filter taktis memperbarui semua komponen dan tersimpan di URL
- [ ] Setiap KPI, grafik, dan tabel memiliki keterangan definisi
- [ ] Tidak ada fungsi ganda: tabel 5.2 menjadi satu-satunya implementasi (ditinjau saat code review)
- [ ] Lint, tes, dan `check:assets` lulus. Tidak ada raster non-WebP
- [ ] Anggaran performa bagian 11 terpenuhi (bukti: tangkapan layar Lighthouse)
- [ ] Tampilan benar di 360, 768, dan 1280 px
- [ ] Footer memuat atribusi BMKG, USGS, kredit foto login, dan disclaimer
- [ ] URL produksi Vercel berfungsi dan README memuat langkah bagian 15

---

## 17. Rencana Kerja (10 hari kerja)

| Hari | Pekerjaan | Hasil |
|---|---|---|
| 1 | Unduh USGS per tahun, uji tiga endpoint BMKG dan cocokkan bagian 6.2, siapkan GeoJSON 38 provinsi, ambil sampel warna logo | Data mentah + `tokens.css` final |
| 2 | Setup Supabase, migrasi skema, seed provinsi dan USGS, refresh view | `count(*)` per provinsi benar |
| 3 | RPC, RLS, user, profiles | 27 kasus uji akses lulus |
| 4 | Edge Function ingest + cron | Data live masuk otomatis tanpa duplikat |
| 5 | Inisialisasi Vite, design system, komponen UI dasar, login, routing, cache | Login 3 akun + halaman kosong berlayout |
| 6 | Dashboard operasional | OPS-01 s.d. OPS-08 |
| 7 | Dashboard taktis | TAC-01 s.d. TAC-08 |
| 8 | Dashboard strategis | STR-01 s.d. STR-08 |
| 9 | Deploy, uji performa dan responsif, perbaikan | URL publik, Lighthouse ≥ 90 |
| 10 | README, laporan, tangkapan layar | Siap dikumpulkan |

Prioritas jika waktu mepet: operasional, lalu strategis, lalu taktis. Fitur yang boleh dipangkas lebih dulu: OPS-05 (sorot baris) dan STR-03 (komposisi kedalaman).

---

## 18. Risiko

| Risiko | Dampak | Penanganan |
|---|---|---|
| Format atau akses API BMKG berubah | Operasional kosong | Ubah `normalize()` saja. Cadangan: sumber USGS "past day" untuk wilayah Indonesia |
| Lisensi atau ketentuan BMKG membatasi pemakaian | Risiko akademik | Atribusi jelas, disclaimer, baca ketentuan di Hari 1 |
| Penentuan provinsi lambat saat impor | Impor lama | Poligon disederhanakan, impor satu kali, indeks GIST |
| Batas provinsi tidak sesuai 38 provinsi | Peringkat salah | Pakai GeoJSON pasca-2022, verifikasi jumlah baris `provinces = 38` |
| Nama provinsi GeoJSON berbeda dari label UI/filter | Join dan filter gagal senyap | `provinces.name` jadi kunci tunggal, dinormalkan oleh `gen:provinces`, diverifikasi lewat pgTAP |
| Gempa dekat perbatasan negara tertarik ke provinsi terdekat | Sedikit bias | Radius 150 km, dicatat sebagai keterbatasan di laporan |
| Data historis berhenti Desember 2025 | Dashboard taktis tidak "terkini" | Dinyatakan di UI (TAC-08) dan bagian 2. Pembaruan bulanan masuk v1.1 |
| Kuota gratis Supabase atau Vercel | Layanan terbatas | Data < 100 MB, retensi live 30 hari, tanpa tile atau gambar besar |
| Kaca (blur) berat di perangkat lemah | Lag | Blur dikurangi di mobile, maksimum dua lapis, fallback tanpa blur |

---

## 19. Rencana Pengembangan Lanjutan (v1.1, tidak dikerjakan sekarang)

- Pembaruan USGS bulanan otomatis dan refresh materialized view terjadwal
- Ekspor laporan PDF per dashboard
- Pembaruan dan manajemen akun lewat antarmuka
