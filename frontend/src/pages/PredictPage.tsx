import { useState } from 'react';
import { predictApi, analyticsApi, formatINR } from '../utils/api';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Cpu, TrendingUp, BarChart2 } from 'lucide-react';

const LOCALITIES = ['Kondapur','Gachibowli','Madhapur','HITEC City','Miyapur','KPHB','Banjara Hills','Jubilee Hills','Manikonda','Kukatpally','Uppal','Secunderabad'];

type Tab = 'price' | 'commercial' | 'appreciation';

export default function PredictPage() {
  const [tab, setTab] = useState<Tab>('price');

  // Price Prediction state
  const [priceForm, setPriceForm] = useState({ locality: 'Kondapur', area_sqft: 1200, bhk: 2, age_years: 5, amenity_count: 4, furnishing: 'SEMI' });
  const [priceResult, setPriceResult] = useState<Record<string, unknown> | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // Commercial Score state
  const [commForm, setCommForm] = useState({ land_use_zone: 'COMMERCIAL', fsi_allowed: 2.5, road_width: 18, area_sqft: 5000, latitude: 17.44, longitude: 78.38 });
  const [commResult, setCommResult] = useState<Record<string, unknown> | null>(null);
  const [commLoading, setCommLoading] = useState(false);

  // Appreciation state
  const [appForm, setAppForm] = useState({ locality: 'Kondapur', current_price_per_sqft: 7500 });
  const [appResult, setAppResult] = useState<Record<string, unknown> | null>(null);
  const [appLoading, setAppLoading] = useState(false);

  const runPricePredict = async () => {
    setPriceLoading(true);
    try { const { data } = await predictApi.landPrice(priceForm); setPriceResult(data); }
    catch { } finally { setPriceLoading(false); }
  };

  const runCommercial = async () => {
    setCommLoading(true);
    try { const { data } = await predictApi.commercialScore(commForm); setCommResult(data); }
    catch { } finally { setCommLoading(false); }
  };

  const runAppreciation = async () => {
    setAppLoading(true);
    try { const { data } = await predictApi.appreciation({ ...appForm, horizon_years: [1, 3, 5] }); setAppResult(data); }
    catch { } finally { setAppLoading(false); }
  };

  const scoreColor = (score: number) => score >= 65 ? 'var(--accent2)' : score >= 35 ? 'var(--accent4)' : 'var(--danger)';

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 60px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="gradient-text">AI Property Intelligence</h1>
        <p>Get instant ML-powered predictions for price valuation, commercial viability, and appreciation forecasts.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32, borderBottom: '2px solid var(--borderGray)', paddingBottom: 0 }}>
        {([
          { key: 'price', icon: <BarChart2 size={16} />, label: 'Price Prediction' },
          { key: 'commercial', icon: <Cpu size={16} />, label: 'Commercial Score' },
          { key: 'appreciation', icon: <TrendingUp size={16} />, label: 'Appreciation Forecast' },
        ] as { key: Tab; icon: JSX.Element; label: string }[]).map(({ key, icon, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`btn btn-sm ${tab === key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none', marginBottom: -2 }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── Price Prediction ─── */}
      {tab === 'price' && (
        <div className="grid-2" style={{ gap: 24 }}>
          <div className="card" style={{ padding: 28 }}>
            <h3 style={{ marginBottom: 20 }}>🏠 Property Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>LOCALITY</label>
                <select id="predict-locality" className="input select" value={priceForm.locality} onChange={(e) => setPriceForm((f) => ({ ...f, locality: e.target.value }))}>
                  {LOCALITIES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>AREA (sqft)</label>
                  <input id="predict-area" className="input" type="number" value={priceForm.area_sqft} onChange={(e) => setPriceForm((f) => ({ ...f, area_sqft: Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>BHK</label>
                  <select id="predict-bhk" className="input select" value={priceForm.bhk} onChange={(e) => setPriceForm((f) => ({ ...f, bhk: Number(e.target.value) }))}>
                    {[1,2,3,4].map((b) => <option key={b} value={b}>{b} BHK</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>AGE (years)</label>
                  <input id="predict-age" className="input" type="number" min={0} max={50} value={priceForm.age_years} onChange={(e) => setPriceForm((f) => ({ ...f, age_years: Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>FURNISHING</label>
                  <select id="predict-furnishing" className="input select" value={priceForm.furnishing} onChange={(e) => setPriceForm((f) => ({ ...f, furnishing: e.target.value }))}>
                    <option value="FURNISHED">Furnished</option>
                    <option value="SEMI">Semi-Furnished</option>
                    <option value="UNFURNISHED">Unfurnished</option>
                  </select>
                </div>
              </div>
              <button id="run-price-predict" className="btn btn-primary" onClick={runPricePredict} disabled={priceLoading} style={{ marginTop: 8 }}>
                {priceLoading ? '⏳ Predicting...' : '🤖 Predict Price'}
              </button>
            </div>
          </div>

          {priceResult ? (
            <div className="card" style={{ padding: 28, background: 'linear-gradient(135deg, var(--lightBg3), var(--lightBg))' }}>
              <h3 style={{ marginBottom: 4 }}>AI Valuation Result</h3>
              <p style={{ fontSize: '0.8rem', marginBottom: 24 }}>Model: {String(priceResult.model_version)}</p>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', fontWeight: 900, color: 'var(--primary)', marginBottom: 8 }}>
                {formatINR(Number(priceResult.predicted_price))}
              </div>
              <div style={{ color: 'var(--gray)', marginBottom: 24 }}>
                ₹{Number(priceResult.predicted_price_per_sqft).toLocaleString('en-IN')}/sqft
              </div>
              <div style={{ background: 'white', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray)', marginBottom: 8 }}>Confidence Range</div>
                <div style={{ height: 8, background: 'var(--lightGray)', borderRadius: 100, position: 'relative', marginBottom: 8 }}>
                  <div style={{ position: 'absolute', left: '20%', right: '20%', top: 0, height: '100%', background: 'var(--accent)', borderRadius: 100 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span>{formatINR(Number(priceResult.confidence_low))}</span>
                  <span>{formatINR(Number(priceResult.confidence_high))}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--lightGray)' }}>
              <div style={{ textAlign: 'center', color: 'var(--gray)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>🤖</div>
                <p>Fill the form and click "Predict Price" to get an AI-powered valuation.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Commercial Score ─── */}
      {tab === 'commercial' && (
        <div className="grid-2" style={{ gap: 24 }}>
          <div className="card" style={{ padding: 28 }}>
            <h3 style={{ marginBottom: 20 }}>🏢 Land / Plot Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>LAND USE ZONE</label>
                <select id="comm-zone" className="input select" value={commForm.land_use_zone} onChange={(e) => setCommForm((f) => ({ ...f, land_use_zone: e.target.value }))}>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="MIXED">Mixed Use</option>
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="INDUSTRIAL">Industrial</option>
                </select>
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>FSI ALLOWED</label>
                  <input id="comm-fsi" className="input" type="number" step={0.5} min={1} max={6} value={commForm.fsi_allowed} onChange={(e) => setCommForm((f) => ({ ...f, fsi_allowed: Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>ROAD WIDTH (m)</label>
                  <input id="comm-road" className="input" type="number" value={commForm.road_width} onChange={(e) => setCommForm((f) => ({ ...f, road_width: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>PLOT AREA (sqft)</label>
                <input id="comm-area" className="input" type="number" value={commForm.area_sqft} onChange={(e) => setCommForm((f) => ({ ...f, area_sqft: Number(e.target.value) }))} />
              </div>
              <button id="run-commercial-score" className="btn btn-teal" onClick={runCommercial} disabled={commLoading}>
                {commLoading ? '⏳ Analyzing...' : '🏢 Get Commercial Score'}
              </button>
            </div>
          </div>

          {commResult ? (
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ marginBottom: 20 }}>Commercial Viability Result</h3>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <div style={{ width: 140, height: 140, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                  background: `conic-gradient(${scoreColor(Number(commResult.score))} ${Number(commResult.score) * 3.6}deg, var(--lightGray) 0)`,
                  position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 12, background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 900, color: scoreColor(Number(commResult.score)) }}>{Number(commResult.score).toFixed(0)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>/ 100</div>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <span className={`badge ${commResult.label==='HIGH'?'badge-green':commResult.label==='MEDIUM'?'badge-gold':'badge-danger'}`} style={{ fontSize: '1rem', padding: '6px 16px' }}>
                  {String(commResult.label)} Viability
                </span>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', marginBottom: 8 }}>KEY FACTORS</div>
                {(commResult.top_factors as string[]).map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--accent2)', flexShrink: 0 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: 12, background: 'var(--lightBg2)', borderRadius: 8, fontSize: '0.8rem' }}>
                🏪 Nearby businesses: <strong>{String(commResult.nearby_business_count)}</strong> within 1km
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--lightGray)' }}>
              <div style={{ textAlign: 'center', color: 'var(--gray)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏢</div>
                <p>Enter land details to get an AI commercial viability score.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Appreciation Forecast ─── */}
      {tab === 'appreciation' && (
        <div className="grid-2" style={{ gap: 24 }}>
          <div className="card" style={{ padding: 28 }}>
            <h3 style={{ marginBottom: 20 }}>📈 Appreciation Inputs</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>LOCALITY</label>
                <select id="app-locality" className="input select" value={appForm.locality} onChange={(e) => setAppForm((f) => ({ ...f, locality: e.target.value }))}>
                  {LOCALITIES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>CURRENT PRICE (₹/sqft)</label>
                <input id="app-ppsf" className="input" type="number" value={appForm.current_price_per_sqft} onChange={(e) => setAppForm((f) => ({ ...f, current_price_per_sqft: Number(e.target.value) }))} />
              </div>
              <button id="run-appreciation" className="btn btn-gold" onClick={runAppreciation} disabled={appLoading}>
                {appLoading ? '⏳ Forecasting...' : '📈 Forecast Appreciation'}
              </button>
            </div>
          </div>

          {appResult ? (
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ marginBottom: 20 }}>Appreciation Forecast — {String(appResult.locality)}</h3>
              {(['1yr','3yr','5yr'] as const).map((yr) => {
                const f = (appResult.forecasts as Record<string, {projected_price_per_sqft:number;appreciation_pct:number;annual_rate_pct:number;confidence:string}>)[yr];
                return f ? (
                  <div key={yr} className="card" style={{ padding: 16, marginBottom: 12, borderLeft: `4px solid ${yr==='1yr'?'var(--accent)':yr==='3yr'?'var(--accent2)':'var(--accent4)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--gray)' }}>{yr} Forecast</div>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                          ₹{f.projected_price_per_sqft.toLocaleString('en-IN')}/sqft
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--accent2)', fontWeight: 700, fontSize: '1.2rem' }}>+{f.appreciation_pct}%</div>
                        <span className={`badge ${f.confidence==='HIGH'?'badge-green':f.confidence==='MEDIUM'?'badge-blue':'badge-gray'}`}>{f.confidence}</span>
                      </div>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          ) : (
            <div className="card" style={{ padding: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--lightGray)' }}>
              <div style={{ textAlign: 'center', color: 'var(--gray)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>📈</div>
                <p>Select locality and price to forecast 1/3/5-year appreciation.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
