import { AlertCircle, LocateFixed, MapPin, RefreshCw, Route, SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingBlock } from '../components/ui/Loading'
import { StationCard } from '../features/stations/StationCard'
import { initialFilters, StationFiltersBar, type StationFilters } from '../features/stations/Filters'
import { StationMap } from '../features/stations/StationMap'
import { useStations } from '../features/stations/useStations'
import type { Station } from '../types'

export function DiscoverPage() {
  const { stations, loading, error, refresh } = useStations()
  const [filters, setFilters] = useState<StationFilters>(initialFilters)
  const [selected, setSelected] = useState<Station | undefined>()
  const [location, setLocation] = useState<[number, number] | undefined>()
  const [locationNote, setLocationNote] = useState('Using the CAET demo area')

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => { setLocation([position.coords.latitude, position.coords.longitude]); setLocationNote('Showing chargers around your location') },
      () => setLocationNote('Location unavailable — using the CAET demo area'),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 },
    )
  }, [])
  useEffect(() => { if (!selected && stations.length) setSelected(stations[0]) }, [stations, selected])

  const filtered = useMemo(() => stations.filter((station) => {
    const query = filters.search.trim().toLowerCase()
    const matchesSearch = !query || `${station.name} ${station.address} ${station.area || ''}`.toLowerCase().includes(query)
    const matchesAvailable = !filters.available || station.availableSlots > 0
    const matchesType = filters.community === 'ALL' || (filters.community === 'COMMUNITY' ? station.isCommunity : !station.isCommunity)
    const matchesConnector = filters.connector === 'ALL' || station.connectorType.includes(filters.connector)
    const matchesPrice = filters.maxPrice === 'ALL' || station.pricePerKwh <= Number(filters.maxPrice)
    const matchesSpeed = filters.minSpeed === 'ALL' || station.chargingSpeedKw >= Number(filters.minSpeed)
    return matchesSearch && matchesAvailable && matchesType && matchesConnector && matchesPrice && matchesSpeed
  }), [stations, filters])

  useEffect(() => {
    if (selected && !filtered.some((station) => station.id === selected.id)) setSelected(filtered[0])
  }, [filtered, selected])

  return <div className="discover-page"><section className="discover-heading"><div><span className="eyebrow"><MapPin size={15} /> {locationNote}</span><h1>Find a charger</h1><p>Availability that helps you plan, not just navigate.</p></div><div className="discover-heading__actions"><Link to="/share" className="button button--secondary"><SlidersHorizontal size={16} /> Share a charger</Link><Button variant="ghost" onClick={() => void refresh()}><RefreshCw size={16} /> Refresh</Button></div></section><StationFiltersBar filters={filters} onChange={setFilters} count={filtered.length} />{error ? <div className="api-error"><AlertCircle size={19} /><div><b>We couldn’t load the charging network.</b><p>{error}</p></div><Button variant="secondary" onClick={() => void refresh()}>Try again</Button></div> : loading ? <div className="discover-loading"><div className="map-loading"><LoadingBlock lines={4} /></div><div><LoadingBlock lines={6} /></div></div> : <div className="discover-layout"><section className="map-panel"><StationMap stations={filtered} selectedStation={selected} onSelect={setSelected} userLocation={location} /><div className="map-legend"><span><i className="legend-dot legend-dot--available" />Available</span><span><i className="legend-dot legend-dot--limited" />Limited</span><span><i className="legend-dot legend-dot--occupied" />Occupied</span><span><i className="legend-dot legend-dot--offline" />Offline</span></div><button type="button" className="location-button" onClick={() => { if (location) setLocation([...location]); else setLocationNote('Location unavailable — using the CAET demo area') }}><LocateFixed size={17} /></button></section><aside className="station-list-panel"><div className="station-list-panel__header"><div><b>Nearby chargers</b><span>{filtered.length} stations in view</span></div><Route size={19} /></div>{filtered.length ? <div className="station-list">{filtered.map((station) => <StationCard key={station.id} station={station} selected={selected?.id === station.id} onSelect={() => setSelected(station)} />)}</div> : <EmptyState icon={<MapPin size={26} />} title="No charger matches yet" detail="Try removing a filter or searching a nearby area." />}</aside></div>}</div>
}
