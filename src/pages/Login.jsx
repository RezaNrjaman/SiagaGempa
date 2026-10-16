import { MonitorPlay, UserRound, Waves, Activity, LogIn } from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import Wordmark from '@/components/layout/Wordmark'
import GlassPanel from '@/components/ui/GlassPanel'
import { ROLES } from '@/config'
import { useAuth } from '@/context/AuthContext'

/*
 * [Patch PRD §5.1 oleh pemilik — app single-user]: password pengingat disimpan
 * di localStorage PER AKUN (`sg.pw.<username>`) supaya tombol cepat tiap
 * dashboard cukup sekali klik meski password tiap akun berbeda. Token sesi
 * Supabase tetap di sessionStorage; tidak ada kredensial di kode/repo.
 */
const REMEMBER_PREFIX = 'sg.pw.'

/* Tiga akun tunggal yang diberikan pengelola; password ditetapkan pengelola. */
const QUICK_ACCOUNTS = [
  { username: 'admin1', label: 'admin1', hint: 'Dashboard Operasional' },
  { username: 'admin2', label: 'admin2', hint: 'Dashboard Taktis' },
  { username: 'admin3', label: 'admin3', hint: 'Dashboard Strategis' },
]

function readRemembered(user) {
  try {
    return localStorage.getItem(`${REMEMBER_PREFIX}${user}`) ?? ''
  } catch {
    return ''
  }
}

function anyRemembered() {
  return QUICK_ACCOUNTS.some((account) => readRemembered(account.username) !== '')
}

export default function Login() {
  const { session, login, error } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(anyRemembered())
  const [submitting, setSubmitting] = useState(false)
  const [quickError, setQuickError] = useState(null)

  /* AUTH-07: sudah login membuka /login diarahkan ke beranda role. */
  if (session) return <Navigate to={ROLES[session.role]?.path ?? '/'} replace />

  const handleLogin = async (user, pass, { silent = false } = {}) => {
    setSubmitting(true)
    setQuickError(null)
    const key = `${REMEMBER_PREFIX}${user}`
    const ok = await login(user, pass)
    if (ok) {
      if (remember) localStorage.setItem(key, pass)
      else localStorage.removeItem(key)
    } else {
      localStorage.removeItem(key)
      if (!silent) setQuickError('Username atau password salah.')
      else setQuickError(`Password akun ${user} belum tersimpan — isi manual sekali.`)
    }
    setSubmitting(false)
    return ok
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await handleLogin(username, password)
  }

  /* Tombol cepat: password akun ini sudah teringat → sekali klik langsung masuk. */
  const handleQuick = async (account) => {
    const remembered = readRemembered(account.username)
    if (remembered) {
      await handleLogin(account.username, remembered, { silent: true })
      return
    }
    setUsername(account.username)
    setQuickError(`Isi password ${account.username} sekali (centang "Ingat password"), berikutnya cukup klik.`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      {/* Luar: wadah tunggal dengan satu lapis blur (PRD 10.3). */}
      <div className="w-full max-w-6xl overflow-hidden border border-white/10 bg-brand-900/30 shadow-[0_24px_48px_rgb(0_0_0_/_0_45)]">
        <div className="grid w-full overflow-hidden md:grid-cols-[1.35fr_1fr]">

          {/* Kiri: merek dan nilai proyek (tanpa teks contoh / dekorasi kosong). */}
          <div className="hidden p-10 md:flex flex-col justify-between">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <Wordmark />
                <span className="text-[10px] font-medium uppercase tracking-wider text-brand-300">
                  Proyek akademik
                </span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-text-1 leading-tight">
                SiagaGempa
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-text-2/90 max-w-md">
                Sistem pengambilan keputusan kebencanaan untuk BPBD: siaga harian,
                penempatan logistik bulanan, dan prioritas anggaran mitigasi.
              </p>
              <ul className="mt-6 flex flex-col gap-3 text-sm text-text-2/80">
                <li className="flex items-center gap-2.5">
                  <MonitorPlay size={16} className="text-brand-300" aria-hidden="true" />
                  Data live BMKG diperbarui tiap 5 menit
                </li>
                <li className="flex items-center gap-2.5">
                  <Waves size={16} className="text-brand-300" aria-hidden="true" />
                  Katalog historis USGS 2010-2025
                </li>
                <li className="flex items-center gap-2.5">
                  <Activity size={16} className="text-brand-300" aria-hidden="true" />
                  Tiga role dashboard: operasional, taktis, strategis
                </li>
              </ul>
            </div>
            <p className="text-[10px] text-text-2/60">
              Proyek akademik, bukan produk resmi BMKG.
            </p>
          </div>

          {/* Kanan: formulir masuk dalam panel kaca. */}
          <GlassPanel className="flex-1 p-10 md:p-12">
            <div className="flex items-center gap-2 mb-2">
              <Wordmark className="shrink-0" />
              <span className="text-xs font-medium uppercase tracking-wider text-text-2">
                SiagaGempa
              </span>
            </div>
            <h2 className="mt-1 text-xl font-semibold text-text-1">Masuk ke dashboard</h2>
            <p className="mt-1 text-xs text-text-2">
              Isi password <span className="text-text-1">sekali per akun</span>, lalu klik tombol
              cepat kapan pun — tidak perlu mengetik lagi.
            </p>

            {/* Akses cepat per akun */}
            <div className="mt-6 flex flex-col gap-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-text-2">
                Akses cepat
              </p>
              {QUICK_ACCOUNTS.map((account) => {
                const ready = readRemembered(account.username) !== ''
                return (
                  <button
                    key={account.username}
                    type="button"
                    disabled={submitting}
                    onClick={() => handleQuick(account)}
                    className={`flex items-center gap-3 rounded-control border px-3 py-2.5 text-left transition-colors ${
                      ready
                        ? 'border-brand-500/60 bg-brand-700/20 text-text-1 hover:bg-brand-700/30'
                        : 'border-white/10 bg-white/5 text-text-2/70 hover:bg-white/10'
                    } disabled:opacity-50`}
                  >
                    <UserRound size={18} strokeWidth={1.75} className="text-brand-300" aria-hidden="true" />
                    <span className="text-sm font-medium text-text-1">{account.label}</span>
                    <span className="text-xs text-text-2">{account.hint}</span>
                    <span
                      className={`ml-auto text-[10px] font-medium ${
                        ready ? 'text-ok' : 'text-text-2'
                      }`}
                    >
                      {ready ? '1 klik' : 'perlu password'}
                    </span>
                  </button>
                )
              })}
              {quickError ? (
                <p role="alert" className="mt-2 rounded-control border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
                  {quickError}
                </p>
              ) : null}
            </div>

            <div className="mt-7 flex items-center gap-3 text-[10px] text-text-2">
              <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
              atau isi manual
              <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
            </div>

            <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-medium text-text-2">Username</span>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  required
                  className="rounded-control border border-white/20 bg-brand-900/70 px-3 py-2 text-sm text-text-1 placeholder:text-text-2/60 hover:border-white/30 focus:border-brand-300"
                  placeholder="admin1"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-medium text-text-2">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  className="rounded-control border border-white/20 bg-brand-900/70 px-3 py-2 text-sm text-text-1 placeholder:text-text-2/60 hover:border-white/30 focus:border-brand-300"
                  placeholder="••••••••••••"
                />
              </label>

              <label className="flex items-center gap-2 text-[10px] text-text-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-3.5 w-3.5 rounded border-white/30 bg-brand-900/70 accent-brand-500"
                />
                Ingat password di perangkat ini
              </label>

              {error ? (
                <p role="alert" className="mt-1 rounded-control border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-control bg-brand-700 px-4 py-2.5 text-sm font-medium text-text-1 transition-colors hover:bg-brand-500 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
              >
                <LogIn size={16} strokeWidth={1.75} aria-hidden="true" />
                {submitting ? 'Memproses…' : 'Masuk'}
              </button>
            </form>

            <p className="mt-6 text-[10px] text-text-2">Proyek akademik, bukan produk resmi BMKG.</p>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
