-- =============================================================================
-- SiagaGempa — Migrasi 07: Uji pgTAP (PRD §16.1)
-- Lulusan wajib: assert_role menolak role salah (42501); strategic_risk dan
-- tactical_ranking selalu 38 baris; baseline menghitung bulan bernilai nol.
-- Jalankan di lingkungan uji (pgTAP tersedia di Supabase). Semua dalam
-- transaksi penting fungsi bisa di-rollback.
-- =============================================================================

begin;

create extension if not exists pgtap;

select plan(5);

-- ---------------------------------------------------------------------------
-- Persiapan: satu province mati + tiga user uji (rollback bersama transaksi).
-- ---------------------------------------------------------------------------
insert into provinces (name, geom) values
  ('Test Provinsi A', ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON('{
    "type": "MultiPolygon",
    "coordinates": [[[[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]]]]
  }'), 4326))),
  ('Test Provinsi B', ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON('{
    "type": "MultiPolygon",
    "coordinates": [[[[101.0, 0.0], [102.0, 0.0], [102.0, 1.0], [101.0, 1.0], [101.0, 0.0]]]]
  }'), 4326)));

-- user kalibrasi opsional: 2 tahun sumber untuk menghitung baseline.
insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000aa',
   'authenticated', 'authenticated', 'test-strategic@siagagempa.app', 'x', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000bb',
   'authenticated', 'authenticated', 'test-tactical@siagagempa.app', 'x', now(), now(), now());

insert into profiles (id, username, role) values
  ('00000000-0000-0000-0000-0000000000aa', 'test-strategic', 'strategic'),
  ('00000000-0000-0000-0000-0000000000bb', 'test-tactical', 'tactical');

-- ---------------------------------------------------------------------------
-- Uji 1: assert_role menolak tanpa konteks auth (42501)
-- ---------------------------------------------------------------------------
select throws_ok(
  'select assert_role(''operational'')',
  '42501',
  'assert_role tanpa jwt harus 42501');

-- ---------------------------------------------------------------------------
-- Uji 2 & 3: strategic_risk dan tactical_ranking selalu 38 baris
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000aa","role":"authenticated"}', false);

select is(
  (select count(*) from strategic_risk()),
  (select count(*) from provinces)::bigint,
  'strategic_risk mengembalikan baris untuk SEMUA provinsi (termasuk 0 gempa)');

-- ---------------------------------------------------------------------------
-- Uji 4: baseline menghitung bulan bernilai nol
-- Data: Nov 2024 ada 1 gempa; gempa pembanding di Nov 2022 & Nov 2023.
-- Baseline untuk 2024-11 = rata-rata Nov 2010..2023 = (0+...+1+1+0+...)/14.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000bb","role":"authenticated"}', false);

insert into earthquakes (event_time, lat, lon, depth_km, magnitude, location_text, source) values
  ('2024-11-05 08:00+07', 100.3, 0.4, 12, 4.5, 'Uji A', 'usgs'),
  ('2023-11-05 08:00+07', 100.3, 0.4, 12, 4.5, 'Uji A', 'usgs'),
  ('2022-11-05 08:00+07', 100.3, 0.4, 12, 4.5, 'Uji A', 'usgs');

select is(
  (select baseline from tactical_series('2024-11-01', 'Test Provinsi A',
    array['4.0-4.9','5.0-5.9','6.0-6.9','7.0+'], array['Dangkal','Menengah','Dalam'])
  where month = date '2024-11-01'),
  2.0::numeric / 14.0,
  'baseline memperhitungkan tahun tanpa gempa (nol dihitung)');

-- ---------------------------------------------------------------------------
-- Uji 5: wilayah siaga hanya saat semua syarat terpenuhi (z > 1, n >= 5 tahun)
-- ---------------------------------------------------------------------------
select is(
  (select is_alert from tactical_ranking('2025-02-01',
    array['4.0-4.9','5.0-5.9','6.0-6.9','7.0+'], array['Dangkal','Menengah','Dalam'])
  where province = 'Test Provinsi A'),
  false,
  'dengan 3 tahun pembanding (< 5), is_alert lebih dulu false');

rollback;
