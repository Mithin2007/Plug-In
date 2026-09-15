import { ArrowRight, BatteryCharging, CalendarCheck2, CheckCircle2, ChevronRight, Compass, MapPinned, ShieldCheck, Sparkles, UsersRound, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../components/shell/AppShell'
import { Pill } from '../components/ui/Badge'

export function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header"><Brand /><nav><a href="#how-it-works">How it works</a><a href="#community">Community</a><Link to="/login" className="landing-login">Log in</Link><Link to="/register" className="landing-cta">Get started <ArrowRight size={16} /></Link></nav></header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <Pill tone="mint"><Sparkles size={14} /> India’s connected charging network</Pill>
            <h1>Find your next <em>charge.</em></h1>
            <p>Discover available EV chargers, reserve your slot, and connect with community charging points — all in one calm, reliable place.</p>
            <div className="hero-actions"><Link to="/discover" className="button button--dark">Find a charger <ArrowRight size={18} /></Link><Link to="/login?role=OWNER" className="button button--secondary">Share your charger</Link></div>
            <div className="hero-proof"><span><b>1,200+</b> drivers connected</span><i /><span><b>4.8 / 5</b> community rating</span><i /><span><b>Always</b> transparently demo-ready</span></div>
          </div>
          <div className="hero-visual" aria-label="Illustration of the ChargeConnect map">
            <div className="hero-map-grid" />
            <div className="hero-route hero-route--one" /><div className="hero-route hero-route--two" />
            <span className="map-pin-art map-pin-art--one"><Zap size={18} fill="currentColor" /></span>
            <span className="map-pin-art map-pin-art--two"><Zap size={16} fill="currentColor" /></span>
            <span className="map-pin-art map-pin-art--three"><Zap size={16} fill="currentColor" /></span>
            <div className="hero-station-preview"><div className="hero-station-preview__icon"><BatteryCharging size={24} /></div><div><small>0.8 km away</small><b>CAET Main Hub</b><span><i /> 2 of 4 chargers free</span></div><ChevronRight size={18} /></div>
            <div className="hero-vehicle"><span className="hero-vehicle__wheel" /><span className="hero-vehicle__wheel hero-vehicle__wheel--right" /><span className="hero-vehicle__body"><Zap size={26} fill="currentColor" /></span></div>
          </div>
        </section>

        <section className="trust-strip"><span><CheckCircle2 size={18} /> Transparent availability</span><span><ShieldCheck size={18} /> Verified community points</span><span><Compass size={18} /> Built for local journeys</span></section>

        <section className="section-block" id="how-it-works"><div className="section-heading"><Pill>Simple by design</Pill><h2>From search to charge, without the uncertainty.</h2><p>ChargeConnect makes the everyday EV journey feel less like a gamble and more like a plan.</p></div><div className="steps-grid">
          <article><span>01</span><MapPinned size={27} /><h3>Find nearby</h3><p>Search a live map of public stations and shared community chargers.</p></article>
          <article><span>02</span><CalendarCheck2 size={27} /><h3>Reserve a slot</h3><p>Check capacity, choose a time, and lock in your charging window.</p></article>
          <article><span>03</span><BatteryCharging size={27} /><h3>Charge & share</h3><p>Navigate there, power up, and leave the network better for the next driver.</p></article>
        </div></section>

        <section className="community-section" id="community"><div className="community-section__copy"><Pill tone="warm"><UsersRound size={14} /> More than a station finder</Pill><h2>Your driveway can move someone forward.</h2><p>Community chargers turn trusted, idle capacity into a helpful local network. Set your schedule, your price, and stay in control.</p><ul><li><CheckCircle2 size={18} /> Set when your charger is available</li><li><CheckCircle2 size={18} /> Manage reservations in one place</li><li><CheckCircle2 size={18} /> Built-in verification and reporting</li></ul><Link to="/login?role=OWNER" className="text-link text-link--large">Become a community host <ArrowRight size={17} /></Link></div><div className="community-stat-card"><div className="community-stat-card__circle"><span><UsersRound size={27} /><b>Community<br />powered</b></span></div><div className="community-stat-card__stats"><div><b>42%</b><span>of nearby capacity shared by people</span></div><div><b>₹9–12</b><span>typical community price / kWh</span></div></div></div></section>

        <section className="closing-cta"><Zap size={25} fill="currentColor" /><h2>Ready when your battery isn’t.</h2><p>Find a spot, reserve with confidence, and help make charging more available for everyone.</p><Link to="/discover" className="button button--primary">Explore chargers <ArrowRight size={17} /></Link></section>
      </main>
      <footer className="landing-footer"><Brand /><span>Find. Reserve. Charge. Share.</span><span>ChargeConnect prototype · Built for better local mobility</span></footer>
    </div>
  )
}
