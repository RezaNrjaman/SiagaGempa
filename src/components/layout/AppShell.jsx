import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Wordmark from '@/components/layout/Wordmark'
import { ROLES } from '@/config'
import { useAuth } from '@/context/AuthContext'

const TONE_DOT = {
  operational: 'bg-brand-300',
  tactical: 'bg-brand-500',
  strategic: 'bg-brand-700',
}

export default function AppShell({ children }) {
  const { role, username, logout } = useAuth()
  const navigate = useNavigate()
  const roleMeta = ROLES[role]

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass sticky top-0 z-30 border-x-0 border-t-0 border-b border-white/5">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 md:px-6">
          <Wordmark />
          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden items-center gap-2 rounded-control border border-white/20 bg-white/5 px-2.5 py-1 text-xs font-medium text-text-2 sm:inline-flex">
              <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[role]}`} aria-hidden="true" />
              {roleMeta?.label ?? role}
              <span className="text-text-1">{username}</span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-control border border-white/20 px-3 py-1.5 text-sm text-text-1 transition-colors hover:bg-white/10"
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
          <p>
            Sumber data: BMKG (live) · USGS (historis 2010-2025). Kredit foto: Wikimedia Commons.
          </p>
          <p>Proyek akademik, bukan produk resmi BMKG.</p>
        </div>
      </footer>
    </div>
  )
}
