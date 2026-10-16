import { MonitorPlay, Waves } from 'lucide-react'
import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import Wordmark from '@/components/layout/Wordmark'
import GlassPanel from '@/components/ui/GlassPanel'
import StatusBadge from '@/components/ui/StatusBadge'
import { ROLES } from '@/config'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
  const { session, login, error } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  /* AUTH-07: sudah login membuka /login diarahkan ke beranda role. */
  if (session) return <Navigate to={ROLES[session.role]?.path ?? '/'} replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    await login(username, password)
    setSubmitting(false)
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
            <p className="text-xs text-text-2">
            Gunakan akun yang diberikan pengelola. Password disimpan di password manager.
          </p>
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
