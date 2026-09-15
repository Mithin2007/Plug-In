import { ArrowLeft, ArrowRight, BatteryCharging, CheckCircle2, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Brand } from '../components/shell/AppShell'
import { Button } from '../components/ui/Button'
import { useAuth } from '../features/auth/AuthProvider'
import type { UserRole } from '../types'

const personas: Array<{ role: UserRole; label: string; detail: string; icon: typeof BatteryCharging }> = [
  { role: 'USER', label: 'EV driver', detail: 'Find, reserve, review', icon: BatteryCharging },
  { role: 'OWNER', label: 'Charger owner', detail: 'Share and manage a charger', icon: UsersRound },
  { role: 'ADMIN', label: 'Platform admin', detail: 'Verify and moderate', icon: ShieldCheck },
]

export function LoginPage({ register = false }: { register?: boolean }) {
  const { loginDemo, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const defaultRole = new URLSearchParams(location.search).get('role') === 'OWNER' ? 'OWNER' : 'USER'
  const [role, setRole] = useState<UserRole>(defaultRole)
  const [error, setError] = useState<string | null>(null)

  const continueDemo = async () => {
    setError(null)
    try {
      await loginDemo(role)
      navigate(role === 'OWNER' ? '/owner' : role === 'ADMIN' ? '/admin' : '/discover')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'We could not start the demo session.')
    }
  }

  return <div className="auth-page"><aside className="auth-aside"><Brand light /><div className="auth-aside__copy"><span className="auth-aside__eyebrow"><Sparkles size={15} /> Charge without second guessing</span><h1>Every journey deserves a dependable next stop.</h1><p>ChargeConnect brings public and community charging into one reliable network.</p></div><div className="auth-aside__proof"><span><CheckCircle2 size={17} /> Live capacity visibility</span><span><CheckCircle2 size={17} /> Reservation-first planning</span><span><CheckCircle2 size={17} /> Trusted local sharing</span></div></aside><main className="auth-main"><div className="auth-card"><Link className="back-link" to="/"><ArrowLeft size={16} /> Back to home</Link><div className="auth-card__title"><span className="mini-logo"><BatteryCharging size={20} /></span><h2>{register ? 'Create your account' : 'Welcome back'}</h2><p>{register ? 'Start with a demo persona, then make the network your own.' : 'Sign in to plan your next charging stop.'}</p></div><form onSubmit={(event) => { event.preventDefault(); void continueDemo() }}><label className="form-field"><span>Email address</span><input type="email" placeholder="you@example.com" defaultValue={register ? '' : 'demo@chargeconnect.in'} required /></label><label className="form-field"><span>{register ? 'Create a password' : 'Password'}</span><input type="password" placeholder="••••••••" defaultValue={register ? '' : 'chargeconnect'} required /></label>{register && <label className="form-field"><span>Full name</span><input placeholder="Your name" required /></label>}<div className="demo-role-picker"><div><b>Demo persona</b><span>Choose the experience you want to explore.</span></div><div className="persona-grid">{personas.map(({ role: personaRole, label, detail, icon: Icon }) => <button key={personaRole} type="button" onClick={() => setRole(personaRole)} className={`persona-card ${role === personaRole ? 'persona-card--selected' : ''}`}><Icon size={19} /><span><b>{label}</b><small>{detail}</small></span></button>)}</div></div>{error && <p className="form-error">{error}</p>}<Button type="submit" fullWidth loading={isLoading}>{register ? 'Create demo account' : 'Continue to demo'} <ArrowRight size={17} /></Button></form><p className="auth-switch">{register ? 'Already have an account?' : 'New to ChargeConnect?'} <Link to={register ? '/login' : '/register'}>{register ? 'Log in' : 'Create an account'}</Link></p><p className="auth-disclaimer">Demo mode stores only a local session. Availability shown is a transparent simulation.</p></div></main></div>
}
