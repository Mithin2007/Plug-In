import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '../../lib/api'
import type { Station } from '../../types'

export function useStations() {
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setStations(await api.getStations())
      setError(null)
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'We could not load nearby chargers.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])
  return { stations, setStations, loading, error, refresh }
}
