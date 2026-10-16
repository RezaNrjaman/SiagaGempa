import { AUTH_DOMAIN } from '@/config'
import { MISSING_BACKEND, supabase } from '@/lib/supabase'

const SESSION_KEY = 'sg.session'

/*
 * Adapter Auth (PRD §7.5, AUTH-01): username dikirim sebagai email
 * `<username>@<VITE_AUTH_DOMAIN>`. Role diambil dari tabel `profiles`
 * (policy profiles_self_read) setelah password diverifikasi (AUTH-02).
 */
export async function signIn(username, password) {
  if (!supabase) return { error: 'missing' }
  const email = `${String(username ?? '').trim().toLowerCase()}@${AUTH_DOMAIN}`
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'invalid' }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username, role')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    await supabase.auth.signOut()
    return { error: 'profile' }
  }

  const session = {
    userId: data.user.id,
    username: profile.username,
    email,
    role: profile.role,
    startedAt: Date.now(),
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return { session }
}

export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/* Mengakhiri sesi Auth + membersihkan kaca sesi (AUTH-06). */
export async function signOut() {
  if (supabase) await supabase.auth.signOut()
  sessionStorage.removeItem(SESSION_KEY)
}

export { MISSING_BACKEND }
