import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import { ROLES } from '@/config'
import { useAuth } from '@/context/AuthContext'

const Login = lazy(() => import('@/pages/Login'))
const Operational = lazy(() => import('@/pages/Operational'))
const Tactical = lazy(() => import('@/pages/Tactical'))
const Strategic = lazy(() => import('@/pages/Strategic'))
const Forbidden = lazy(() => import('@/pages/Forbidden'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-brand-300" />
    </div>
  )
}

function HomeRedirect() {
  const { session, loading } = useAuth()
  if (loading) return <RouteFallback />
  if (!session) return <Navigate to="/login" replace />
  return <Navigate to={ROLES[session.role]?.path ?? '/login'} replace />
}

function Protected({ role, children }) {
  return (
    <ProtectedRoute role={role}>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/operational"
          element={
            <Protected role="operational">
              <Operational />
            </Protected>
          }
        />
        <Route
          path="/tactical"
          element={
            <Protected role="tactical">
              <Tactical />
            </Protected>
          }
        />
        <Route
          path="/strategic"
          element={
            <Protected role="strategic">
              <Strategic />
            </Protected>
          }
        />
        <Route path="/forbidden" element={<Forbidden />} />
        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
