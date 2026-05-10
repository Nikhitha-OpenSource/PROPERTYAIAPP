import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SlidersHorizontal, X, Grid, List, Plus } from 'lucide-react';
import { propertiesApi } from '../utils/api';
import PropertyCard from '../components/Property/PropertyCard';

const LOCALITIES = ['Kondapur','Gachibowli','Madhapur','HITEC City','Miyapur','KPHB','Banjara Hills','Jubilee Hills','Manikonda','Kukatpally','Uppal','Secunderabad','Tellapur','Shadnagar','Financial District','Kompally'];

export default function PropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<unknown[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [view, setView] = useState<'grid'|'list'>('grid');

  const [filters, setFilters] = useState({
    locality: searchParams.get('locality') || '',
    bhk: searchParams.get('bhk') || '',
    listing_type: '',
    min_price: '',
    max_price: '',
    furnishing: '',
    parking: '',
    verified_only: false,
  });

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: 1, page_size: 5000 };
      if (filters.locality)    params.locality = filters.locality;
      if (filters.bhk)        params.bhk = filters.bhk;
      if (filters.listing_type) params.listing_type = filters.listing_type;
      if (filters.min_price)  params.min_price = filters.min_price;
      if (filters.max_price)  params.max_price = filters.max_price;
      if (filters.furnishing) params.furnishing = filters.furnishing;
      if (filters.verified_only) params.verified_only = true;
      const { data } = await propertiesApi.list(params);
      
      setProperties(data.items || []);
      setTotal(data.total || 0);
    } catch (error) { 
      console.error("Failed to fetch live properties, falling back to mock data:", error);
      
      setProperties([]);
      setTotal(0);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProperties(); }, [filters]);

  // Listen for GUI commands from PropBot
  useEffect(() => {
    const handler = (e: Event) => {
      const cmd = (e as CustomEvent).detail;
      if (cmd.command === 'APPLY_FILTER' && cmd.params) {
        setFilters((f) => ({ ...f, ...cmd.params }));
      }
    };
    window.addEventListener('propiq-gui-command', handler);
    return () => window.removeEventListener('propiq-gui-command', handler);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      {/* ── Sidebar Filters ─── */}
      {showFilters && (
        <aside style={{ width: 280, background: 'var(--white)', borderRight: '1px solid var(--borderGray)', padding: 24, flexShrink: 0, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1rem' }}>Filters</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => setFilters({ locality:'', bhk:'', listing_type:'', min_price:'', max_price:'', furnishing:'', parking:'', verified_only: false })}>
              Clear All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 6 }}>LOCALITY</label>
              <select id="filter-locality" className="input select" value={filters.locality} onChange={(e) => setFilters((f) => ({ ...f, locality: e.target.value }))}>
                <option value="">All Localities</option>
                {LOCALITIES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 6 }}>PROPERTY TYPE</label>
              <select id="filter-type" className="input select" value={filters.listing_type} onChange={(e) => setFilters((f) => ({ ...f, listing_type: e.target.value }))}>
                <option value="">All Types</option>
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="LAND">Land</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 6 }}>BHK TYPE</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['','1','2','3','4'].map((b) => (
                  <button key={b} id={`filter-bhk-${b||'all'}`}
                    className={`btn btn-sm ${filters.bhk === b ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilters((f) => ({ ...f, bhk: b }))}>
                    {b || 'All'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 6 }}>PRICE RANGE (₹)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input id="filter-minprice" className="input" placeholder="Min" value={filters.min_price}
                  onChange={(e) => setFilters((f) => ({ ...f, min_price: e.target.value }))} style={{ flex: 1 }} />
                <input id="filter-maxprice" className="input" placeholder="Max" value={filters.max_price}
                  onChange={(e) => setFilters((f) => ({ ...f, max_price: e.target.value }))} style={{ flex: 1 }} />
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {[['50L','5000000'],['80L','8000000'],['1Cr','10000000'],['2Cr','20000000']].map(([label, val]) => (
                  <button key={label} className="btn btn-sm badge-blue" style={{ border: '1px solid var(--accent)', borderRadius: 100, padding: '3px 10px', fontSize: '0.75rem' }}
                    onClick={() => setFilters((f) => ({ ...f, max_price: val }))}>
                    Under ₹{label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 6 }}>FURNISHING</label>
              <select id="filter-furnishing" className="input select" value={filters.furnishing} onChange={(e) => setFilters((f) => ({ ...f, furnishing: e.target.value }))}>
                <option value="">Any</option>
                <option value="FURNISHED">Furnished</option>
                <option value="SEMI">Semi-Furnished</option>
                <option value="UNFURNISHED">Unfurnished</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input id="filter-verified" type="checkbox" checked={filters.verified_only}
                  onChange={(e) => setFilters((f) => ({ ...f, verified_only: e.target.checked }))} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Verified Properties Only</span>
              </label>
            </div>
          </div>
        </aside>
      )}

      {/* ── Main Content ─── */}
      <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 4 }}>
              {filters.locality ? `Properties in ${filters.locality}` : 'All Properties'}
            </h2>
            <p style={{ fontSize: '0.85rem' }}>{total.toLocaleString()} properties found</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/list-property')}>
              <Plus size={15} /> List Property
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal size={15} /> {showFilters ? 'Hide' : 'Show'} Filters
            </button>
            <button className={`btn btn-sm ${view==='grid' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('grid')}><Grid size={15} /></button>
            <button className={`btn btn-sm ${view==='list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('list')}><List size={15} /></button>
          </div>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="grid-3">
            {Array.from({length:6}).map((_,i) => <div key={i} className="skeleton skeleton-card" />)}
          </div>
        ) : properties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏠</div>
            <h3>No properties found</h3>
            <p>Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className={view === 'grid' ? 'grid-3' : ''} style={view === 'list' ? { display: 'flex', flexDirection: 'column', gap: 16 } : {}}>
            {properties.map((p: any) => <PropertyCard key={p.property_id || p._id || p.id} property={p} />)}
          </div>
        )}
      </main>
    </div>
  );
}
