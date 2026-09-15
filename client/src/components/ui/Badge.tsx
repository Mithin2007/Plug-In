import type { ReactNode } from 'react'
import type { StationStatus, VerificationStatus } from '../../types'
import { stationStatusLabel } from '../../lib/formatters'

export function StatusBadge({ status }: { status: StationStatus }) {
  return <span className={`badge badge--${status.toLowerCase()}`}>{stationStatusLabel[status]}</span>
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  if (status === 'VERIFIED') return <span className="verified-badge">Verified</span>
  if (status === 'PENDING') return <span className="pending-badge">Pending verification</span>
  return <span className="rejected-badge">Not verified</span>
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'mint' | 'warm' | 'dark' }) {
  return <span className={`pill pill--${tone}`}>{children}</span>
}
