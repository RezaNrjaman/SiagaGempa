-- =============================================================================
-- SiagaGempa — Migrasi 04: RPC dasbor (PRD §8)
-- Semua: security definer, stable, search_path = public, baris pertama
-- memanggil assert_role. Ambang kelas hanya ada di SQL ini (PRD §8.1).
-- =============================================================================

-- ----------------------------------------------------------------------------
-- OPERASIONAL
-- ----------------------------------------------------------------------------

create or replace function ops_summary()
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
             and (e.event_time at time zone 'Asia/Jakarta')::date
               = (now() at time zone 'Asia/Jakarta')::date),
         case when exists (select 1 from w where tsunami_potential) then 'Berpotensi' else 'Aman' end,
         case when coalesce((select max(magnitude) from w), 0) >= 6 then 'Merah'
              when coalesce((select max(magnitude) from w), 0) >= 5 then 'Kuning'
              else 'Hijau' end,
         now()
  from l;
end $$;

create or replace function ops_latest(p_limit int default 15)
returns table (id bigint, event_time timestamptz, lat double precision,
               lon double precision, depth_km real, magnitude real,
               location_text text, province text, felt_info text,
               tsunami_potential boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform assert_role('operational');
  return query
  select id, event_time, lat, lon, depth_km, magnitude,
         location_text, province, felt_info, tsunami_potential
  from earthquakes
  where source = 'bmkg_live'
  order by event_time desc
  limit greatest(coalesce(p_limit, 15), 1)::int;
end $$;

-- ----------------------------------------------------------------------------
-- TAKTIS — kerangka waktu generate_series + LEFT JOIN (PRD §8.4)
-- ----------------------------------------------------------------------------

-- 12 bulan terakhir; baseline = rata-rata bulan kalender sama pada tahun-tahun
-- SEBELUM tahun terpilih (nol dihitung); null bila belum ada tahun pembanding.
create or replace function tactical_series(p_month date, p_province text, p_mag text[], p_depth text[])
returns table (month date, quakes int, baseline numeric)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform assert_role('tactical');
  return query
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
end $$;

-- Peringkat 38 provinsi (termasuk yang bernilai 0): LEFT JOIN provinces wajib.
-- Wilayah siaga: z > 1, minimal 5 tahun pembanding, stddev > 0, quakes >= 3.
create or replace function tactical_ranking(p_month date, p_mag text[], p_depth text[])
returns table (province text, quakes bigint, baseline numeric,
               z_score numeric, is_alert boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform assert_role('tactical');
  return query
  with months as (
    select date_trunc('month', p_month)::date as month),
  years as (
    select g.yr from generate_series(2010, extract(year from p_month)::int - 1) as g(yr)),
  cur as (
    select p.name as province,
           coalesce((select sum(c.quakes) from mv_quake_cube c
                     where c.province = p.name
                       and c.month = (select month from months)
                       and c.mag_class = any (p_mag) and c.depth_class = any (p_depth)), 0)::bigint as quakes
    from provinces p),
  hist as (
    select p.name as province, y.yr,
           coalesce(sum(c.quakes), 0)::bigint as quakes
    from provinces p
    cross join years y
    left join mv_quake_cube c
      on c.province = p.name
     and c.month = make_date(y.yr, extract(month from p_month)::int, 1)
     and c.mag_class = any (p_mag) and c.depth_class = any (p_depth)
    group by 1, 2),
  stats as (
    select province,
           avg(quakes)       as mean,
           stddev_samp(quakes) as sd,
           count(*)::int     as n_years
    from hist
    group by province)
  select cur.province,
         cur.quakes,
         round(stats.mean, 1),
         round(coalesce((cur.quakes - stats.mean) / nullif(stats.sd, 0), 0), 2),
         coalesce(stats.n_years >= 5 and stats.sd > 0 and cur.quakes >= 3
                  and (cur.quakes - stats.mean) / stats.sd > 1, false)
  from cur
  join stats using (province)
  order by quakes desc, province;
end $$;

-- Distribusi per kelas magnitudo dan kedalaman (7 bucket tetap, nol dihitung).
create or replace function tactical_distribution(p_month date, p_province text, p_mag text[], p_depth text[])
returns table (dimension text, bucket text, sort int, quakes int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform assert_role('tactical');
  return query
  with buckets (dimension, bucket, sort) as (values
    ('magnitude', '4.0-4.9', 1), ('magnitude', '5.0-5.9', 2),
    ('magnitude', '6.0-6.9', 3), ('magnitude', '7.0+',   4),
    ('depth', 'Dangkal', 1), ('depth', 'Menengah', 2), ('depth', 'Dalam', 3))
  select b.dimension, b.bucket, b.sort,
         coalesce(sum(c.quakes), 0)::int as quakes
  from buckets b
  left join mv_quake_cube c
    on c.month = p_month
   and (p_province is null or c.province = p_province)
   and ((b.dimension = 'magnitude' and c.mag_class = b.bucket and c.mag_class = any (p_mag))
     or (b.dimension = 'depth'   and c.depth_class = b.bucket and c.depth_class = any (p_depth)))
  group by b.dimension, b.bucket, b.sort
  order by b.dimension, b.sort;
end $$;

-- ----------------------------------------------------------------------------
-- STRATEGIS
-- ----------------------------------------------------------------------------

create or replace function strategic_yearly()
returns table (year int, quakes bigint, m6_plus bigint,
               shallow bigint, intermediate bigint, deep bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform assert_role('strategic');
  return query
  with years as (
    select gs::int as year from generate_series(2010, 2025) gs),
  agg as (
    select extract(year from event_time at time zone 'Asia/Jakarta')::int as year,
           count(*)                                        as quakes,
           count(*) filter (where magnitude >= 6)          as m6_plus,
           count(*) filter (where depth_km < 70)           as shallow,
           count(*) filter (where depth_km between 70 and 300) as intermediate,
           count(*) filter (where depth_km > 300)          as deep
    from earthquakes
    where source = 'usgs' and province <> 'Luar Cakupan'
    group by 1)
  select y.year,
         coalesce(a.quakes, 0), coalesce(a.m6_plus, 0),
         coalesce(a.shallow, 0), coalesce(a.intermediate, 0), coalesce(a.deep, 0)
  from years y
  left join agg a using (year)
  order by y.year;
end $$;

create or replace function strategic_risk()
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

create or replace function strategic_heat()
returns table (cell_lat double precision, cell_lon double precision, quakes bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform assert_role('strategic');
  return query
  select cell_lat, cell_lon, quakes from mv_heat_grid;
end $$;

create or replace function strategic_significant()
returns table (event_time timestamptz, magnitude real, depth_km real,
               location_text text, province text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform assert_role('strategic');
  return query
  select event_time, magnitude, depth_km, location_text, province
  from earthquakes
  where source = 'usgs' and province <> 'Luar Cakupan'
  order by magnitude desc, event_time desc
  limit 20;
end $$;
