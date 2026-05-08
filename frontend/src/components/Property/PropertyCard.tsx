import React from 'react';
import { formatINR, hashCode, PLACEHOLDER_IMAGES } from '../../utils/api';
import { MapPin, CheckCircle, AlertCircle, Bed, Bath, Square, Car } from 'lucide-react';
import { usePropertyStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';

interface Props {
  property: {
    property_id?: string;
    _id?: string;
    id?: string;
    title: string;
    price: number;
    price_per_sqft: number;
    locality: string;
    city: string;
    bhk: number;
    bathrooms: number;
    area_sqft: number;
    furnishing: string;
    parking: string;
    verified: boolean;
    listing_type: string;
    image_urls?: string[];
    amenities?: string[];
    anomaly_flag?: boolean;
    [key: string]: unknown;
  };
}

export default function PropertyCard({ property: p }: Props) {
  const navigate = useNavigate();
  const { addToCompare, compareList } = usePropertyStore();

  // Resolve the property ID (backend may use property_id, _id, or id)
  const propId = p.property_id || p._id || p.id || '';

  // Deterministic image: hash the ID so each card gets a unique but stable image
  const imgIdx = hashCode(String(propId)) % PLACEHOLDER_IMAGES.length;
  const hasRealImage = p.image_urls && p.image_urls.length > 0 && p.image_urls[0]?.trim();
  const imgSrc = hasRealImage ? p.image_urls![0] : PLACEHOLDER_IMAGES[imgIdx];

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = PLACEHOLDER_IMAGES[(imgIdx + 1) % PLACEHOLDER_IMAGES.length];
  };

  const handleCardClick = () => navigate(`/properties/${propId}`);
  const inCompare = compareList.some((x) => (x.property_id || (x as any)._id || (x as any).id) === propId);

  return (
    <div className="card property-card animate-fadeIn" onClick={handleCardClick}>
      {/* Image */}
      <div className="property-card-img">
        <img src={imgSrc} alt={p.title} loading="lazy" onError={handleImgError} />
        <div className="property-card-type">
          <span className={`badge ${p.listing_type === 'COMMERCIAL' ? 'badge-gold' : p.listing_type === 'LAND' ? 'badge-green' : 'badge-blue'}`}>
            {p.listing_type || 'RESIDENTIAL'}
          </span>
        </div>
        {p.verified && (
          <div className="property-card-verified">
            <span className="badge badge-green"><CheckCircle size={10} /> Verified</span>
          </div>
        )}
        {p.anomaly_flag && (
          <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
            <span className="badge badge-danger"><AlertCircle size={10} /> Price Alert</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="property-card-body">
        <div className="property-card-price">{formatINR(p.price)}</div>
        <div style={{ color: 'var(--gray)', fontSize: '0.78rem', marginBottom: 6 }}>
          ₹{p.price_per_sqft?.toLocaleString('en-IN')}/sqft
        </div>
        <div className="property-card-title">{p.title}</div>
        <div className="property-card-loc">
          <MapPin size={12} /> {p.locality}, {p.city}
        </div>
        <div className="property-card-details">
          {p.bhk ? <span className="property-detail-item"><Bed size={13} /> {p.bhk} BHK</span> : null}
          {p.bathrooms ? <span className="property-detail-item"><Bath size={13} /> {p.bathrooms}</span> : null}
          <span className="property-detail-item"><Square size={13} /> {p.area_sqft?.toLocaleString()} sqft</span>
          {p.parking && p.parking !== 'NONE' && <span className="property-detail-item"><Car size={13} /> Parking</span>}
        </div>
      </div>

      {/* Footer */}
      <div className="property-card-footer">
        <span className="badge badge-gray">{p.furnishing}</span>
        <button
          className={`btn btn-sm ${inCompare ? 'btn-danger' : 'btn-secondary'}`}
          onClick={(e) => { e.stopPropagation(); addToCompare(p as never); }}
          disabled={!inCompare && compareList.length >= 3}
        >
          {inCompare ? 'Remove' : '+ Compare'}
        </button>
      </div>
    </div>
  );
}
