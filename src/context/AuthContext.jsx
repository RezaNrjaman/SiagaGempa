import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getSession, signIn as authSignIn, signOut as authSignOut } from '@/lib/auth'
import { clearSessionCache } from '@/lib/queryClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setSession(getSession())
    setLoading(false)
  }, [])

  const login = useCallback(async (username, password) => {
    setError(null)
    const result = await authSignIn(username, password)
    if (result.error === 'profile') {
      setError('Profil tidak ditemukan. Hubungi pengelola sistem.')
      return false
    }
    if (result.error) {
      setError('Username atau password salah.')
      return false
    }
    setSession(result.session)
    return true
  }, [])

  const logout = useCallback(async () => {
    await authSignOut() // AUTH-06: sesi Auth + sessionStorage dikosongkan
    clearSessionCache()
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      role: session?.role ?? null,
      username: session?.username ?? null,
      loading,
      error,
      login,
      logout,
    }),
    [session, loading, error, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return context
}
