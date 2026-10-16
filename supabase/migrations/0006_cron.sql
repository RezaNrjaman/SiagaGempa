-- =============================================================================
-- SiagaGempa — Migrasi 06: Penjadwalan (PRD §7.6)
-- Prasyarat: ekstensi pg_cron + pg_net aktif, secret 'cron_secret' di Vault,
-- Edge Function 'ingest-bmkg' sudah dideploy (--no-verify-jwt).
-- =============================================================================

-- Ingest feed BMKG tiap 5 menit.
select cron.schedule('ingest-bmkg', '*/5 * * * *', $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/ingest-bmkg',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body    := '{}'::jsonb)
$$);

-- Pembersih feed live > 30 hari, sekali sehari pukul 03:15 WIB (UTC+7 = 20:15 UTC → '15 20').
select cron.schedule('purge-live', '15 20 * * *', $$
  delete from earthquakes where source = 'bmkg_live' and event_time < now() - interval '30 days'
$$);
