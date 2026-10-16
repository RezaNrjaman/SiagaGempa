-- =============================================================================
-- Buat / reset tiga akun admin via SQL Editor (permintaan pemilik).
-- ATTENSI (PRD §7.5): password di sini sengaja dibuat lemah oleh pemilik
-- (admin1/admin2/admin3) karena app satu pengguna. Tidak boleh dipakai di
-- produksi multi-user, dan berkas ini JANGAN di-commit ke repo publik.
-- Idempoten: bisa dijalankan ulang (reset password / perbaikan profil).
-- =============================================================================

create extension if not exists pgcrypto;  -- crypt + gen_salt (bcrypt)

-- ---------------------------------------------------------------------------
-- 1. User di Supabase Auth (schema auth) — domain harus VITE_AUTH_DOMAIN
-- ---------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin' || n || '@siagagempa.app',
  crypt('admin' || n, gen_salt('bf', 10)),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  '', '', '', ''
from generate_series(1, 3) as g(n)
on conflict (email) do update
  set encrypted_password = excluded.encrypted_password,
      email_confirmed_at = now(),
      updated_at = now();

-- ---------------------------------------------------------------------------
-- 2. Identitas provider email (auth.identities) — WAJIB untuk sign-in v2
-- ---------------------------------------------------------------------------
insert into auth.identities (user_id, provider, provider_id, identity_data, last_sign_in_at, created_at, updated_at)
select u.id, 'email', 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       now(), now(), now()
from auth.users u
where u.email in ('admin1@siagagempa.app', 'admin2@siagagempa.app', 'admin3@siagagempa.app')
on conflict (provider_id, lower(identity_data ->> 'sub')) do update
  set identity_data = excluded.identity_data,
      updated_at = now();

-- ---------------------------------------------------------------------------
-- 3. Pemetaan role (tabel profiles) — admin1=operational, admin2=tactical,
--    admin3=strategic; ini menentukan dashboard mana yg dibuka tiap akun.
-- ---------------------------------------------------------------------------
insert into profiles (id, username, role)
select id,
       split_part(email, '@', 1),
       case split_part(email, '@', 1)
         when 'admin1' then 'operational'
         when 'admin2' then 'tactical'
         when 'admin3' then 'strategic' end
from auth.users
where email in ('admin1@siagagempa.app', 'admin2@siagagempa.app', 'admin3@siagagempa.app')
on conflict (id) do update set role = excluded.role, username = excluded.username;

-- ---------------------------------------------------------------------------
-- 4. Verifikasi — hasil harus 3 baris, semuanya ter-konfirmasi
-- ---------------------------------------------------------------------------
select u.email                              as email,
       u.email_confirmed_at is not null      as confirmed,
       p.username,
       p.role
from auth.users u
left join profiles p on p.id = u.id
where u.email like 'admin%@siagagempa.app'
order by u.email;
