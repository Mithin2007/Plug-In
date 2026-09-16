import { ArrowUpRight, BatteryCharging, MapPin, Star, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDistance, currency } from '../../lib/formatters'
import type { Station } from '../../types'
import { Pill, StatusBadge, VerificationBadge } from '../../components/ui/Badge'

export function StationCard({ station, selected = false, onSelect }: { station: Station; selected?: boolean; onSelect?: () => void }) {
  return (
    <article className={`station-card ${selected ? 'station-card--selected' : ''}`} onClick={onSelect} onKeyDown={(event) => { if ((event.key === 'Enter' || event.key === ' ') && onSelect) { event.preventDefault(); onSelect() } }} role="button" tabIndex={0} aria-pressed={selected}>
      <div className="station-card__top">
        <div className="station-card__title-block">
          <div className="station-card__eyebrow"><span className={`station-type-dot ${station.isCommunity ? 'station-type-dot--community' : ''}`} />{station.isCommunity ? 'Community charger' : 'Public station'}</div>
          <h3>{station.name}</h3>
        </div>
        <StatusBadge status={station.status} />
      </div>
      <p className="station-card__address"><MapPin size={14} /> {station.area || station.address}</p>
      <div className="station-card__meta">
        <span><BatteryCharging size={15} />{station.availableSlots}/{station.totalSlots} free</span>
        <span><Zap size={14} />{station.chargingSpeedKw} kW</span>
        <span><Star size={14} fill="currentColor" />{station.rating.toFixed(1)}</span>
      </div>
      <div className="station-card__footer">
        <div className="station-card__tags">
          {station.connectorType.slice(0, 2).map((connector) => <Pill key={connector}>{connector}</Pill>)}
          {station.verificationStatus === 'VERIFIED' && <VerificationBadge status="VERIFIED" />}
        </div>
        <div className="station-card__price"><b>{currency(station.pricePerKwh)}</b><span>/ kWh</span></div>
      </div>
      <div className="station-card__bottom">
        <span>{formatDistance(station.distanceKm)}</span>
        <Link to={`/stations/${station.id}`} className="text-link" onClick={(event) => event.stopPropagation()}>View details <ArrowUpRight size={15} /></Link>
      </div>
    </article>
  )
}
