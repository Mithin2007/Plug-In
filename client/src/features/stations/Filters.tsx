import { Filter, Search, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'

export interface StationFilters {
  search: string
  available: boolean
  community: 'ALL' | 'PUBLIC' | 'COMMUNITY'
  connector: 'ALL' | 'CCS2' | 'TYPE2'
}

export const initialFilters: StationFilters = { search: '', available: false, community: 'ALL', connector: 'ALL' }

export function StationFiltersBar({ filters, onChange, count }: { filters: StationFilters; onChange: (filters: StationFilters) => void; count: number }) {
  const [advanced, setAdvanced] = useState(false)
  const set = <K extends keyof StationFilters>(key: K, value: StationFilters[K]) => onChange({ ...filters, [key]: value })
  const hasFilters = filters.available || filters.community !== 'ALL' || filters.connector !== 'ALL'
  return (
    <div className="filter-bar">
      <label className="search-box"><Search size={18} /><input value={filters.search} onChange={(event) => set('search', event.target.value)} placeholder="Search a place or charger" /></label>
      <button type="button" className={`filter-button ${advanced || hasFilters ? 'filter-button--active' : ''}`} onClick={() => setAdvanced((open) => !open)}><SlidersHorizontal size={17} /> Filters{hasFilters && <i />}</button>
      <span className="filter-count">{count} nearby</span>
      {advanced && (
        <div className="advanced-filters">
          <div className="advanced-filters__title"><span><Filter size={16} /> Find your fit</span><button type="button" onClick={() => { onChange(initialFilters); setAdvanced(false) }}><X size={15} />Reset</button></div>
          <label className="filter-check"><input type="checkbox" checked={filters.available} onChange={(event) => set('available', event.target.checked)} />Available now</label>
          <label><span>Charger type</span><select value={filters.community} onChange={(event) => set('community', event.target.value as StationFilters['community'])}><option value="ALL">Public & community</option><option value="PUBLIC">Public only</option><option value="COMMUNITY">Community only</option></select></label>
          <label><span>Connector</span><select value={filters.connector} onChange={(event) => set('connector', event.target.value as StationFilters['connector'])}><option value="ALL">Any connector</option><option value="CCS2">CCS2</option><option value="TYPE2">Type 2</option></select></label>
        </div>
      )}
    </div>
  )
}
