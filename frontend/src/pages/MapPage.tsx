import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { propertiesApi, formatINR } from '../utils/api';
import { useNavigate } from 'react-router-dom';

// Fix Leaflet default icon issue in Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createPriceIcon = (price: number) => L.divIcon({
  className: '',
  html: `<div class="custom-pin">${formatINR(price)}</div>`,
  iconAnchor: [30, 36],
});

interface GeoFeature {
  geometry: { coordinates: [number, number] };
  properties: { property_id: string; title: string; price: number; bhk: number; area_sqft: number; locality: string; verified: boolean; type?: string };
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 13); }, [center]);
  return null;
}

export default function MapPage() {
  const navigate = useNavigate();
  const [features, setFeatures] = useState<GeoFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ listing_type: '', bhk: '' });
  const center: [number, number] = [17.4401, 78.3489];

  useEffect(() => {
    setLoading(true);
    propertiesApi.geojson('Hyderabad').then(({ data }) => {
      setFeatures(data.features || []);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = features.filter((f) => {
    if (filters.listing_type && f.properties.type !== filters.listing_type) return false;
    if (filters.bhk && String(f.properties.bhk) !== filters.bhk) return false;
    return true;
  });

  return (
    <div className="map-container">
      {/* Filter Panel */}
      <div className="map-filters-panel">
        <h3 style={{ fontSize: '0.95rem', marginBottom: 16 }}>🗺️ Map Filters</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>TYPE</label>
            <select id="map-filter-type" className="input select" value={filters.listing_type}
              onChange={(e) => setFilters((f) => ({ ...f, listing_type: e.target.value }))}>
              <option value="">All Types</option>
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="LAND">Land</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>BHK</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['','1','2','3','4'].map((b) => (
                <button key={b} className={`btn btn-sm ${filters.bhk===b?'btn-primary':'btn-secondary'}`}
                  onClick={() => setFilters((f) => ({ ...f, bhk: b }))} style={{ padding: '4px 12px' }}>
                  {b||'All'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: '12px', background: 'var(--lightBg)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>{filtered.length} Properties</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>showing on map</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/properties')}>
            📋 List View
          </button>
        </div>
      </div>

      {/* Leaflet Map */}
      {!loading && (
        <MapContainer
          center={center} zoom={12}
          style={{ width: '100%', height: '100%' }}
          id="property-map"
        >
          <MapController center={center} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          />
          {filtered.slice(0, 200).map((f) => (
            <Marker
              key={f.properties.property_id}
              position={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
              icon={createPriceIcon(f.properties.price)}
            >
              <Popup maxWidth={260}>
                <div style={{ fontFamily: 'var(--font-body)' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)', marginBottom: 4 }}>
                    {formatINR(f.properties.price)}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
                    {f.properties.title || `${f.properties.bhk}BHK in ${f.properties.locality}`}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray)', marginBottom: 10 }}>
                    📍 {f.properties.locality} · {f.properties.area_sqft?.toLocaleString()} sqft
                  </div>
                  {f.properties.verified && (
                    <span className="badge badge-green" style={{ marginBottom: 10, display: 'inline-flex' }}>✓ Verified</span>
                  )}
                  <br />
                  <button className="btn btn-primary btn-sm" onClick={() => navigate(`/properties/${f.properties.property_id}`)}>
                    View Details →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="skeleton" style={{ width: 200, height: 20, margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--gray)' }}>Loading map data...</p>
          </div>
        </div>
      )}
    </div>
  );
}
