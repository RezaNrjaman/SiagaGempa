-- =============================================================================
-- SiagaGempa — Migrasi 02: Fungsi ingest (PRD §7.2)
-- Dipakai Edge Function dengan service_role; tidak diberi grant ke user biasa.
-- =============================================================================

-- Upsert gempa dari feed BMKG / CSV USGS. Dedup pada (source, event_time, lat, lon).
-- felt_info non-null menang saat konflik; tsunami_potential OR-akumulatif.
create or replace function ingest_quakes(p_rows jsonb) returns int
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

-- Seed 38 provinsi memakai supabase/seed/provinces.sql (hasil npm run
-- gen:provinces) menjalankan insert ST_GeomFromGeoJSON langsung (PRD §6.3).
