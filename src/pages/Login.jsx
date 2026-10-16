import { MonitorPlay, UserRound, Waves } from 'lucide-react'
import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import Wordmark from '@/components/layout/Wordmark'
import GlassPanel from '@/components/ui/GlassPanel'
import StatusBadge from '@/components/ui/StatusBadge'
import { ROLES } from '@/config'
import { useAuth } from '@/context/AuthContext'

const REMEMBER_KEY = 'sg.pw.remember'

/* Tiga akun tunggal yang diberikan pengelola; password kini ditetapkan pengguna. */
const QUICK_ACCOUNTS = [
  { username: 'admin1', label: 'admin1', hint: 'Dashboard Operasional' },
  { username: 'admin2', label: 'admin2', hint: 'Dashboard Taktis' },
  { username: 'admin3', label: 'admin3', hint: 'Dashboard Strategis' },
]

function readRemembered() {
  try {
    return sessionStorage.getItem(REMEMBER_KEY) ?? ''
  } catch {
    return ''
  }
}

export default function Login() {
  const { session, login, error } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(readRemembered() !== '')
  const [submitting, setSubmitting] = useState(false)
  const [quickError, setQuickError] = useState(null)

  /* AUTH-07: sudah login membuka /login diarahkan ke beranda role. */
  if (session) return <Navigate to={ROLES[session.role]?.path ?? '/'} replace />

  const handleLogin = async (user, pass) => {
    setSubmitting(true)
    const ok = await login(user, pass)
    if (ok && remember) {
      sessionStorage.setItem(REMEMBER_KEY, pass)
    } else if (!ok) {
      setQuickError('Username atau password salah.')
      sessionStorage.removeItem(REMEMBER_KEY)
    }
    setSubmitting(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await handleLogin(username, password)
  }

  /* Tombol cepat: password teringkat di perangkat → sekali klik langsung masuk. */
  const handleQuick = async (account) => {
    const remembered = readRemembered()
    if (remembered) {
      await handleLogin(account.username, remembered)
      return
    }
    setUsername(account.username)
    setQuickError(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-panel md:grid-cols-[1.1fr_1fr]">
        <div className="glass hidden flex-col justify-between p-8 md:flex">
          <Wordmark />
          <div className="flex flex-col gap-4">
            <StatusBadge label="Proyek Akademik" tone="neutral" />
            <h1 className="text-2xl font-semibold leading-tight text-text-1">
              Dashboard Mitigasi dan{' '}
              <span className="text-brand-300">Respons Gempa</span>
            </h1>
            <p className="text-sm leading-relaxed text-text-2">
              Satu sistem untuk pengambil keputusan kebencanaan: siaga harian, penempatan logistik
              bulanan, dan prioritas anggaran mitigasi.
            </p>
          </div>
          <ul className="flex flex-col gap-2 text-xs text-text-2">
            <li className="flex items-center gap-2">
              <MonitorPlay size={16} strokeWidth={1.75} className="text-brand-300" aria-hidden="true" />
              Data live BMKG diperbarui tiap 5 menit
            </li>
            <li className="flex items-center gap-2">
              <Waves size={16} strokeWidth={1.75} aria-hidden="true" className="text-brand-300" />
              Katalog historis USGS 2010-2025
            </li>
          </ul>
        </div>

        <GlassPanel as="div" className="flex flex-col gap-5 p-8">
          <div className="md:hidden">
            <Wordmark />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-1">Masuk</h2>
            <p className="mt-1 text-xs text-text-2">
              Ketik password sekali, lalu pilih tombol cepat — tidak perlu mengulang. Password hanya
              tersimpan di perangkat ini (sessionStorage), tidak di kode.
            </p>
          </div>

          {/* Akses cepat per akun */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-text-2">Akun cepat</p>
            {QUICK_ACCOUNTS.map((account) => (
              <button
                key={account.username}
                type="button"
                disabled={submitting}
                onClick={() => handleQuick(account)}
                className="flex items-center gap-3 rounded-control border border-white/20 bg-white/[0.04] px-3 py-2.5 text-left transition-colors hover:bg-white/10 disabled:opacity-60"
              >
                <UserRound size={18} strokeWidth={1.75} className="text-brand-300" aria-hidden="true" />
                <span className="text-sm font-medium text-text-1">{account.label}</span>
                <span className="text-xs text-text-2">{account.hint}</span>
              </button>
            ))}
            {quickError ? (
              <p role="alert" className="rounded-control border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
                {quickError}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-3 text-xs text-text-2">
            <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
            atau isi manual
            <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-2">Username</span>
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
              <span className="text-xs font-medium text-text-2">Password</span>
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

            <label className="flex items-center gap-2 text-xs text-text-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-white/30 bg-brand-900/70 accent-blue-400"
              />
              Ingat password di perangkat ini
            </label>

            {error ? (
              <p role="alert" className="rounded-control border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-control bg-brand-700 px-4 py-2.5 text-sm font-medium text-text-1 transition-colors hover:bg-brand-500 disabled:opacity-60"
            >
              <LogIn size={16} strokeWidth={1.75} aria-hidden="true" />
              {submitting ? 'Memproses…' : 'Masuk'}
            </button>
          </form>

          <p className="text-xs text-text-2">Proyek akademik, bukan produk resmi BMKG.</p>
        </GlassPanel>
      </div>
    </div>
  )
}
