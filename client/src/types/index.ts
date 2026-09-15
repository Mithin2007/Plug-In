export type UserRole = 'USER' | 'OWNER' | 'ADMIN'

export type StationStatus = 'AVAILABLE' | 'LIMITED' | 'OCCUPIED' | 'OFFLINE' | 'MAINTENANCE'
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'
export type ReservationStatus = 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

export interface Session {
  token: string
  user: User
}

export interface Station {
  id: string
  name: string
  description: string
  address: string
  area?: string
  latitude: number
  longitude: number
  ownerId?: string
  ownerName?: string
  stationType: 'PUBLIC' | 'COMMUNITY'
  connectorType: string[]
  chargingSpeedKw: number
  pricePerKwh: number
  totalSlots: number
  availableSlots: number
  status: StationStatus
  openingHours: string
  isCommunity: boolean
  verificationStatus: VerificationStatus
  rating: number
  reviewCount: number
  amenities?: string[]
  distanceKm?: number
  createdAt?: string
}

export interface Reservation {
  id: string
  userId: string
  stationId: string
  station?: Station
  startTime: string
  endTime: string
  status: ReservationStatus
  chargerLabel?: string
  createdAt: string
}

export interface Review {
  id: string
  userId: string
  userName: string
  stationId: string
  rating: number
  comment: string
  createdAt: string
}

export interface Report {
  id: string
  stationId: string
  stationName?: string
  userId: string
  category: string
  description: string
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED'
  createdAt: string
}

export interface DashboardData {
  upcomingReservation?: Reservation | null
  recentReservations: Reservation[]
  ownedStations?: Station[]
  stats?: {
    totalReservations?: number
    completedSessions?: number
    estimatedEarnings?: number
    communityContributions?: number
  }
}

export interface AdminOverview {
  stats: {
    stations: number
    communityStations: number
    pendingStations: number
    openReports: number
    activeReservations: number
  }
  pendingStations: Station[]
  reports: Report[]
}
