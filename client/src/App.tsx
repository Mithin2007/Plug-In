import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/shell/AppShell'
import { AuthProvider } from './features/auth/AuthProvider'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { AdminDashboardPage, DashboardPage, OwnerDashboardPage, ProfilePage, ShareChargerPage } from './pages/ShareAndDashboardPages'
import { DiscoverPage } from './pages/DiscoverPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { MyReservationsPage, ReservationConfirmationPage, ReservePage } from './pages/ReservationPages'
import { StationDetailPage } from './pages/StationDetailPage'

function App() {
  return <BrowserRouter><AuthProvider><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<LoginPage register />} />
    <Route element={<AppShell />}>
      <Route element={<ProtectedRoute />}>
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/stations/:id" element={<StationDetailPage />} />
        <Route path="/stations/:id/reserve" element={<ReservePage />} />
        <Route path="/reservation-confirmed" element={<ReservationConfirmationPage />} />
        <Route path="/reservations" element={<MyReservationsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route element={<ProtectedRoute roles={['OWNER', 'ADMIN']} />}>
        <Route path="/share" element={<ShareChargerPage />} />
        <Route path="/owner" element={<OwnerDashboardPage />} />
      </Route>
      <Route element={<ProtectedRoute roles={['ADMIN']} />}><Route path="/admin" element={<AdminDashboardPage />} /></Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AuthProvider></BrowserRouter>
}

export default App
