-- =============================================================================
-- SiagaGempa — Migrasi 08: RPC pelengkap dasbor (permintaan pemilik)
-- Semua: security definer, stable, search_path = public, baris pertama
-- memanggil assert_role. Konvensi sama dengan migrasi 04.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- OPERASIONAL
-- ----------------------------------------------------------------------------

-- Ritme 24 jam: jumlah gempa per jam (termasuk jam kosong -> nol).
create or replace function ops_hourly()
returns table (bucket timestamptz, quakes bigint, max_mag real)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform assert_role('operational');
  return query
  with hours as (
    select gs as bucket
    from generate_series(date_trunc('hour', now()) - interval '23 hours',
                         date_trunc('hour', now()),
                         interval '1 hour') gs)
  select h.bucket,
         coalesce(count(e.id), 0)::bigint,
         coalesce(max(e.magnitude), 0)::real
  from hours h
  left join earthquakes e
    on e.source = 'bmkg_live'
   and e.event_time >= h.bucket
   and e.event_time <  h.bucket + interval '1 hour'
  group by h.bucket
  order by h.bucket;
end $$;

-- Gempa yang dirasakan (info magnitudo terisi) dalam 48 jam dari feed BMKG.
create or replace function ops_felt(p_limit int default 10)
returns table (id bigint, event_time timestamptz, lat double precision,
               lon double precision, depth_km real, magnitude real,
               location_text text, province text, felt_info text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform assert_role('operational');
  return query
  select id, event_time, lat, lon, depth_km, magnitude,
         location_text, province, felt_info
  from earthquakes
  where source = 'bmkg_live'
    and felt_info is not null
    and felt_info <> ''
    and event_time >= now() - interval '48 hours'
  order by event_time desc
  limit greatest(coalesce(p_limit, 10), 1)::int;
end $$;

-- Gempa kuat terakhir yang tercatat pada katalog historis USGS (M >= 4,5).
-- Catatan: katalog USGS statis hingga 2025-12; label UI menyebut rentang ini.
create or replace function ops_strong_recent(p_limit int default 10)
returns table (id bigint, event_time timestamptz, magnitude real,
               depth_km real, location_text text, province text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform assert_role('operational');
  return query
  select id, event_time, magnitude, depth_km, location_text, province
  from earthquakes
  where source = 'usgs'
    and magnitude >= 4.5
    and province <> 'Luar Cakupan'
  order by event_time desc
  limit greatest(coalesce(p_limit, 10), 1)::int;
end $$;

-- ----------------------------------------------------------------------------
-- TAKTIS — kontribusi provinsi dan riwayat wilayah siaga
-- ----------------------------------------------------------------------------

-- Kontribusi provinsi teratas untuk bulan terpilih, dipecah per kelas
-- magnitudo (mengikuti filter kelas magnitudo/kedalaman di halaman).
create or replace function tactical_contrib(p_month date, p_mag text[], p_depth text[],
                                            p_provinces int default 8)
returns table (province text, bucket text, sort int, quakes bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform assert_role('tactical');
  return query
  with totals as (
    select c.province, coalesce(sum(c.quakes), 0)::bigint as quakes
    from mv_quake_cube c
    where c.month = p_month
      and c.mag_class = any (p_mag)
      and c.depth_class = any (p_depth)
    group by c.province),
  top as (
    select province from totals
    order by quakes desc, province
    limit greatest(coalesce(p_provinces, 8), 1)::int),
  classes (bucket, sort) as (values
    ('4.0-4.9', 1), ('5.0-5.9', 2), ('6.0-6.9', 3), ('7.0+', 4))
  select t.province, k.bucket, k.sort,
         coalesce(sum(c.quakes), 0)::bigint
  from top t
  cross join classes k
  left join mv_quake_cube c
    on c.province = t.province
   and c.month = p_month
   and c.mag_class = k.bucket
   and c.mag_class = any (p_mag)
   and c.depth_class = any (p_depth)
  group by t.province, k.bucket, k.sort
  order by (select quakes from totals o where o.province = t.province) desc, t.province, k.sort;
end $$;

-- Riwayat wilayah siaga 24 bulan terakhir (metric = tactical_ranking;
-- ambang tetap: z > 1, minimal 5 tahun pembanding, gempa >= 3).
create or replace function tactical_alert_history(p_months int default 24)
returns table (month date, province text, quakes bigint,
               baseline numeric, z_score numeric)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform assert_role('tactical');
  return query
  with data_max as (
    select max(month) as last_month from mv_quake_cube),
  months as (
    select gs::date as month
    from generate_series(
           (select last_month - greatest(coalesce(p_months, 24), 1)::int * interval '1 month'
              + interval '1 month' from data_max),
           (select last_month from data_max),
           interval '1 month') gs),
  cur as (
    select m.month, p.name as province,
           coalesce(sum(c.quakes), 0)::bigint as quakes
    from months m
    cross join provinces p
    left join mv_quake_cube c
      on c.province = p.name
     and c.month = m.month
    group by 1, 2),
  hist as (
    select m.month, p.name as province, y.yr,
           coalesce(sum(c.quakes), 0)::bigint as quakes
    from months m
    cross join provinces p
    cross join lateral generate_series(2010, extract(year from m.month)::int - 1) as y(yr)
    left join mv_quake_cube c
      on c.province = p.name
     and c.month = make_date(y.yr, extract(month from m.month)::int, 1)
    group by 1, 2, 3),
  stats as (
    select month, province,
           avg(quakes) as mean,
           stddev_samp(quakes) as sd,
           count(*)::int as n_years
    from hist
    group by 1, 2)
  select c.month, c.province, c.quakes,
         round(stats.mean, 1),
         round(coalesce((c.quakes - stats.mean) / nullif(stats.sd, 0), 0), 2)
  from cur c
  join stats using (month, province)
  where stats.n_years >= 5
    and stats.sd > 0
    and c.quakes >= 3
    and (c.quakes - stats.mean) / stats.sd > 1
  order by c.month desc, (c.quakes - stats.mean) / stats.sd desc;
end $$;

-- ----------------------------------------------------------------------------
-- STRATEGIS
-- ----------------------------------------------------------------------------

-- Histogram magnitudo seluruh katalog (M >= 4, langkah 0,5).
create or replace function strategic_mag_hist()
returns table (bucket text, sort int, quakes bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform assert_role('strategic');
  return query
  with classes (bucket, sort, lo, hi) as (values
    ('4.0-4.4', 1,  4.0, 4.45), ('4.5-4.9', 2,  4.45, 4.95),
    ('5.0-5.4', 3,  4.95, 5.45), ('5.5-5.9', 4,  5.45, 5.95),
    ('6.0-6.4', 5,  5.95, 6.45), ('6.5-6.9', 6,  6.45, 6.95),
    ('7.0-7.4', 7,  6.95, 7.45), ('7.5+',   8,  7.45, 99.0))
  select classes.bucket, classes.sort,
         coalesce(count(e.id), 0)::bigint
  from classes
  left join earthquakes e
    on e.source = 'usgs'
   and e.province <> 'Luar Cakupan'
   and e.magnitude >= classes.lo
   and e.magnitude <  classes.hi
  group by classes.bucket, classes.sort
  order by classes.sort;
end $$;

-- Sampel sebaran kedalaman x magnitudo (800 titik acak) untuk scatter.
create or replace function strategic_scatter(p_sample int default 800)
returns table (depth_km real, magnitude real)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform assert_role('strategic');
  return query
  select depth_km, magnitude
  from earthquakes
  where source = 'usgs'
    and province <> 'Luar Cakupan'
  order by random()
  limit greatest(coalesce(p_sample, 800), 1)::int;
end $$;

-- ----------------------------------------------------------------------------
-- Grant execute (mengikuti pola migrasi 05).
-- ----------------------------------------------------------------------------
grant execute on function
  ops_hourly(), ops_felt(int), ops_strong_recent(int),
  tactical_contrib(date, text[], text[], int),
  tactical_alert_history(int),
  strategic_mag_hist(), strategic_scatter(int)
to authenticated;
