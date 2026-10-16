import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlassPanel from '@/components/ui/GlassPanel'
import { ROLES } from '@/config'
import { useAuth } from '@/context/AuthContext'

export default function NotFound() {
  const { session } = useAuth()
  const target = session ? (ROLES[session.role]?.path ?? '/') : '/login'

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <GlassPanel as="div" className="flex max-w-md flex-col items-center gap-3 p-8 text-center">
        <Compass size={28} strokeWidth={1.75} className="text-brand-300" aria-hidden="true" />
        <h1 className="text-lg font-semibold text-text-1">Halaman tidak ditemukan</h1>
        <p className="text-sm text-text-2">
          Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.
        </p>
        <Link
          to={target}
          className="rounded-control bg-brand-700 px-4 py-2 text-sm font-medium text-text-1 transition-colors hover:bg-brand-500"
        >
          Kembali ke beranda
        </Link>
      </GlassPanel>
    </div>
  )
}
