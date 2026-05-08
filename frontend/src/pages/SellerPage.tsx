import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, List, MessageSquare, TrendingUp, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { propertiesApi, formatINR } from '../utils/api';
import { useAuthStore } from '../store/useStore';

export default function SellerPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sellerId = user?.user_id;
    if (!sellerId) {
      setListings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    propertiesApi
      .list({ page_size: 50, owner_user_id: sellerId })
      .then((res) => {
        setListings(res.data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch listings:', err);
        setLoading(false);
      });
  }, [user?.user_id]);

  const handleEdit = (propertyId: string) => {
    // For now, just navigate to list property page (in real app, would pre-fill form)
    navigate('/list-property');
  };

  const handleDelete = async (propertyId: string) => {
    if (window.confirm('Are you sure you want to remove this property? This action is irreversible.')) {
      try {
        await propertiesApi.delete(propertyId);
        setListings(listings.filter(p => (p.property_id || p._id || p.id) !== propertyId));
        alert('Property removed successfully.');
      } catch (error) {
        console.error('Error deleting property:', error);
        alert('Failed to remove property.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      {/* Sidebar */}
      <div style={{ width: 260, background: 'var(--white)', borderRight: '1px solid var(--lightGray)', padding: '24px 0' }}>
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ background: 'var(--lightBg3)', padding: 16, borderRadius: 12, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '1.5rem', fontWeight: 'bold' }}>S</div>
            <h4 style={{ margin: 0 }}>Seller Dashboard</h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--gray)' }}>Verified Seller</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 24px', background: 'var(--lightBg)', color: 'var(--primary)', borderLeft: '4px solid var(--primary)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <LayoutDashboard size={18} /> Dashboard
          </div>
          <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--gray)', cursor: 'pointer' }}>
            <List size={18} /> My Listings
          </div>
          <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--gray)', cursor: 'pointer' }}>
            <MessageSquare size={18} /> Inquiries
          </div>
          <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--gray)', cursor: 'pointer' }}>
            <TrendingUp size={18} /> Market Trends
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: 32, background: 'var(--lightBg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h1>My Property Listings</h1>
          <button className="btn btn-primary" onClick={() => navigate('/list-property')}>
            <Plus size={18} /> List New Property
          </button>
        </div>

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: 32 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ color: 'var(--gray)', fontSize: '0.9rem', marginBottom: 8 }}>Total Listings</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{listings.length}</div>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ color: 'var(--gray)', fontSize: '0.9rem', marginBottom: 8 }}>Total Leads</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>24</div>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ color: 'var(--gray)', fontSize: '0.9rem', marginBottom: 8 }}>Profile Views</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>1.2k</div>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--lightBg3)' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '16px 24px' }}>Property</th>
                <th style={{ textAlign: 'left', padding: '16px 24px' }}>Price</th>
                <th style={{ textAlign: 'left', padding: '16px 24px' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '16px 24px' }}>Leads</th>
                <th style={{ textAlign: 'right', padding: '16px 24px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center' }}>Loading listings...</td></tr>
              ) : listings.map((item, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--lightGray)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 600 }}>{item.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{item.locality}, {item.city}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>{formatINR(item.price)}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span className="badge badge-green">Active</span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>{Math.floor(Math.random() * 10)}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" style={{ padding: 8 }} onClick={() => navigate(`/properties/${item.property_id || item._id || item.id}`)}>
                        <Eye size={14} />
                      </button>
                      <button className="btn btn-secondary btn-sm" style={{ padding: 8 }} onClick={() => handleEdit(item.property_id || item._id || item.id)}>
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-secondary btn-sm" style={{ padding: 8, color: 'var(--danger)' }} onClick={() => handleDelete(item.property_id || item._id || item.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
