import type {
  AdminOverview,
  DashboardData,
  Report,
  Reservation,
  Review,
  Session,
  Station,
  StationStatus,
  UserRole,
} from '../types'

const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:4000/api'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown }

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const session = localStorage.getItem('chargeconnect.session')
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (session) {
    const parsed = JSON.parse(session) as Session
    headers.set('Authorization', `Bearer ${parsed.token}`)
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError('Unable to reach ChargeConnect. Check that the local API is running.', 0)
  }

  const payload = (await response.json().catch(() => ({}))) as { data?: T; error?: { message?: string } }
  if (!response.ok) {
    throw new ApiError(payload.error?.message || 'Something went wrong. Please try again.', response.status)
  }
  return payload.data as T
}

export const api = {
  demoLogin: (role: UserRole) => request<Session>('/auth/demo-login', { method: 'POST', body: { role } }),
  getMe: () => request<{ user: import('../types').User }>('/users/me'),
  getStations: async (params?: Record<string, string | number | boolean | undefined>) => {
    const values = Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== '')
    const query = values.length ? `?${new URLSearchParams(values.map(([key, value]) => [key, String(value)])).toString()}` : ''
    return (await request<Station[]>(`/stations${query}`)).map(normalizeStation)
  },
  getStation: async (id: string) => normalizeStation(await request<Station>(`/stations/${id}`)),
  createStation: async (payload: Partial<Station> & Record<string, unknown>) => normalizeStation(await request<Station>('/stations', { method: 'POST', body: payload })),
  updateStation: async (id: string, payload: Partial<Station>) => normalizeStation(await request<Station>(`/stations/${id}`, { method: 'PATCH', body: payload })),
  simulate: async (id: string, action: 'START' | 'END') => normalizeStation(await request<Station>(`/stations/${id}/simulation`, { method: 'POST', body: { action } })),
  getReservations: () => request<Reservation[]>('/reservations'),
  createReservation: (payload: { stationId: string; startTime: string; endTime: string }) =>
    request<Reservation>('/reservations', { method: 'POST', body: payload }),
  cancelReservation: (id: string) => request<Reservation>(`/reservations/${id}/cancel`, { method: 'PATCH' }),
  getReviews: async (stationId: string) => (await request<Array<Review & { author?: { name: string } }>>(`/stations/${stationId}/reviews`)).map(normalizeReview),
  createReview: async (stationId: string, payload: { rating: number; comment: string }) =>
    normalizeReview(await request<Review & { author?: { name: string } }>(`/stations/${stationId}/reviews`, { method: 'POST', body: payload })),
  createReport: (stationId: string, payload: { category: string; description: string }) =>
    request<Report>(`/stations/${stationId}/reports`, { method: 'POST', body: payload }),
  getDashboard: async () => normalizeDashboard(await request<DashboardData & { stations?: Station[]; stats?: Record<string, number> }>('/dashboard/me')),
  getAdminOverview: () => request<AdminOverview>('/admin/overview'),
  moderateStation: (id: string, verificationStatus: 'VERIFIED' | 'REJECTED') =>
    request<Station>(`/admin/stations/${id}/moderation`, { method: 'PATCH', body: { verificationStatus } }),
  updateReport: (id: string, status: 'RESOLVED' | 'DISMISSED') =>
    request<Report>(`/admin/reports/${id}`, { method: 'PATCH', body: { status } }),
  updateStatus: (id: string, status: StationStatus) => request<Station>(`/stations/${id}`, { method: 'PATCH', body: { status } }),
}

function normalizeStation(station: Station & { connectorType: string | string[]; stationType?: 'PUBLIC' | 'COMMUNITY' }): Station {
  return { ...station, connectorType: Array.isArray(station.connectorType) ? station.connectorType : [station.connectorType], isCommunity: station.isCommunity ?? station.stationType === 'COMMUNITY' }
}
function normalizeReview(review: Review & { author?: { name: string } }): Review { return { ...review, userName: review.userName || review.author?.name || 'ChargeConnect driver' } }
function normalizeDashboard(data: DashboardData & { stations?: Station[]; stats?: Record<string, number> }): DashboardData {
  const stats = data.stats || {}
  return { ...data, ownedStations: (data.ownedStations || data.stations || []).map(normalizeStation), stats: { ...stats, completedSessions: stats.completedSessions ?? stats.completedReservations ?? 0, estimatedEarnings: stats.estimatedEarnings ?? 0 } }
}
