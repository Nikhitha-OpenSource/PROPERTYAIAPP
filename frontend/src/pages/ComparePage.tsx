import { usePropertyStore } from '../store/useStore';
import { formatINR } from '../utils/api';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COMPARE_FIELDS = [
  ['Price', 'price', (v: unknown) => formatINR(Number(v))],
  ['Price/sqft', 'price_per_sqft', (v: unknown) => `₹${Number(v).toLocaleString('en-IN')}`],
  ['Area (sqft)', 'area_sqft', (v: unknown) => `${Number(v).toLocaleString()} sqft`],
  ['BHK', 'bhk', (v: unknown) => `${v} BHK`],
  ['Bathrooms', 'bathrooms', (v: unknown) => String(v)],
  ['Floor', 'floor', (v: unknown) => `${v} / ${0}`],
  ['Age', 'age_years', (v: unknown) => `${v} yrs`],
  ['Furnishing', 'furnishing', (v: unknown) => String(v)],
  ['Parking', 'parking', (v: unknown) => String(v)],
  ['Locality', 'locality', (v: unknown) => String(v)],
  ['Verified', 'verified', (v: unknown) => v ? '✓ Yes' : '✗ No'],
  ['Listing Type', 'listing_type', (v: unknown) => String(v)],
] as const;

export default function ComparePage() {
  const { compareList, removeFromCompare, clearCompare } = usePropertyStore();
  const navigate = useNavigate();

  const getBest = (field: string) => {
    const vals = compareList.map((p) => Number((p as Record<string, unknown>)[field]) || 0);
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    return { max, min };
  };

  if (compareList.length === 0) return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div style={{ fontSize: '4rem', marginBottom: 20 }}>🔍</div>
      <h2>No Properties to Compare</h2>
      <p style={{ marginBottom: 24 }}>Add up to 3 properties from the listing page to compare them side-by-side.</p>
      <button className="btn btn-primary btn-lg" onClick={() => navigate('/properties')}>Browse Properties</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1>Property Comparison</h1>
          <p>Side-by-side comparison of {compareList.length} propert{compareList.length > 1 ? 'ies' : 'y'}</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-danger btn-sm" onClick={clearCompare}>Clear All</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/properties')}>+ Add More</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="compare-table" style={{ minWidth: 600 }}>
          <thead>
            <tr>
              <th style={{ width: 160 }}>Feature</th>
              {compareList.map((p) => (
                <th key={p.property_id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.locality}</span>
                    <button onClick={() => removeFromCompare(p.property_id)}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                      <X size={14} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>{p.title?.slice(0,30)}...</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_FIELDS.map(([label, field, fmt], rowIdx) => {
              const { max, min } = getBest(field);
              return (
                <tr key={field} style={{ background: rowIdx % 2 === 0 ? 'var(--rowAlt)' : 'white' }}>
                  <td style={{ fontWeight: 600, color: 'var(--gray)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</td>
                  {compareList.map((p) => {
                    const val = (p as Record<string, unknown>)[field];
                    const numVal = Number(val);
                    let cellClass = '';
                    if (!isNaN(numVal) && numVal > 0) {
                      if (field === 'price' || field === 'price_per_sqft' || field === 'age_years') {
                        if (numVal === min) cellClass = 'winner';
                      } else {
                        if (numVal === max) cellClass = 'winner';
                      }
                    }
                    return (
                      <td key={p.property_id} className={cellClass}>
                        {field === 'verified'
                          ? (val ? <CheckCircle size={16} color="var(--accent2)" /> : <XCircle size={16} color="var(--danger)" />)
                          : fmt(val)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {/* Actions row */}
            <tr>
              <td style={{ fontWeight: 600, color: 'var(--gray)', fontSize: '0.8rem' }}>ACTION</td>
              {compareList.map((p) => (
                <td key={p.property_id}>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate(`/properties/${p.property_id}`)}>
                    View Details
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, padding: 12, background: 'var(--lightBg2)', borderRadius: 10, fontSize: '0.8rem', color: 'var(--gray)' }}>
        <span style={{ color: 'var(--accent2)', fontWeight: 600 }}>✓ Green</span> = Best value for that metric · <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Bold</span> = Winner
      </div>
    </div>
  );
}
