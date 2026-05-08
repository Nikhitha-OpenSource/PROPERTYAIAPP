import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertiesApi, predictApi, formatINR, hashCode, PLACEHOLDER_IMAGES } from '../utils/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MapPin, Bed, Bath, Square, Car, CheckCircle, Share2, Heart, MessageCircle } from 'lucide-react';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Record<string, any> | null>(null);
  const [priceHistory, setPriceHistory] = useState<unknown[]>([]);
  const [nearby, setNearby] = useState<unknown[]>([]);
  const [prediction, setPrediction] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    // 1. Fetch main property data first
    propertiesApi.get(id).then((res) => {
      setProperty(res.data);
      
      // 2. Fetch secondary data (don't block if they fail)
      propertiesApi.priceHistory(id).then(hRes => {
        const hist = Array.isArray(hRes.data) ? hRes.data : (hRes.data?.history || []);
        setPriceHistory(hist);
      }).catch(() => {});

      propertiesApi.nearby(id).then(nRes => {
        const nearbyData = Array.isArray(nRes.data) ? nRes.data : (nRes.data?.pois || []);
        setNearby(nearbyData);
      }).catch(() => {});

      // 3. Get ML price prediction
      predictApi.landPrice({
        locality: res.data.locality, area_sqft: res.data.area_sqft,
        bhk: res.data.bhk, age_years: res.data.age_years || 5,
      }).then(pRes => setPrediction(pRes.data)).catch(() => {});

    })
    .catch((err) => {
      console.error("Failed to fetch property:", err);
      setProperty(null);
    })
    .finally(() => setLoading(false));
  }, [id]);

  const emiMonthly = property ? Math.round((Number(property.price) * 0.8 * 0.085 / 12) / (1 - Math.pow(1 + 0.085/12, -240))) : 0;

  if (loading) return (
    <div style={{ padding: 40, maxWidth: 1100, margin: '0 auto' }}>
      <div className="skeleton" style={{ height: 400, borderRadius: 16, marginBottom: 24 }} />
      <div className="grid-2">
        <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
      </div>
    </div>
  );

  if (!property || (property as any).error) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <h2>Property not found</h2>
      <p style={{ color: 'var(--gray)', marginTop: 8 }}>{(property as any)?.error || 'The requested property could not be retrieved.'}</p>
      <button className="btn btn-primary" onClick={() => navigate('/properties')} style={{ marginTop: 24 }}>Back to Properties</button>
    </div>
  );

  // Use deterministic image based on property ID
  const propId = property.property_id || property._id || property.id || '';
  const imgIdx = hashCode(String(propId)) % PLACEHOLDER_IMAGES.length;
  
  const imgUrls = (property.image_urls as string[]) || [];
  const img = imgUrls[0] || PLACEHOLDER_IMAGES[imgIdx];
  // Gallery uses other placeholders if needed
  const imgGallery = imgUrls.length > 1 ? imgUrls : [img, PLACEHOLDER_IMAGES[(imgIdx + 1) % PLACEHOLDER_IMAGES.length]];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 60px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <span className={`badge ${property.listing_type==='COMMERCIAL'?'badge-gold':'badge-blue'}`}>{String(property.listing_type)}</span>
              {property.verified && <span className="badge badge-green"><CheckCircle size={10} /> Verified</span>}
            </div>
            <h1 style={{ fontSize: '1.75rem', marginBottom: 8 }}>{String(property.title)}</h1>
            <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={16} /> {String(property.address || `${property.locality}, ${property.city}`)}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)' }}>
              {formatINR(Number(property.price))}
            </div>
            <div style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>₹{Number(property.price_per_sqft)?.toLocaleString('en-IN')}/sqft</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setSaved(!saved)}>
                <Heart size={14} fill={saved ? 'var(--danger)' : 'none'} stroke={saved ? 'var(--danger)' : 'currentColor'} />
                {saved ? 'Saved' : 'Save'}
              </button>
              <button className="btn btn-secondary btn-sm"><Share2 size={14} /> Share</button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate(`/properties/${id}/chat`)}>
                <MessageCircle size={14} /> Chat with Seller
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ borderRadius: 16, overflow: 'hidden', height: 380, marginBottom: 8 }}>
          <img
            src={img}
            alt={String(property.title)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGES[imgIdx]; }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {imgGallery.slice(0, 4).map((src, i) => (
            <div key={i} style={{ width: 100, height: 70, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: i === 0 ? '2px solid var(--accent)' : '2px solid transparent' }}>
              <img
                src={src}
                alt={`view-${i}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGES[(imgIdx + i) % PLACEHOLDER_IMAGES.length]; }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2" style={{ gap: 24 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Key Details */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 20 }}>Property Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
              {property.bhk && <div className="kpi-card card" style={{ padding: 16 }}>
                <div className="kpi-value" style={{ fontSize: '1.5rem' }}><Bed size={20} style={{ display: 'inline', marginRight: 4 }} />{String(property.bhk)} BHK</div>
                <div className="kpi-label">Bedrooms</div>
              </div>}
              {property.bathrooms && <div className="kpi-card card" style={{ padding: 16 }}>
                <div className="kpi-value" style={{ fontSize: '1.5rem' }}><Bath size={20} style={{ display: 'inline', marginRight: 4 }} />{String(property.bathrooms)}</div>
                <div className="kpi-label">Bathrooms</div>
              </div>}
              <div className="kpi-card card" style={{ padding: 16 }}>
                <div className="kpi-value" style={{ fontSize: '1.5rem' }}>{Number(property.area_sqft).toLocaleString()}</div>
                <div className="kpi-label">Sq. Feet</div>
              </div>
              <div className="kpi-card card" style={{ padding: 16 }}>
                <div className="kpi-value" style={{ fontSize: '1.5rem' }}>{String(property.age_years || 0)} yrs</div>
                <div className="kpi-label">Age</div>
              </div>
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span className="badge badge-blue">Floor: {String(property.floor || 'G')}/{String(property.total_floors || '-')}</span>
              <span className="badge badge-gray">{String(property.furnishing)}</span>
              <span className="badge badge-gray"><Car size={10} /> {String(property.parking)}</span>
              <span className="badge badge-gray">Facing: {String(property.facing)}</span>
            </div>
          </div>

          {/* Amenities */}
          {(property.amenities as string[])?.length > 0 && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 16 }}>Amenities</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(property.amenities as string[]).map((a) => (
                  <span key={a} className="badge badge-green">✓ {a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {property.description && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 12 }}>Description</h3>
              <p style={{ lineHeight: 1.8 }}>{String(property.description)}</p>
            </div>
          )}

          {/* Price History Chart */}
          {priceHistory.length > 0 && (
            <div className="card chart-container">
              <div className="chart-title">📈 Locality Price Trend (12 months)</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--lightGray)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--gray)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--gray)' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}/sqft`, 'Avg Price']} />
                  <Line type="monotone" dataKey="avg_price_per_sqft" stroke="var(--accent)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* AI Valuation */}
          {prediction && (
            <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, var(--lightBg3), var(--lightBg))' }}>
              <h3 style={{ marginBottom: 4 }}>🤖 AI Price Valuation</h3>
              <p style={{ fontSize: '0.8rem', marginBottom: 20 }}>Powered by PROPIQ XGBoost Model</p>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 900, color: 'var(--primary)', marginBottom: 8 }}>
                {formatINR(Number(prediction.predicted_price))}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--gray)', marginBottom: 16 }}>
                Confidence: {formatINR(Number(prediction.confidence_low))} – {formatINR(Number(prediction.confidence_high))}
              </div>
              {Number(prediction.predicted_price) < Number(property.price) * 0.9 ? (
                <span className="badge badge-danger">⚠️ Listed above AI estimate</span>
              ) : Number(prediction.predicted_price) > Number(property.price) * 1.1 ? (
                <span className="badge badge-green">✅ Good Deal — Below AI estimate</span>
              ) : (
                <span className="badge badge-blue">✓ Fair Price Range</span>
              )}
            </div>
          )}

          {/* EMI Calculator */}
          <div className="card emi-card" style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>🏦 EMI Calculator</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray)', marginBottom: 8 }}>80% loan · 8.5% p.a. · 20 years</div>
            <div className="emi-result">₹{emiMonthly.toLocaleString('en-IN')}<span style={{ fontSize: '1rem', fontWeight: 400 }}>/mo</span></div>
            <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: '0.8rem', flexWrap: 'wrap' }}>
              <span>Loan: {formatINR(Number(property.price) * 0.8)}</span>
              <span>Down: {formatINR(Number(property.price) * 0.2)}</span>
            </div>
          </div>

          {/* Nearby POIs */}
          {nearby.length > 0 && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 16 }}>📍 Nearby Amenities</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(nearby as {name:string;category:string;distance_m:number;rating?:number}[]).slice(0, 6).map((poi, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--lightGray)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{poi.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{poi.category}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)' }}>{(poi.distance_m / 1000).toFixed(1)} km</div>
                      {poi.rating && <div style={{ fontSize: '0.72rem', color: 'var(--accent4)' }}>⭐ {poi.rating}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
