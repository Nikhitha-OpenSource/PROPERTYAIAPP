import { useEffect, useState } from 'react';
import { analyticsApi, formatINR } from '../utils/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, MapPin, Building2, Activity } from 'lucide-react';

const COLORS = ['#2E86C1','#117A65','#9B59B6','#D4AC0D','#C0392B','#1B4F72','#2ECC71','#E74C3C'];

export default function AnalyticsPage() {
  const [trends, setTrends] = useState<Record<string, unknown[]>>({});
  const [topLocalities, setTopLocalities] = useState<unknown[]>([]);
  const [commercialZones, setCommercialZones] = useState<unknown[]>([]);
  const [heatmap, setHeatmap] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.marketTrends(),
      analyticsApi.topLocalities('score'),
      analyticsApi.commercialZones(),
      analyticsApi.heatmap(),
    ]).then(([t, top, zones, heat]) => {
      setTrends(t.data.trends || {});
      setTopLocalities(top.data.localities || []);
      setCommercialZones(zones.data.zones || []);
      setHeatmap(heat.data.features?.map((f: {properties:{locality:string;price_per_sqft:number}}) => f.properties) || []);
    }).finally(() => setLoading(false));
  }, []);

  // Build chart data from trends
  const localities = Object.keys(trends).slice(0, 4);
  const months = trends[localities[0]]?.map((m: unknown) => (m as {month:string}).month) || [];
  const chartData = months.map((month, idx) => {
    const row: Record<string, unknown> = { month };
    localities.forEach((loc) => {
      row[loc] = (trends[loc]?.[idx] as {avg_price_per_sqft:number})?.avg_price_per_sqft;
    });
    return row;
  });

  // KPIs
  const avgPrice = heatmap.length
    ? Math.round(
        (heatmap as { price_per_sqft: number }[]).reduce((s, h) => s + h.price_per_sqft, 0) / heatmap.length
      )
    : 0;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 60px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="gradient-text">Market Analytics Dashboard</h1>
        <p>Real-time intelligence on Hyderabad property market trends and commercial zones.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        <div className="card kpi-card" style={{ borderLeftColor: 'var(--accent)' }}>
          <div className="kpi-value">{avgPrice ? `₹${avgPrice.toLocaleString('en-IN')}` : '—'}</div>
          <div className="kpi-label">Avg Price/sqft · Hyderabad</div>
          <div className="kpi-change positive"><TrendingUp size={12} /> +8.2% YoY</div>
        </div>
        <div className="card kpi-card" style={{ borderLeftColor: 'var(--accent2)' }}>
          <div className="kpi-value">{topLocalities.length}</div>
          <div className="kpi-label">Localities Tracked</div>
          <div className="kpi-change positive"><Activity size={12} /> Live Data</div>
        </div>
        <div className="card kpi-card" style={{ borderLeftColor: 'var(--accent4)' }}>
          <div className="kpi-value">{commercialZones.length}</div>
          <div className="kpi-label">Commercial Zones</div>
          <div className="kpi-change positive"><Building2 size={12} /> AI Scored</div>
        </div>
        <div className="card kpi-card" style={{ borderLeftColor: 'var(--accent3)' }}>
          <div className="kpi-value">6</div>
          <div className="kpi-label">Active ML Models</div>
          <div className="kpi-change positive"><MapPin size={12} /> Azure ML</div>
        </div>
      </div>

      {/* Price Trends Chart */}
      {chartData.length > 0 && (
        <div className="card chart-container" style={{ marginBottom: 24 }}>
          <div className="chart-title">📈 Locality Price Trends (Last 12 Months)</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--lightGray)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--gray)' }} />
              <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--gray)' }} />
              <Tooltip formatter={(v: number) => [`₹${v?.toLocaleString('en-IN')}/sqft`]} />
              <Legend />
              {localities.map((loc, i) => (
                <Line key={loc} type="monotone" dataKey={loc} stroke={COLORS[i]} strokeWidth={2.5} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid-2" style={{ gap: 24 }}>
        {/* Top Localities Bar Chart */}
        {topLocalities.length > 0 && (
          <div className="card chart-container">
            <div className="chart-title">🏆 Top Localities by Score</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topLocalities.slice(0,8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--lightGray)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="locality" type="category" width={90} tick={{ fontSize: 11, fill: 'var(--gray)' }} />
                <Tooltip formatter={(v: number) => [v, 'Score']} />
                <Bar dataKey="overall_score" fill="var(--accent)" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Commercial Zones Table */}
        {commercialZones.length > 0 && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '20px 20px 12px', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem' }}>
              🏢 Commercial Zone Intelligence
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="compare-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Zone</th>
                    <th>FSI</th>
                    <th>Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(commercialZones as {zone:string;fsi:number;score:number;road_width:number;status:string}[]).map((z, i) => (
                    <tr key={z.zone} style={{ background: i % 2 === 0 ? 'var(--rowAlt)' : 'white' }}>
                      <td style={{ fontWeight: 600 }}>{z.zone}</td>
                      <td>{z.fsi}</td>
                      <td className={z.score >= 80 ? 'winner' : ''} style={{ fontWeight: 700 }}>{z.score}</td>
                      <td>
                        <span className={`badge ${z.status==='Prime'?'badge-green':z.status==='Good'?'badge-blue':'badge-gray'}`}>
                          {z.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Price Table */}
      {heatmap.length > 0 && (
        <div className="card" style={{ marginTop: 24, overflow: 'hidden' }}>
          <div style={{ padding: '20px 20px 12px', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem' }}>
            🌡️ Price Heatmap — Hyderabad Localities
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '0 20px 20px' }}>
            {(heatmap as {locality:string;price_per_sqft:number;intensity:number}[]).map((h) => (
              <div key={h.locality} style={{
                padding: '10px 16px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 600,
                background: `rgba(46,134,193,${0.15 + h.intensity * 0.7})`,
                color: h.intensity > 0.6 ? 'white' : 'var(--primary)',
              }}>
                {h.locality}<br />
                <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>₹{h.price_per_sqft.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="grid-2" style={{ gap: 24 }}>
          <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />
        </div>
      )}
    </div>
  );
}
