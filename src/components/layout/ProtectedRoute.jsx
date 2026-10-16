import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-brand-300" />
    </div>
  )
}

/* Belum login -> /login. Role tidak sesuai -> /forbidden (PRD AUTH-04). */
export default function ProtectedRoute({ role, children }) {
  const { session, loading } = useAuth()

  if (loading) return <FullPageLoader />
  if (!session) return <Navigate to="/login" replace />
  if (role && session.role !== role) return <Navigate to="/forbidden" replace />

  return children
}
