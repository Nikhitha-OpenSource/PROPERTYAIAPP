import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, MapPin, IndianRupee, Camera, CheckCircle, Info, ShieldCheck, Plus, X, ExternalLink } from 'lucide-react';
import { propertiesApi, deedApi } from '../utils/api';

export default function AddPropertyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deedStatus, setDeedStatus] = useState<'pending'|'verifying'|'verified'>('pending');
  const [deedNumber, setDeedNumber] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [nearby, setNearby] = useState<{name: string, category: string, distance: string}[]>([]);
  const AVAILABLE_AMENITIES = ['Clubhouse', 'Lift', 'Gym', 'Swimming Pool', '24/7 Security', 'Power Backup', 'Park', 'Covered Parking'];
  const [formData, setFormData] = useState({
    title: '',
    listing_type: 'RESIDENTIAL',
    property_type: 'SALE',
    locality: '',
    city: 'Hyderabad',
    price: '',
    area_sqft: '',
    bhk: '',
    bathrooms: '',
    age_years: '',
    furnishing: 'UNFURNISHED',
    parking: 'None',
    floor: '',
    total_floors: '',
    facing: 'East',
    description: '',
    latitude: '',
    longitude: ''
  });

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 3 && deedStatus !== 'verified') {
      alert('Please complete the Legal Verification before proceeding to publish.');
      return;
    }

    if (step < 4) {
      setStep(step + 1);
    } else {
      try {
        const payload = {
          ...formData,
          price: parseFloat(formData.price),
          area_sqft: parseFloat(formData.area_sqft),
          bhk: formData.bhk ? parseInt(formData.bhk, 10) : 0,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms, 10) : 0,
          age_years: formData.age_years ? parseInt(formData.age_years, 10) : 0,
          floor: formData.floor ? parseInt(formData.floor, 10) : 0,
          total_floors: formData.total_floors ? parseInt(formData.total_floors, 10) : 0,
          latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
          longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
          amenities,
          nearby: nearby.map(n => ({
            name: n.name,
            category: n.category,
            distance_m: (parseFloat(n.distance) || 0) * 1000,
            rating: 4.2
          })),
          verified: deedStatus === 'verified'
        };

        // Submit to backend
        const response = await propertiesApi.create(payload);
        alert('Property listed successfully! It will be live after verification.');
        navigate('/seller');
      } catch (error) {
        console.error('Error creating property:', error);
        alert('Failed to list property. Please try again.');
      }
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ marginBottom: 12 }}>List Your Property</h1>
        <p style={{ color: 'var(--gray)' }}>Get the best valuation and reach verified buyers with PROPIQ AI</p>
      </div>

      {/* Progress Steps */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, position: 'relative' }}>
        <div style={{ position: 'absolute', top: '20px', left: '10%', right: '10%', height: 2, background: 'var(--lightGray)', zIndex: 0 }} />
        {[1, 2, 3, 4].map(s => (
          <div key={s} style={{ 
            zIndex: 1, 
            background: step >= s ? 'var(--primary)' : 'var(--white)',
            color: step >= s ? 'white' : 'var(--gray)',
            width: 40, height: 40, borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: step >= s ? 'none' : '2px solid var(--lightGray)',
            fontWeight: 'bold'
          }}>
            {s}
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 32 }}>
        <form onSubmit={handleNext}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3>Basic Information</h3>
              <div>
                <label>Property Title</label>
                <input type="text" className="form-control" placeholder="e.g. Luxury 3BHK Villa in Jubilee Hills" required 
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="grid-2">
                <div>
                  <label>Property Category</label>
                  <select className="form-control" value={formData.listing_type} onChange={e => setFormData({...formData, listing_type: e.target.value})}>
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="LAND">Land/Plot</option>
                  </select>
                </div>
                <div>
                  <label>Transaction Type</label>
                  <select className="form-control" value={formData.property_type} onChange={e => setFormData({...formData, property_type: e.target.value})}>
                    <option value="SALE">For Sale</option>
                    <option value="RENT">For Rent</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3>Location & Pricing</h3>
              <div className="grid-2">
                <div>
                  <label>Locality</label>
                  <input type="text" className="form-control" placeholder="e.g. Gachibowli" required 
                    value={formData.locality} onChange={e => setFormData({...formData, locality: e.target.value})} />
                </div>
                <div>
                  <label>City</label>
                  <input type="text" className="form-control" value="Hyderabad" disabled />
                </div>
              </div>

              {formData.listing_type !== 'LAND' && (
                <>
                  <div className="grid-2">
                    <div>
                      <label>BHK</label>
                      <input type="number" className="form-control" placeholder="e.g. 3" 
                        value={formData.bhk} onChange={e => setFormData({...formData, bhk: e.target.value})} />
                    </div>
                    <div>
                      <label>Bathrooms</label>
                      <input type="number" className="form-control" placeholder="e.g. 2" 
                        value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div>
                      <label>Property Age (Years)</label>
                      <input type="number" className="form-control" placeholder="e.g. 5" 
                        value={formData.age_years} onChange={e => setFormData({...formData, age_years: e.target.value})} />
                    </div>
                    <div>
                      <label>Furnishing</label>
                      <select className="form-control" value={formData.furnishing} onChange={e => setFormData({...formData, furnishing: e.target.value})}>
                        <option value="UNFURNISHED">Unfurnished</option>
                        <option value="SEMI">Semi-Furnished</option>
                        <option value="FURNISHED">Fully Furnished</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid-2">
                    <div>
                      <label>Floor Number</label>
                      <input type="number" className="form-control" placeholder="e.g. 2" 
                        value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} />
                    </div>
                    <div>
                      <label>Total Floors</label>
                      <input type="number" className="form-control" placeholder="e.g. 10" 
                        value={formData.total_floors} onChange={e => setFormData({...formData, total_floors: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div>
                      <label>Parking</label>
                      <input type="text" className="form-control" placeholder="e.g. 1 Covered" 
                        value={formData.parking} onChange={e => setFormData({...formData, parking: e.target.value})} />
                    </div>
                    <div>
                      <label>Facing</label>
                      <select className="form-control" value={formData.facing} onChange={e => setFormData({...formData, facing: e.target.value})}>
                        <option value="East">East</option>
                        <option value="West">West</option>
                        <option value="North">North</option>
                        <option value="South">South</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="grid-2">
                <div>
                  <label>Price (₹)</label>
                  <input type="number" className="form-control" placeholder="Total Price" required 
                    value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div>
                  <label>Area (Sq.Ft)</label>
                  <input type="number" className="form-control" placeholder="e.g. 1500" required 
                    value={formData.area_sqft} onChange={e => setFormData({...formData, area_sqft: e.target.value})} />
                </div>
              </div>
              <div className="grid-2">
                <div>
                  <label>Latitude (For Map Pin)</label>
                  <input type="number" step="any" className="form-control" placeholder="e.g. 17.4401" 
                    value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} />
                </div>
                <div>
                  <label>Longitude (For Map Pin)</label>
                  <input type="number" step="any" className="form-control" placeholder="e.g. 78.3489" 
                    value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} />
                </div>
              </div>
              <div className="card" style={{ background: 'var(--lightBg)', padding: 16, border: '1px dashed var(--accent)' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Info size={20} color="var(--accent)" />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>PROPIQ AI Tip: Properties with accurate area and locality get 40% more leads.</p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3>Legal & Deed Verification</h3>
              <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>
                To maintain a high-trust marketplace, PROPIQ AI requires mandatory deed validation. Please perform a deed check in the <strong>Deed Tools</strong> and wait for Admin approval before proceeding. Once approved, you will be able to add photos, amenities, and publish.
              </p>
              <div>
                <label style={{ fontWeight: 'bold' }}>Verified Parcel ID / Document Number <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="text" className="form-control" placeholder="Enter Parcel ID from Deed Tools (or DEMO)" 
                  value={deedNumber} onChange={e => setDeedNumber(e.target.value)} disabled={deedStatus !== 'pending'} required={step === 3} />
              </div>
              
              {deedStatus === 'pending' && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" className="btn btn-gold" onClick={async () => {
                    if (!deedNumber.trim()) return alert('Enter a Parcel ID / Document number first');
                    setDeedStatus('verifying');
                    if (deedNumber.toUpperCase() === 'DEMO') {
                      setTimeout(() => setDeedStatus('verified'), 1000);
                      return;
                    }
                    try {
                      const { data } = await deedApi.status(deedNumber);
                      if (data && data.stage === 'APPROVED') setDeedStatus('verified');
                      else { alert(`Deed verification is currently: ${data?.stage || 'PENDING'}. Please wait for admin approval.`); setDeedStatus('pending'); }
                    } catch (error) { alert('Parcel not found. Please upload your documents in the Deed Tools first. (Use "DEMO" to bypass for testing)'); setDeedStatus('pending'); }
                  }}>
                    <ShieldCheck size={18} /> Verify Approval Status
                  </button>
                  <a href="/deeds" target="_blank" rel="noreferrer" className="btn btn-secondary">
                    Go to Deed Tools <ExternalLink size={14} style={{ marginLeft: 4 }} />
                  </a>
                </div>
              )}
              
              {deedStatus === 'verifying' && (
                <div style={{ padding: 16, background: 'var(--lightBg2)', borderRadius: 8 }}>
                  ⏳ Running Azure OCR & Legal Validation...
                </div>
              )}
              
              {deedStatus === 'verified' && (
                <div style={{ padding: 16, background: '#e8f5e9', color: 'var(--success)', borderRadius: 8, fontWeight: 'bold' }}>
                  ✅ Document Verified Successfully! You may proceed.
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <h3>Final Details & Amenities</h3>
              <div>
                <label>Description</label>
                <textarea className="form-control" rows={4} placeholder="Describe your property..." 
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div>
                <label>Amenities</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                  {AVAILABLE_AMENITIES.map(am => (
                    <label key={am} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: 'var(--lightBg)', padding: '8px 14px', borderRadius: 20, fontSize: '0.85rem', border: amenities.includes(am) ? '1px solid var(--primary)' : '1px solid transparent' }}>
                      <input type="checkbox" checked={amenities.includes(am)} style={{ margin: 0 }} onChange={(e) => {
                        if (e.target.checked) setAmenities([...amenities, am]);
                        else setAmenities(amenities.filter(a => a !== am));
                      }} />
                      {am}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label>Nearby Places (Schools, Hospitals, Transit)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  {nearby.map((n, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input type="text" placeholder="Name (e.g. Apollo Hospital)" className="form-control" style={{ flex: 2 }} value={n.name} onChange={e => { const newN = [...nearby]; newN[i].name = e.target.value; setNearby(newN); }} />
                      <select className="form-control" style={{ flex: 1 }} value={n.category} onChange={e => { const newN = [...nearby]; newN[i].category = e.target.value; setNearby(newN); }}>
                        <option value="School">School</option>
                        <option value="Hospital">Hospital</option>
                        <option value="Transit">Transit</option>
                        <option value="Mall">Mall</option>
                        <option value="ATM">ATM</option>
                        <option value="Park">Park</option>
                      </select>
                      <input type="number" step="0.1" placeholder="Dist (km)" className="form-control" style={{ width: 100 }} value={n.distance} onChange={e => { const newN = [...nearby]; newN[i].distance = e.target.value; setNearby(newN); }} />
                      <button type="button" className="btn btn-secondary btn-sm" style={{ padding: 10, color: 'var(--danger)' }} onClick={() => setNearby(nearby.filter((_, idx) => idx !== i))}><X size={16} /></button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary btn-sm" style={{ width: 'fit-content' }} onClick={() => setNearby([...nearby, {name: '', category: 'School', distance: ''}])}>
                    <Plus size={16} /> Add Nearby Place
                  </button>
                </div>
              </div>
              <div>
                <label>Upload Images</label>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                style={{ display: 'none' }} 
                ref={fileInputRef} 
                onChange={(e) => {
                  if (e.target.files) {
                    setImages(prev => [...prev, ...Array.from(e.target.files!)].slice(0, 5));
                  }
                }} 
              />
              <div 
                style={{ border: '2px dashed var(--lightGray)', borderRadius: 12, padding: 40, textAlign: 'center', cursor: 'pointer' }}
                onClick={() => fileInputRef.current?.click()}
              >
                  <Camera size={40} color="var(--gray)" style={{ marginBottom: 12 }} />
                  <p style={{ margin: 0 }}>Click to upload or drag and drop</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>Max 5 images, up to 5MB each</p>
                </div>
              {images.length > 0 && (
                <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                  {images.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', width: 80, height: 80 }}>
                      <img src={URL.createObjectURL(img)} alt={`preview-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                    </div>
                  ))}
                </div>
              )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--success)' }}>
                <CheckCircle size={18} />
                <span style={{ fontSize: '0.9rem' }}>You're all set! Review and publish.</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
            <button type="button" className="btn btn-secondary" onClick={() => step > 1 ? setStep(step-1) : navigate(-1)}>
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            <button type="submit" className={`btn ${step === 4 ? 'btn-primary' : 'btn-secondary'}`}>
              {step === 4 ? 'Publish Listing' : 'Next Step'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
