import type { ReservationStatus, StationStatus } from '../types'

export const currency = (amount: number) => `₹${Number(amount).toFixed(0)}`

export const formatDistance = (distance?: number) =>
  distance === undefined ? 'Nearby' : distance < 1 ? `${Math.round(distance * 1000)} m away` : `${distance.toFixed(1)} km away`

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))

export const formatTimeRange = (start: string, end: string) =>
  `${new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(start))} – ${new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(end))}`

export const stationStatusLabel: Record<StationStatus, string> = {
  AVAILABLE: 'Available now',
  LIMITED: 'Limited availability',
  OCCUPIED: 'All slots occupied',
  OFFLINE: 'Offline',
  MAINTENANCE: 'Under maintenance',
}

export const reservationStatusLabel: Record<ReservationStatus, string> = {
  CONFIRMED: 'Confirmed',
  ACTIVE: 'Charging now',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
}

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
