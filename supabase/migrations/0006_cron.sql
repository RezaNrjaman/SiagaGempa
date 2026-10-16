-- =============================================================================
-- SiagaGempa — Migrasi 06: Penjadwalan (PRD §7.6)
-- Prasyarat: ekstensi pg_cron + pg_net aktif, Edge Function 'ingest-bmkg'
-- sudah dideploy dengan "Enforce JWT verification" DIMATIKAN.
--
-- Skrip ini IDEMPOTEN: aman dijalankan ulang (job lama dibatalkan lebih dulu).
-- Jalankan seluruh berkas ini dalam satu transaksi. Di SQL Editor, satu berkas
-- = satu transaksi: kalau ada SATU perintah gagal, SEMUA dibatalkan.
-- =============================================================================

-- 1) Secret di Vault: dipakai cron sebagai header x-cron-secret.
--    Nilainya HARUS sama dengan CRON_SECRET di Edge Functions → Secrets.
--    Ganti placeholder di bawah dengan nilai acak milikmu (jangan commit nilai asli).
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'cron_secret') then
    perform vault.create_secret('<CRON_SECRET>', 'cron_secret', 'Secret untuk cron ingest-bmkg');
  end if;
end $$;

-- 2) Ingest feed BMKG tiap 5 menit.
select cron.unschedule('ingest-bmkg')
where exists (select 1 from cron.job where jobname = 'ingest-bmkg');

select cron.schedule('ingest-bmkg', '*/5 * * * *', $cron$
  select net.http_post(
    url     := 'https://rjgwzqtxrcgyofijlvwq.supabase.co/functions/v1/ingest-bmkg',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body    := '{}'::jsonb)
$cron$);

-- 3) Pembersih feed live > 30 hari, sekali sehari pukul 03:15 WIB (UTC+7 = 20:15 UTC).
select cron.unschedule('purge-live')
where exists (select 1 from cron.job where jobname = 'purge-live');

select cron.schedule('purge-live', '15 20 * * *', $cron$
  delete from earthquakes where source = 'bmkg_live' and event_time < now() - interval '30 days'
$cron$);
