-- =============================================================================
-- SiagaGempa — Migrasi 05: Proteksi (PRD §7.4)
-- RLS, pencabutan akses langsung, dan grant execute hanya untuk RPC role.
-- =============================================================================

alter table earthquakes enable row level security;   -- tanpa policy: tertutup
alter table provinces   enable row level security;
alter table profiles    enable row level security;

create policy profiles_self_read on profiles
  for select to authenticated using (id = auth.uid());

revoke all on earthquakes, provinces, profiles, mv_quake_cube, mv_heat_grid from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function
  ops_summary(), ops_latest(int),
  tactical_series(date, text, text[], text[]),
  tactical_ranking(date, text[], text[]),
  tactical_distribution(date, text, text[], text[]),
  strategic_yearly(), strategic_risk(), strategic_heat(), strategic_significant()
to authenticated;

-- service_role (Edge Function ingest) tetap hanya boleh memasukkan data.
grant execute on function
  ingest_quakes(jsonb)
to service_role;

-- profiles_self_read dipakai AuthContext untuk(role, username).
grant select on profiles to authenticated;
