import { createClient } from '@supabase/supabase-js'
import { AUTH_DOMAIN } from '@/config'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/*
 * Klien Supabase tunggal (PRD 5.2). Sesi disimpan di sessionStorage, bukan
 * localStorage (aturan PRD; browser devtools wajib bersih dari token).
 */
export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          storage: sessionStorage,
          storageKey: 'sg.auth',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          flowType: 'pkce',
        },
      })
    : null

export const MISSING_BACKEND =
  'Backend belum dikonfigurasi: isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env.local.'
