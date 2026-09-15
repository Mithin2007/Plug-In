import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import type { Session, User, UserRole } from '../../types'

const storageKey = 'chargeconnect.session'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  loginDemo: (role: UserRole) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const stored = localStorage.getItem(storageKey)
    return stored ? (JSON.parse(stored) as Session) : null
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (session) localStorage.setItem(storageKey, JSON.stringify(session))
    else localStorage.removeItem(storageKey)
  }, [session])

  const loginDemo = useCallback(async (role: UserRole) => {
    setIsLoading(true)
    try {
      setSession(await api.demoLogin(role))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => setSession(null), [])
  const value = useMemo(() => ({ user: session?.user || null, isLoading, loginDemo, logout }), [session, isLoading, loginDemo, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
