-- =============================================================================
-- SiagaGempa — Migrasi 00: Ekstensi (PRD §15 langkah 1)
-- WAJIB dijalankan pertama: pg_cron menyediakan schema `cron`, pg_net menyedia-
-- kan net.http_post yang dipakai 0006_cron.sql. Vault bawaan Supabase sudah ada.
-- Alternatif: Dashboard → Database → Extensions → aktifkan pg_cron dan pg_net.
-- =============================================================================

create extension if not exists pg_cron with schema pg_catalog;   -- scheduler
create extension if not exists pg_net;                            -- net.http_post
