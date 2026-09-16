import { AlertTriangle, ArrowLeft, BatteryCharging, CalendarCheck2, Clock3, Coffee, ExternalLink, MapPin, MessageSquareWarning, PlugZap, Star, Wifi, Zap } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { VerificationBadge, Pill, StatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { LoadingBlock } from '../components/ui/Loading'
import { Modal } from '../components/ui/Modal'
import { api, ApiError } from '../lib/api'
import { currency, formatDistance } from '../lib/formatters'
import { useAuth } from '../features/auth/AuthProvider'
import type { Review, Station } from '../types'

const amenityIcons = [Coffee, Wifi, PlugZap]

function ReportDialog({ stationId, onClose }: { stationId: string; onClose: () => void }) {
  const [category, setCategory] = useState('CHARGER_NOT_WORKING')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage(null)
    try { await api.createReport(stationId, { category, description }); setMessage('Thank you — your report has been sent to our moderation queue.') }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : 'We could not send the report.') }
    finally { setSaving(false) }
  }
  return <Modal title="Report a problem" onClose={onClose}><form className="dialog-form" onSubmit={(event) => void submit(event)}><p>Reports help keep availability accurate for every driver.</p><label className="form-field"><span>What’s happening?</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="CHARGER_NOT_WORKING">Charger is not working</option><option value="INCORRECT_AVAILABILITY">Availability is incorrect</option><option value="WRONG_LOCATION">Location is wrong</option><option value="INCORRECT_INFORMATION">Information is incorrect</option><option value="OTHER">Something else</option></select></label><label className="form-field"><span>Anything we should know? <small>Optional</small></span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add a short description…" rows={4} /></label>{message && <p className={message.startsWith('Thank') ? 'form-success' : 'form-error'}>{message}</p>}<div className="dialog-actions"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={saving}>Send report</Button></div></form></Modal>
}

function ReviewComposer({ stationId, onCreated }: { stationId: string; onCreated: (review: Review) => void }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null)
    try { const review = await api.createReview(stationId, { rating, comment }); onCreated(review); setComment('') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'We could not publish your review.') }
    finally { setSaving(false) }
  }
  return <form className="review-composer" onSubmit={(event) => void submit(event)}><div><b>Share your experience</b><span>{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`${value} stars`} className={value <= rating ? 'star-button star-button--active' : 'star-button'} onClick={() => setRating(value)}><Star size={18} fill="currentColor" /></button>)}</span></div><textarea rows={3} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="What would help another driver?" required />{error && <p className="form-error">{error}</p>}<Button type="submit" variant="secondary" loading={saving}>Post review</Button></form>
}

export function StationDetailPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const [station, setStation] = useState<Station | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportOpen, setReportOpen] = useState(false)
  const [simulationLoading, setSimulationLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { const [stationData, reviewData] = await Promise.all([api.getStation(id), api.getReviews(id)]); setStation(stationData); setReviews(reviewData); setError(null) }
    catch (reason) { setError(reason instanceof ApiError ? reason.message : 'We could not load this charger.') }
    finally { setLoading(false) }
  }, [id])
  useEffect(() => { void load() }, [load])

  const simulate = async (action: 'START' | 'END') => {
    if (!station) return
    setSimulationLoading(true)
    try { setStation(await api.simulate(station.id, action)) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Simulation could not be updated.') }
    finally { setSimulationLoading(false) }
  }
  const directions = () => station && window.open(`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`, '_blank', 'noopener,noreferrer')

  if (loading) return <div className="content-page station-detail-loading"><LoadingBlock lines={8} /></div>
  if (error || !station) return <div className="content-page"><div className="api-error"><AlertTriangle size={20} /><div><b>This charger is unavailable right now.</b><p>{error || 'It may have been removed from the network.'}</p></div><Button variant="secondary" onClick={() => void load()}>Try again</Button></div><Link to="/discover" className="back-link"><ArrowLeft size={16} /> Back to the map</Link></div>
  const reservable = station.availableSlots > 0 && ['AVAILABLE', 'LIMITED'].includes(station.status) && station.verificationStatus === 'VERIFIED'
  const canSimulate = user?.role === 'OWNER' || user?.role === 'ADMIN'
  return <div className="content-page station-detail-page"><Link to="/discover" className="back-link"><ArrowLeft size={16} /> All chargers</Link><div className="station-detail-hero"><div className="station-detail-hero__main"><div className="station-detail-hero__eyebrow"><Pill tone={station.isCommunity ? 'warm' : 'mint'}>{station.isCommunity ? 'Community charger' : 'Public charging station'}</Pill><VerificationBadge status={station.verificationStatus} /></div><h1>{station.name}</h1><p><MapPin size={17} /> {station.address} <span>·</span> {formatDistance(station.distanceKm)}</p><div className="station-detail-hero__facts"><span><StatusBadge status={station.status} /></span><span><Star size={16} fill="currentColor" /> <b>{station.rating.toFixed(1)}</b> ({station.reviewCount} reviews)</span><span><Clock3 size={16} /> {station.openingHours}</span></div></div><div className="station-detail-hero__actions"><Button onClick={directions} variant="secondary"><ExternalLink size={17} /> Get directions</Button><Button variant="ghost" onClick={() => setReportOpen(true)}><MessageSquareWarning size={17} /> Report</Button></div></div><div className="station-detail-grid"><section className="station-detail-main"><article className="availability-card"><div><span className="availability-card__label">Live availability</span><h2>{station.availableSlots} <small>/ {station.totalSlots} chargers free</small></h2><p>{station.status === 'AVAILABLE' ? 'A great time to charge — choose a slot below.' : station.status === 'LIMITED' ? 'Only a few spots remain. Reserve before you head out.' : 'Reservations are temporarily unavailable.'}</p></div><div className={`availability-gauge availability-gauge--${station.status.toLowerCase()}`}><b>{Math.round((station.availableSlots / station.totalSlots) * 100)}%</b><span>free</span></div></article><article className="detail-section"><h2>Charger details</h2><div className="detail-spec-grid"><div><span><BatteryCharging size={18} /> Connector</span><b>{station.connectorType.join(' · ')}</b></div><div><span><Zap size={18} /> Charging speed</span><b>Up to {station.chargingSpeedKw} kW</b></div><div><span>₹</span><b>{currency(station.pricePerKwh)} / kWh</b></div><div><span><Clock3 size={18} /> Operating hours</span><b>{station.openingHours}</b></div></div></article><article className="detail-section"><h2>About this charger</h2><p className="detail-description">{station.description}</p>{station.amenities && station.amenities.length > 0 && <div className="amenity-list">{station.amenities.map((amenity, index) => { const Icon = amenityIcons[index % amenityIcons.length]; return <span key={amenity}><Icon size={15} /> {amenity}</span> })}</div>}</article><article className="detail-section reviews-section"><div className="section-row"><div><h2>Driver reviews</h2><p>Useful local context from the Plug-In community.</p></div><span className="rating-summary"><Star size={18} fill="currentColor" /><b>{station.rating.toFixed(1)}</b><small>{station.reviewCount} ratings</small></span></div><ReviewComposer stationId={station.id} onCreated={(review) => { setReviews((current) => [review, ...current]); setStation((current) => current ? { ...current, reviewCount: current.reviewCount + 1 } : current) }} />{reviews.length ? <div className="review-list">{reviews.slice(0, 4).map((review) => <article className="review" key={review.id}><div className="review__top"><b>{review.userName}</b><span>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={13} fill={index < review.rating ? 'currentColor' : 'none'} />)}</span></div><p>{review.comment}</p><small>{new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(review.createdAt))}</small></article>)}</div> : <p className="quiet-note">No reviews yet. Be the first to share a helpful note.</p>}</article></section><aside className="reservation-sidebar"><div className="reservation-card"><div className="reservation-card__top"><CalendarCheck2 size={21} /><div><b>Reserve this charger</b><span>Hold your spot before you leave.</span></div></div><div className="reservation-card__line"><span>From</span><b>{currency(station.pricePerKwh)} / kWh</b></div>{reservable ? <Link to={`/stations/${station.id}/reserve`} className="button button--primary button--full">Choose a time slot <CalendarCheck2 size={17} /></Link> : <div className="not-reservable"><AlertTriangle size={17} /> {station.status === 'OCCUPIED' ? 'All chargers are occupied right now.' : station.verificationStatus !== 'VERIFIED' ? 'This listing is awaiting verification.' : 'This charger cannot accept reservations.'}</div>}<button type="button" className="directions-link" onClick={directions}><MapPin size={16} /> Open navigation</button></div>{canSimulate && <div className="simulation-card"><span className="simulation-card__label">Prototype controls</span><h3>Availability simulation</h3><p>Clearly demo-only. This does not control a physical charger.</p><div><Button variant="secondary" onClick={() => void simulate('START')} loading={simulationLoading} disabled={station.availableSlots <= 0}>Simulate session</Button><Button variant="ghost" onClick={() => void simulate('END')} loading={simulationLoading}>End session</Button></div></div>}</aside></div>{reportOpen && <ReportDialog stationId={station.id} onClose={() => setReportOpen(false)} />}</div>
}
