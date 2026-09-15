import { BarChart3, CalendarDays, ChevronDown, CircleUserRound, LayoutDashboard, MapPinned, Menu, PlusCircle, ShieldCheck, X, Zap } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { initials } from '../../lib/formatters'
import { useAuth } from '../../features/auth/AuthProvider'

const baseNav = [
  { to: '/discover', label: 'Find a charger', icon: MapPinned },
  { to: '/reservations', label: 'My reservations', icon: CalendarDays },
]

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <NavLink to="/" className={`brand ${light ? 'brand--light' : ''}`}>
      <span className="brand__mark"><Zap size={18} strokeWidth={2.7} /></span>
      <span>Plug<span>-In</span></span>
    </NavLink>
  )
}

export function AppShell() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()
  if (!user) return <Outlet />

  const roleNav = user.role === 'OWNER'
    ? [{ to: '/share', label: 'Share my charger', icon: PlusCircle }, { to: '/owner', label: 'Owner hub', icon: BarChart3 }]
    : user.role === 'ADMIN'
      ? [{ to: '/admin', label: 'Moderation', icon: ShieldCheck }]
      : [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }]
  const navItems = [...baseNav, ...roleNav]

  const close = () => setMenuOpen(false)
  const logoutAndGoHome = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}>
                <Icon size={17} />{label}
              </NavLink>
            ))}
          </nav>
          <div className="profile-menu">
            <button className="profile-trigger" type="button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen}>
              <span className="avatar">{initials(user.name)}</span>
              <span className="profile-trigger__copy"><b>{user.name.split(' ')[0]}</b><small>{user.role === 'OWNER' ? 'Charger owner' : user.role === 'ADMIN' ? 'Platform admin' : 'EV driver'}</small></span>
              <ChevronDown size={15} />
            </button>
            {profileOpen && (
              <div className="profile-popover">
                <NavLink to="/profile" onClick={() => setProfileOpen(false)}><CircleUserRound size={16} />Profile</NavLink>
                <button type="button" onClick={logoutAndGoHome}>Sign out</button>
              </div>
            )}
          </div>
          <button className="mobile-menu-trigger" type="button" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={22} /></button>
        </div>
      </header>

      <div className="demo-banner"><span /> Demo mode is active — availability is simulated, never physical charger telemetry.</div>
      <main className="app-main"><Outlet /></main>

      {menuOpen && (
        <div className="mobile-menu-backdrop" onMouseDown={close} role="presentation">
          <aside className="mobile-menu" onMouseDown={(event) => event.stopPropagation()}>
            <div className="mobile-menu__top"><Brand /><button className="icon-button" type="button" onClick={close} aria-label="Close navigation"><X size={21} /></button></div>
            <div className="mobile-menu__user"><span className="avatar avatar--large">{initials(user.name)}</span><div><b>{user.name}</b><small>{user.email}</small></div></div>
            <nav aria-label="Mobile navigation">
              {navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={close}><Icon size={18} />{label}</NavLink>)}
              <NavLink to="/profile" onClick={close}><CircleUserRound size={18} />Profile</NavLink>
            </nav>
            <button className="mobile-menu__logout" type="button" onClick={logoutAndGoHome}>Sign out</button>
          </aside>
        </div>
      )}
    </div>
  )
}
