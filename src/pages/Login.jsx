import { MonitorPlay, UserRound, Waves, Activity, LogIn } from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import Wordmark from '@/components/layout/Wordmark'
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

/* Perilaku quick-access ditata sebagai tinta/kelas gaya di sini supaya JSX
   ringkas; latar gelap + kartu gradasi mengikuti bahasa visual referensi. */
const FEATURES = [
  { icon: MonitorPlay, text: 'Data live BMKG diperbarui tiap 5 menit' },
  { icon: Waves, text: 'Katalog historis USGS 2010-2025' },
  { icon: Activity, text: 'Tiga role dashboard: operasional, taktis, strategis' },
]

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
    <div className="login-scene relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Blob gradasi mengapung — gerak halus, hanya dekorasi panggung. */}
      <div className="login-blob -left-24 -top-24 h-[26rem] w-[26rem] bg-[#7c3aed]" aria-hidden="true" />
      <div
        className="login-blob -bottom-32 right-[-6rem] h-[30rem] w-[30rem] bg-[#2563eb]"
        style={{ animationDelay: '-6s' }}
        aria-hidden="true"
      />
      <div
        className="login-blob bottom-10 left-1/3 h-[18rem] w-[18rem] bg-[#ec4899]"
        style={{ animationDelay: '-11s' }}
        aria-hidden="true"
      />
      {/* Grid titik di dua pojok, seperti bahasa visual referensi. */}
      <div
        className="login-dots pointer-events-none absolute left-6 top-6 h-40 w-40 opacity-40 [mask-image:radial-gradient(black,transparent_75%)]"
        aria-hidden="true"
      />
      <div
        className="login-dots pointer-events-none absolute bottom-8 right-8 h-40 w-40 opacity-40 [mask-image:radial-gradient(black,transparent_75%)]"
        aria-hidden="true"
      />

      <div className="rise-in relative z-10 w-full max-w-4xl">
        <div className="rounded-panel border border-white/40 bg-gradient-to-br from-indigo-50/95 via-sky-50/95 to-violet-100/90 p-8 shadow-[0_32px_80px_rgb(4_8_28_/_0_55)] backdrop-blur-xl md:p-10">
          <div className="grid items-start gap-8 md:grid-cols-[1.1fr_1fr]">
            {/* Kiri: sapa besar + nilai proyek. */}
            <div>
              <div className="flex items-center gap-2">
                <Wordmark />
                <span className="rounded-full border border-brand-500/20 bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                  Proyek akademik
                </span>
              </div>
              <h1 className="mt-6 text-4xl font-bold leading-tight md:text-5xl">
                <span className="bg-gradient-to-r from-brand-700 via-brand-500 to-violet-500 bg-clip-text text-transparent">
                  Selamat datang
                </span>
                <br />
                <span className="text-text-1">kembali!</span>
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-text-2">
                Sistem pengambilan keputusan kebencanaan untuk BPBD: siaga harian,
                penempatan logistik bulanan, dan prioritas anggaran mitigasi.
              </p>
              <ul className="mt-7 flex flex-col gap-3 text-sm text-text-2">
                {FEATURES.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700/15 to-brand-500/25 text-brand-700">
                      <feature.icon size={15} strokeWidth={1.9} aria-hidden="true" />
                    </span>
                    {feature.text}
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-[10px] text-text-2">
                Proyek akademik, bukan produk resmi BMKG.
              </p>
            </div>

            {/* Kanan: formulir masuk. */}
            <div>
              <h2 className="text-lg font-semibold text-text-1">Masuk ke dashboard</h2>
              <p className="mt-1 text-xs text-text-2">
                Isi password <span className="font-medium text-text-1">sekali per akun</span>, lalu
                klik tombol cepat kapan pun — tidak perlu mengetik lagi.
              </p>

              {/* Akses cepat per akun */}
              <div className="mt-5 flex flex-col gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-2">
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
                      className={`group flex items-center gap-3 rounded-control border px-3 py-2.5 text-left transition-all duration-200 ${
                        ready
                          ? 'border-brand-500/50 bg-white/80 shadow-sm hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md'
                          : 'border-white bg-white/50 hover:-translate-y-0.5 hover:bg-white/80'
                      } disabled:opacity-50`}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-700 to-brand-500 text-white">
                        <UserRound size={15} strokeWidth={1.9} aria-hidden="true" />
                      </span>
                      <span className="text-sm font-semibold text-text-1">{account.label}</span>
                      <span className="text-xs text-text-2">{account.hint}</span>
                      <span
                        className={`ml-auto text-[10px] font-semibold ${
                          ready ? 'text-emerald-600' : 'text-text-2'
                        }`}
                      >
                        {ready ? '1 klik' : 'perlu password'}
                      </span>
                    </button>
                  )
                })}
                {quickError ? (
                  <p
                    role="alert"
                    className="rounded-control border border-red-200 bg-red-50/90 px-3 py-2 text-xs text-red-700"
                  >
                    {quickError}
                  </p>
                ) : null}
              </div>

              <div className="mt-5 flex items-center gap-3 text-[10px] text-text-2">
                <span className="h-px flex-1 bg-brand-500/15" aria-hidden="true" />
                atau isi manual
                <span className="h-px flex-1 bg-brand-500/15" aria-hidden="true" />
              </div>

              <form className="mt-3 flex flex-col gap-3" onSubmit={handleSubmit}>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold text-text-2">Username</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    required
                    placeholder="admin1"
                    className="rounded-control border border-white bg-white/80 px-3 py-2 text-sm text-text-1 shadow-inner placeholder:text-text-2/60 transition-all focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-300/50"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold text-text-2">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••••••"
                    className="rounded-control border border-white bg-white/80 px-3 py-2 text-sm text-text-1 shadow-inner placeholder:text-text-2/60 transition-all focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-300/50"
                  />
                </label>

                <label className="flex items-center gap-2 text-[10px] font-medium text-text-2">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 accent-brand-500"
                  />
                  Ingat password di perangkat ini
                </label>

                {error ? (
                  <p
                    role="alert"
                    className="rounded-control border border-red-200 bg-red-50/90 px-3 py-2 text-xs text-red-700"
                  >
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-shine mt-1 inline-flex items-center justify-center gap-2 rounded-control bg-gradient-to-r from-brand-700 to-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-500/40 disabled:translate-y-0 disabled:opacity-60"
                >
                  <LogIn size={16} strokeWidth={1.75} aria-hidden="true" />
                  {submitting ? 'Memproses…' : 'Masuk'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
