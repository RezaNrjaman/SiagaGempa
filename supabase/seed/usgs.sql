-- =============================================================================
-- SiagaGempa — Seed USGS historis (PRD §6.3)
-- WAJIB DIJALANKAN BERURUTAN, jangan dicampur:
--
--   BLOK 1 (SQL Editor)  : create staging  → Run
--   LANGKAH 2 (Table Editor): import CSV per tahun ke tabel usgs_staging
--   BLOK 3 (SQL Editor)  : insert ke earthquakes + drop staging → Run
--
-- Kalau error "relation usgs_staging does not exist", berarti BLOK 3 dijalankan
-- sebelum BLOK 1. Jalankan BLOK 1 dulu.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- BLOK 1 — buat tabel staging (jalankan INI dulu, sekali saja)
-- ---------------------------------------------------------------------------
create table if not exists usgs_staging (
  time       text,
  latitude   double precision,
  longitude  double precision,
  depth      double precision,
  mag        double precision,
  place      text,
  type       text
);


-- ---------------------------------------------------------------------------
-- LANGKAH 2 — (DI TABLE EDITOR, bukan di sini)
--   Table Editor → usgs_staging → Import data from CSV
--   Upload CSV USGS per tahun (2010..2025). Kolom CSV sudah sama urutannya
--   dengan tabel, jadi langsung match. Ulangi untuk tiap tahun.
--   Sumber CSV (PRD §6.2, ganti tahunnya):
--   https://earthquake.usgs.gov/fdsnws/event/1/query?format=csv&starttime=2010-01-01&endtime=2010-12-31&minmagnitude=4&minlatitude=-11.5&maxlatitude=6.5&minlongitude=94&maxlongitude=142&orderby=time-asc
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- BLOK 3 — pindahkan ke earthquakes + bersihkan (jalankan SETELAH import CSV)
--   Kolom provinsi diisi otomatis oleh trigger set_province.
--   Idempoten: on conflict do nothing, aman dijalankan ulang.
-- ---------------------------------------------------------------------------
insert into earthquakes (event_time, lat, lon, depth_km, magnitude, location_text, source)
select time::timestamptz, latitude, longitude, depth::real, mag::real, place, 'usgs'
from usgs_staging
where type = 'earthquake'
  and depth is not null
  and time is not null
  and mag is not null
on conflict (source, event_time, lat, lon) do nothing;

drop table if exists usgs_staging;

-- Verifikasi: jumlah baris USGS yang masuk (harus ribuan).
select count(*) as jumlah_usgs from earthquakes where source = 'usgs';

-- ---------------------------------------------------------------------------
-- LANGKAH TERAKHIR — refresh materialized view (wajib, tanpa ini RPC tetap 0):
--   refresh materialized view mv_quake_cube;
--   refresh materialized view mv_heat_grid;
-- ---------------------------------------------------------------------------
