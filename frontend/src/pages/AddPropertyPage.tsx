import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, MapPin, IndianRupee, Camera, CheckCircle, Info } from 'lucide-react';
import { propertiesApi } from '../utils/api';

export default function AddPropertyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    property_type: 'RESIDENTIAL',
    listing_type: 'SALE',
    locality: '',
    city: 'Hyderabad',
    price: '',
    area_sqft: '',
    bhk: '',
    description: ''
  });

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      try {
        // Submit to backend
        const response = await propertiesApi.create(formData);
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
        {[1, 2, 3].map(s => (
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
                  <label>Property Type</label>
                  <select className="form-control" value={formData.property_type} onChange={e => setFormData({...formData, property_type: e.target.value})}>
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="LAND">Land/Plot</option>
                  </select>
                </div>
                <div>
                  <label>Listing Type</label>
                  <select className="form-control" value={formData.listing_type} onChange={e => setFormData({...formData, listing_type: e.target.value})}>
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
              <h3>Final Details</h3>
              <div>
                <label>Description</label>
                <textarea className="form-control" rows={4} placeholder="Describe your property..." 
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div>
                <label>Upload Images</label>
                <div style={{ border: '2px dashed var(--lightGray)', borderRadius: 12, padding: 40, textAlign: 'center', cursor: 'pointer' }}>
                  <Camera size={40} color="var(--gray)" style={{ marginBottom: 12 }} />
                  <p style={{ margin: 0 }}>Click to upload or drag and drop</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>Max 5 images, up to 5MB each</p>
                </div>
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
            <button type="submit" className="btn btn-primary">
              {step === 3 ? 'Publish Listing' : 'Next Step'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
