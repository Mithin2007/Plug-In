import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { UserRole } from '../../types'
import { useAuth } from './AuthProvider'

export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (roles && !roles.includes(user.role)) return <Navigate to="/discover" replace />
  return <Outlet />
}
