-- =============================================================================
-- SiagaGempa — Seed user (PRD §7.5)
-- Prasyarat: tiga user dibuat di Supabase Auth (admin1@siagagempa.app, dst.,
-- auto-confirm, password >= 12 karakter, JANGAN ditulis di repo).
-- Jalankan SETELAH user dibuat (Dashboard → Authentication → Add user).
-- =============================================================================

insert into profiles (id, username, role)
select id, split_part(email, '@', 1),
       case split_part(email, '@', 1)
         when 'admin1' then 'operational'
         when 'admin2' then 'tactical'
         when 'admin3' then 'strategic' end
from auth.users
where email in ('admin1@siagagempa.app', 'admin2@siagagempa.app', 'admin3@siagagempa.app')
on conflict (id) do nothing;

-- Setelah ini: nonaktifkan pendaftaran mandiri (Dashboard → Auth Providers →
-- Email → matikan "Enable sign-ups") agar URL signup ditutup (PRD §7.5/§13).
