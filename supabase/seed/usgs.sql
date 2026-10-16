-- =============================================================================
-- SiagaGempa — Seed USGS historis (PRD §6.3 langkah 2)
-- Prasyarat: tabel staging `usgs_staging` sudah berisi isi CSV USGS (Table
-- Editor→Import; kolom asli CSV dipertahankan: time, latitude, longitude,
-- depth, mag, place, type). Kolom provinsi diisi trigger set_province.
-- ===========================================================================

create table if not exists usgs_staging (
  time       text,
  latitude   double precision,
  longitude  double precision,
  depth      double precision,
  mag        double precision,
  place      text,
  type       text
);

insert into earthquakes (event_time, lat, lon, depth_km, magnitude, location_text, source)
select time::timestamptz, latitude, longitude, depth::real, mag::real, place, 'usgs'
from usgs_staging
where type = 'earthquake'
  and depth is not null
  and time is not null
on conflict (source, event_time, lat, lon) do nothing;

drop table usgs_staging;

-- Versi ter-refresh dipakai RPC (PRD §6.3 langkah 4). Jalankan sendiri atau
-- habiskan: refresh materialized view mv_quake_cube;
--           refresh materialized view mv_heat_grid;
