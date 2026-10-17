import { LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Wordmark from '@/components/layout/Wordmark'
import { ROLES } from '@/config'
import { formatTimeWIB } from '@/lib/format'
import { useAuth } from '@/context/AuthContext'

const TONE_DOT = {
  operational: 'bg-emerald-500',
  tactical: 'bg-sky-500',
  strategic: 'bg-brand-500',
}

/* Jam dinding WIB yang berdetak: konteks siaga harian yang nyata, bukan hiasan. */
function useLiveClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return formatTimeWIB(now)
}

function initials(username) {
  return (username ?? '').slice(0, 2).toUpperCase()
}

export default function AppShell({ children }) {
  const { role, username, logout } = useAuth()
  const navigate = useNavigate()
  const roleMeta = ROLES[role]
  const clock = useLiveClock()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass sticky top-0 z-30 border-x-0 border-t-0 border-b border-grid">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Wordmark />
            <span className="hidden items-center gap-2 rounded-control border border-slate-200 bg-white/70 px-2.5 py-1 text-xs font-medium text-text-2 sm:inline-flex">
              <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[role]}`} aria-hidden="true" />
              {roleMeta?.label ?? role}
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden items-center gap-2 rounded-control border border-slate-200 bg-white/70 px-2.5 py-1 text-xs font-medium text-text-2 md:inline-flex">
              <span className="ping-dot text-emerald-500" aria-hidden="true">
                <span className="block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Live · <span className="tnum text-text-1">{clock} WIB</span>
            </span>
            <span className="flex items-center gap-2 rounded-control border border-slate-200 bg-white/70 px-2 py-1">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-700 to-brand-500 text-[10px] font-bold text-white">
                {initials(username)}
              </span>
              <span className="hidden text-xs font-medium text-text-1 sm:inline">{username}</span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-control border border-slate-200 bg-white/70 px-3 py-1.5 text-sm text-text-1 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>

      <footer className="mx-auto w-full max-w-[1440px] px-4 pb-8 pt-2 md:px-6">
        <div className="flex flex-col gap-1 border-t border-grid pt-4 text-xs text-text-2 md:flex-row md:items-start md:justify-between">
          <p>Sumber data: BMKG (live, m ≥ 5 atau dirasakan) · USGS (historis 2010-2025).</p>
          <p>Proyek akademik, bukan produk resmi BMKG.</p>
        </div>
      </footer>
    </div>
  )
}
