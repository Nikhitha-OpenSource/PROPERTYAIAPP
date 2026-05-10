import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, List, MessageSquare, TrendingUp, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { propertiesApi, formatINR } from '../utils/api';
import { useAuthStore } from '../store/useStore';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MOCK_VIEWS_DATA = [
  { day: 'Mon', views: 45 },
  { day: 'Tue', views: 52 },
  { day: 'Wed', views: 38 },
  { day: 'Thu', views: 65 },
  { day: 'Fri', views: 48 },
  { day: 'Sat', views: 85 },
  { day: 'Sun', views: 110 },
];

const MOCK_TRENDS_DATA = [
  { month: 'Jan', views: 400, leads: 24 },
  { month: 'Feb', views: 300, leads: 18 },
  { month: 'Mar', views: 550, leads: 38 },
  { month: 'Apr', views: 480, leads: 31 },
  { month: 'May', views: 600, leads: 45 },
  { month: 'Jun', views: 750, leads: 52 },
];

export default function SellerPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'inquiries' | 'trends'>('listings');

  useEffect(() => {
    const sellerId = user?.user_id;
    if (!sellerId) {
      setListings([]);
      setLoading(false);
      return;
    }

    const fetchDashboardListings = async () => {
      setLoading(true);
      try {
        const liveRes = await propertiesApi.list({ page_size: 500, owner_user_id: sellerId });
        const liveItems = liveRes.data.items || [];
        
        setListings(liveItems);
      } catch (err) {
        console.error('Failed to fetch listings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardListings();
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
          <div 
            onClick={() => setActiveTab('listings')}
            style={{ padding: '12px 24px', background: activeTab === 'listings' ? 'var(--lightBg)' : 'transparent', color: activeTab === 'listings' ? 'var(--primary)' : 'var(--gray)', borderLeft: activeTab === 'listings' ? '4px solid var(--primary)' : '4px solid transparent', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <List size={18} /> My Listings
          </div>
          <div 
            onClick={() => setActiveTab('inquiries')}
            style={{ padding: '12px 24px', background: activeTab === 'inquiries' ? 'var(--lightBg)' : 'transparent', color: activeTab === 'inquiries' ? 'var(--primary)' : 'var(--gray)', borderLeft: activeTab === 'inquiries' ? '4px solid var(--primary)' : '4px solid transparent', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <MessageSquare size={18} /> Inquiries
          </div>
          <div 
            onClick={() => setActiveTab('trends')}
            style={{ padding: '12px 24px', background: activeTab === 'trends' ? 'var(--lightBg)' : 'transparent', color: activeTab === 'trends' ? 'var(--primary)' : 'var(--gray)', borderLeft: activeTab === 'trends' ? '4px solid var(--primary)' : '4px solid transparent', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <TrendingUp size={18} /> Market Trends
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: 32, background: 'var(--lightBg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1>
            {activeTab === 'listings' && 'My Property Listings'}
            {activeTab === 'inquiries' && 'Buyer Inquiries'}
            {activeTab === 'trends' && 'Seller Market Insights'}
          </h1>
          <button className="btn btn-primary" onClick={() => navigate('/list-property')}>
            <Plus size={18} /> List New Property
          </button>
        </div>

        {activeTab === 'listings' && (
          <>
        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: 24 }}>
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

        <div className="card" style={{ padding: 24, marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Weekly Profile Views</h3>
            <span className="badge badge-green">+15% vs last week</span>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_VIEWS_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--lightGray)" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--gray)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip cursor={{ fill: 'var(--lightBg)' }} />
                <Bar dataKey="views" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
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
          </>
        )}

        {activeTab === 'inquiries' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 24, borderBottom: '1px solid var(--lightGray)' }}>
              <h3>Recent Messages from Buyers</h3>
            </div>
            {[
              { name: 'Rahul Sharma', prop: 'Spacious 3BHK in Kondapur', msg: 'Hi, is the price negotiable? I would like to schedule a visit.', date: 'Today' },
              { name: 'Priya Desai', prop: '2BHK Apartment in Gachibowli', msg: 'Does this apartment have covered car parking?', date: 'Yesterday' },
              { name: 'Amit Patel', prop: 'Premium Plot in Shadnagar', msg: 'Are the land papers verified? What is the exact survey number?', date: '2 days ago' },
            ].map((msg, i) => (
              <div key={i} style={{ padding: 24, borderBottom: '1px solid var(--lightGray)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{msg.name}</div>
                    {i === 0 && <span className="badge badge-green">New</span>}
                  </div>
                  <div style={{ fontWeight: 400, color: 'var(--gray)', fontSize: '0.8rem', marginBottom: 8 }}>regarding {msg.prop}</div>
                  <div style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>"{msg.msg}"</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray)', marginBottom: 8 }}>{msg.date}</div>
                  <button className="btn btn-primary btn-sm">Reply</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'trends' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 16 }}>Views vs Leads (Last 6 Months)</h3>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MOCK_TRENDS_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--lightGray)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--gray)' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--gray)' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" name="Profile Views" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="leads" name="Leads Generated" stroke="var(--accent2)" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid-2" style={{ gap: 24 }}>
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ marginBottom: 16 }}>Demand in Your Localities</h3>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { locality: 'Kondapur', demand: 85 },
                      { locality: 'Gachibowli', demand: 72 },
                      { locality: 'Shadnagar', demand: 45 },
                      { locality: 'Banjara Hills', demand: 90 }
                    ]} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--lightGray)" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="locality" type="category" width={80} tick={{ fontSize: 11, fill: 'var(--gray)' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'var(--lightBg)' }} />
                      <Bar dataKey="demand" name="Demand Score" fill="var(--accent)" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, var(--lightBg3), var(--lightBg))' }}>
                <h3 style={{ marginBottom: 16 }}>💡 PROPIQ AI Insights</h3>
                <ul style={{ fontSize: '0.9rem', color: 'var(--gray)', lineHeight: 1.6, margin: 0, paddingLeft: 20 }}>
                  <li style={{ marginBottom: 8 }}>Properties in <strong>Kondapur</strong> with AI verification badges are selling 20% faster this month.</li>
                  <li style={{ marginBottom: 8 }}>Your <strong>2BHK listings</strong> are getting 3x more views when furnished—consider updating photos!</li>
                  <li>Upload legal deeds for your pending listings to boost your seller trust score.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
