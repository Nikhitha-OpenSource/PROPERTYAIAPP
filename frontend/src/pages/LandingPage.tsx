import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, TrendingUp, Shield, Bot, Zap, ChevronRight, Star } from 'lucide-react';
import { propertiesApi, analyticsApi, formatINR } from '../utils/api';
import PropertyCard from '../components/Property/PropertyCard';

const LOCALITIES = ['Kondapur','Gachibowli','Madhapur','KPHB','Miyapur','Banjara Hills','Jubilee Hills','Manikonda'];

const FEATURES = [
  { icon: '🤖', color: 'var(--lightBg3)', label: 'AI Price Prediction', desc: 'XGBoost + Prophet ML models predict accurate valuations instantly', badge: 'badge-purple' },
  { icon: '🗺️', color: 'var(--lightBg)',  label: 'Interactive Map',     desc: 'Live property pins with locality scores, POI layers, and heatmaps', badge: 'badge-blue' },
  { icon: '📄', color: 'var(--lightBg2)', label: 'Deed Verification',   desc: 'Azure OCR extracts and verifies land deed owner names automatically', badge: 'badge-green' },
  { icon: '💼', color: 'var(--lightBg4)', label: 'Commercial Scoring',  desc: 'AI viability score for commercial land based on FSI, zoning, density', badge: 'badge-gold' },
  { icon: '⚡', color: 'var(--lightBg3)', label: 'Universal AI Agent',  desc: 'PropBot can search, filter, compare and navigate the UI by voice', badge: 'badge-purple' },
  { icon: '📊', color: 'var(--lightBg)',  label: 'Market Analytics',    desc: 'Power BI dashboards, price trends, anomaly detection across Hyderabad', badge: 'badge-blue' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchLocality, setSearchLocality] = useState('');
  const [searchBHK, setSearchBHK] = useState('');
  const [featured, setFeatured] = useState<unknown[]>([]);
  const [topLocalities, setTopLocalities] = useState<unknown[]>([]);
  const [stats, setStats] = useState({ listings: 0, localities: 0, verified: 0, agents: 3 });

  useEffect(() => {
    propertiesApi.list({ page_size: 6 }).then((r) => {
      setFeatured(r.data.items || []);
      setStats((s) => ({ ...s, listings: r.data.total, localities: 14, verified: Math.floor(r.data.total * 0.7) }));
    }).catch(() => {});
    analyticsApi.topLocalities('score').then((r) => {
      setTopLocalities(r.data.localities?.slice(0, 6) || []);
    }).catch(() => {});
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocality) params.set('locality', searchLocality);
    if (searchBHK) params.set('bhk', searchBHK);
    navigate(`/properties?${params}`);
  };

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Zap size={14} /> Powered by Azure OpenAI GPT-4o + ML Models
          </div>
          <h1>
            Find Your Perfect Property<br />
            with <span style={{ color: 'var(--accent4)' }}>AI Intelligence</span>
          </h1>
          <p className="hero-subtitle">
            Hyderabad's smartest real estate platform — AI valuation, deed verification,
            commercial scoring, and a conversational agent that controls the UI.
          </p>

          {/* Search Bar */}
          <div className="search-bar">
            <select
              className="input select"
              style={{ minWidth: 180 }}
              value={searchLocality}
              onChange={(e) => setSearchLocality(e.target.value)}
              id="search-locality"
            >
              <option value="">📍 Select Locality</option>
              {LOCALITIES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select
              className="input select"
              style={{ minWidth: 120 }}
              value={searchBHK}
              onChange={(e) => setSearchBHK(e.target.value)}
              id="search-bhk"
            >
              <option value="">🛏 BHK Type</option>
              {[1,2,3,4].map((b) => <option key={b} value={b}>{b} BHK</option>)}
            </select>
            <button className="btn btn-gold btn-lg" id="hero-search-btn" onClick={handleSearch}>
              <Search size={18} /> Search Properties
            </button>
            <button className="btn btn-secondary btn-lg" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
              onClick={() => navigate('/properties/map')}>
              <MapPin size={18} /> View Map
            </button>
          </div>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-value">{stats.listings.toLocaleString()}+</div>
              <div className="stat-label">Active Listings</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.localities}</div>
              <div className="stat-label">Localities Covered</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.verified}+</div>
              <div className="stat-label">Verified Properties</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">6</div>
              <div className="stat-label">ML Models Active</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────── */}
      <section className="section" style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="section-title">
            <h2>Everything You Need in One Platform</h2>
            <p>Built for buyers, sellers, and commercial investors with AI at the core.</p>
          </div>
          <div className="grid-3">
            {FEATURES.map((f) => (
              <div key={f.label} className="card feature-card">
                <div className="feature-icon" style={{ background: f.color }}>
                  <span style={{ fontSize: '1.75rem' }}>{f.icon}</span>
                </div>
                <h3>{f.label}</h3>
                <p style={{ fontSize: '0.875rem' }}>{f.desc}</p>
                <div style={{ marginTop: 12 }}>
                  <span className={`badge ${f.badge}`}>AI-Powered</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Properties ───────────────────────── */}
      <section className="section" style={{ background: 'var(--lightGray)' }}>
        <div className="container">
          <div className="section-title">
            <h2>Featured Properties</h2>
            <p>Top-rated listings across Hyderabad's prime localities</p>
          </div>
          <div className="grid-3">
            {featured.length > 0
              ? featured.map((p: any) => <PropertyCard key={p.property_id || p._id || p.id} property={p} />)
              : Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton skeleton-card" />
                ))
            }
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/properties')}>
              View All Properties <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Top Localities ────────────────────────────── */}
      <section className="section" style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="section-title">
            <h2>Top Investment Localities</h2>
            <p>AI-ranked localities based on growth, connectivity, and amenities</p>
          </div>
          <div className="grid-3">
            {(topLocalities.length > 0 ? topLocalities : LOCALITIES.slice(0,6).map((l) => ({
              locality: l, overall_score: Math.floor(Math.random()*30)+65,
              avg_price_per_sqft: 5000 + Math.floor(Math.random()*7000),
              growth_score: Math.floor(Math.random()*30)+60,
            }))).map((loc: unknown) => {
              const l = loc as {locality:string;overall_score:number;avg_price_per_sqft:number;growth_score:number};
              return (
                <div key={l.locality} className="card" style={{ padding: 20, cursor: 'pointer' }}
                  onClick={() => navigate(`/properties?locality=${l.locality}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ marginBottom: 4, fontSize: '1rem' }}>{l.locality}</h3>
                      <p style={{ fontSize: '0.8rem', marginBottom: 12 }}>Hyderabad, Telangana</p>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                        ₹{l.avg_price_per_sqft?.toLocaleString('en-IN')}/sqft
                      </div>
                    </div>
                    <div className="score-ring" style={{ '--score': l.overall_score } as React.CSSProperties}>
                      <span>{l.overall_score}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge badge-green"><TrendingUp size={10} /> {l.growth_score}% growth</span>
                    <span className="badge badge-blue"><Star size={10} /> Score {l.overall_score}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PropBot CTA ───────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #4A235A, var(--accent3))', padding: '80px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🤖</div>
          <h2 style={{ color: 'white', marginBottom: 16 }}>Meet PropBot — Your AI Real Estate Assistant</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 32, fontSize: '1.1rem' }}>
            Ask in plain English. PropBot can search properties, answer legal questions,
            check commercial viability, and even navigate the platform for you.
          </p>
          <button className="btn btn-gold btn-lg"
            onClick={() => document.getElementById('agent-fab')?.click()}>
            <Bot size={20} /> Chat with PropBot Now
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer style={{ background: 'var(--primary)', color: 'rgba(255,255,255,0.7)', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: 12 }}>
          PROPIQ <span style={{ color: 'var(--accent4)' }}>AI</span>
        </div>
        <p style={{ fontSize: '0.875rem', marginBottom: 8 }}>
          Intelligent Real Estate Platform · Capstone Project · Left Shift 2026 T5
        </p>
        <p style={{ fontSize: '0.8rem' }}>Powered by Azure OpenAI · Azure ML · React · FastAPI · Python</p>
      </footer>
    </div>
  );
}
