-- =============================================================================
-- SiagaGempa — Migrasi 03: Agregat cache (PRD §7.3)
-- Materialized view tidak mendukung RLS → akses dicabut, hanya dibuka via RPC.
-- =============================================================================

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
create unique index mv_quake_cube_key_idx on mv_quake_cube (month, province, mag_class, depth_class);

create materialized view mv_heat_grid as
select floor(lat / 0.5) * 0.5 as cell_lat,
       floor(lon / 0.5) * 0.5 as cell_lon,
       count(*) as quakes
from earthquakes
where source = 'usgs' and province <> 'Luar Cakupan'
group by 1, 2;
create unique index mv_heat_grid_key_idx on mv_heat_grid (cell_lat, cell_lon);

-- Refresh sekali saat seed historis selesai; RPC membaca versi ter-refresh.
-- (Dipanggil manual oleh penanggung jawab data atau cron 'refresh-cube'.)
