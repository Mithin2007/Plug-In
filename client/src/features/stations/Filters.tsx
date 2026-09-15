import { Filter, Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'

export interface StationFilters {
  search: string
  available: boolean
  community: 'ALL' | 'PUBLIC' | 'COMMUNITY'
  connector: 'ALL' | 'CCS2' | 'TYPE2'
  maxPrice: 'ALL' | '10' | '15'
  minSpeed: 'ALL' | '7' | '30'
}

export const initialFilters: StationFilters = { search: '', available: false, community: 'ALL', connector: 'ALL', maxPrice: 'ALL', minSpeed: 'ALL' }

export function StationFiltersBar({ filters, onChange, count }: { filters: StationFilters; onChange: (filters: StationFilters) => void; count: number }) {
  const [advanced, setAdvanced] = useState(false)
  const [draft, setDraft] = useState<StationFilters>(filters)
  useEffect(() => { if (!advanced) setDraft(filters) }, [filters, advanced])
  const set = <K extends keyof StationFilters>(key: K, value: StationFilters[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const hasFilters = filters.available || filters.community !== 'ALL' || filters.connector !== 'ALL' || filters.maxPrice !== 'ALL' || filters.minSpeed !== 'ALL'
  const activeCount = Number(filters.available) + Number(filters.community !== 'ALL') + Number(filters.connector !== 'ALL') + Number(filters.maxPrice !== 'ALL') + Number(filters.minSpeed !== 'ALL')
  const open = () => { setDraft(filters); setAdvanced(true) }
  const clear = () => setDraft(initialFilters)
  const apply = () => { onChange(draft); setAdvanced(false) }
  return (
    <div className="filter-bar">
      <label className="search-box"><Search size={18} /><input value={filters.search} onChange={(event) => set('search', event.target.value)} placeholder="Search a place or charger" /></label>
      <button type="button" className={`filter-button ${advanced || hasFilters ? 'filter-button--active' : ''}`} onClick={() => advanced ? setAdvanced(false) : open()}><SlidersHorizontal size={17} /> Filters{activeCount > 0 && <b>({activeCount})</b>}</button>
      <span className="filter-count">{count} nearby</span>
      {advanced && (
        <div className="advanced-filters">
          <div className="advanced-filters__title"><span><Filter size={16} /> Find your fit</span><button type="button" onClick={clear}><X size={15} />Reset</button></div>
          <label className="filter-check"><input type="checkbox" checked={draft.available} onChange={(event) => set('available', event.target.checked)} />Available now</label>
          <label><span>Charger type</span><select value={draft.community} onChange={(event) => set('community', event.target.value as StationFilters['community'])}><option value="ALL">Public & community</option><option value="PUBLIC">Public only</option><option value="COMMUNITY">Community only</option></select></label>
          <label><span>Connector</span><select value={draft.connector} onChange={(event) => set('connector', event.target.value as StationFilters['connector'])}><option value="ALL">Any connector</option><option value="CCS2">CCS2</option><option value="TYPE2">Type 2</option></select></label>
          <label><span>Maximum price</span><select value={draft.maxPrice} onChange={(event) => set('maxPrice', event.target.value as StationFilters['maxPrice'])}><option value="ALL">Any price</option><option value="10">Up to ₹10 / kWh</option><option value="15">Up to ₹15 / kWh</option></select></label>
          <label><span>Minimum speed</span><select value={draft.minSpeed} onChange={(event) => set('minSpeed', event.target.value as StationFilters['minSpeed'])}><option value="ALL">Any speed</option><option value="7">7 kW+</option><option value="30">30 kW+</option></select></label>
          <div className="advanced-filters__actions"><Button type="button" variant="ghost" onClick={clear}>Clear all</Button><Button type="button" onClick={apply}>Apply filters</Button></div>
        </div>
      )}
    </div>
  )
}
