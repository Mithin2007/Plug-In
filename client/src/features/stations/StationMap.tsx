import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { Station } from '../../types'
import { currency } from '../../lib/formatters'

import 'leaflet/dist/leaflet.css'

const defaultCenter: [number, number] = [10.873515, 76.072246]

function markerIcon(station: Station, selected: boolean) {
  return L.divIcon({
    className: 'station-map-marker-wrapper',
    html: `<span class="station-map-marker station-map-marker--${station.status.toLowerCase()} ${selected ? 'station-map-marker--selected' : ''}"><span>${station.availableSlots}</span></span>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  })
}

function MapFocus({ station, userLocation }: { station?: Station; userLocation?: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    if (station) map.flyTo([station.latitude, station.longitude], Math.max(map.getZoom(), 15), { duration: 0.5 })
  }, [map, station])
  useEffect(() => {
    if (userLocation) map.flyTo(userLocation, Math.max(map.getZoom(), 14), { duration: 0.5 })
  }, [map, userLocation])
  return null
}

export function StationMap({ stations, selectedStation, onSelect, userLocation }: {
  stations: Station[]
  selectedStation?: Station
  onSelect: (station: Station) => void
  userLocation?: [number, number]
}) {
  const center = userLocation || (selectedStation ? [selectedStation.latitude, selectedStation.longitude] as [number, number] : defaultCenter)
  return (
    <MapContainer center={center} zoom={14} scrollWheelZoom className="station-map" aria-label="Charger discovery map">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapFocus station={selectedStation} userLocation={userLocation} />
      {userLocation && <Marker position={userLocation} icon={L.divIcon({ className: 'user-location-wrapper', html: '<span class="user-location-marker"></span>', iconSize: [20, 20], iconAnchor: [10, 10] })}><Popup>Your location</Popup></Marker>}
      {stations.map((station) => (
        <Marker key={station.id} position={[station.latitude, station.longitude]} icon={markerIcon(station, selectedStation?.id === station.id)} eventHandlers={{ click: () => onSelect(station) }}>
          <Popup className="station-popup">
            <div className="station-popup__type">{station.isCommunity ? 'Community charger' : 'Public station'}</div>
            <strong>{station.name}</strong>
            <p>{station.availableSlots}/{station.totalSlots} available · {station.chargingSpeedKw} kW</p>
            <div><b>{currency(station.pricePerKwh)}</b> / kWh <Link to={`/stations/${station.id}`}>View details</Link></div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
