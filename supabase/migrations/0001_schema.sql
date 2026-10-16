-- =============================================================================
-- SiagaGempa — Migrasi 01: Skema dasar (PRD §7.1, §7.2)
-- Ekstensi, tabel inti, fungsi pendukung, dan trigger penentuan provinsi.
-- =============================================================================

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
-- Dipakai agregat tahunan / M>=6 historis.
create index earthquakes_usgs_idx on earthquakes (source, province, event_time) where source = 'usgs';

create table profiles (
  id       uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  role     text not null check (role in ('operational', 'tactical', 'strategic'))
);

-- ---------------------------------------------------------------------------
-- Fungsi pendukung (PRD §7.2)
-- ---------------------------------------------------------------------------

-- Satu-satunya pemeriksa hak akses: semua RPC memanggil ini di baris pertama.
create function assert_role(required text) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = required) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end $$;

-- Normalisasi 0-1, dipakai skor kerawanan (PRD §8.1).
create function norm01(v numeric, lo numeric, hi numeric) returns numeric
language sql immutable as $$
  select coalesce((v - lo) / nullif(hi - lo, 0), 0)
$$;

-- Penentuan provinsi untuk semua sumber data: contains, lalu radius 150 km.
create function set_province() returns trigger
language plpgsql as $$
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
