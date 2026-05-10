import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle,
  ClipboardCheck,
  Database,
  Download,
  Eye,
  ExternalLink,
  FileText,
  MessageSquare,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { analyticsApi, deedApi, formatINR, propertiesApi } from '../utils/api';

type AdminTab = 'analytics' | 'powerbi' | 'pending' | 'active' | 'deeds';

const getPropertyId = (prop: any) => prop.property_id || prop._id || prop.id;

const formatDate = (value?: string) => {
  if (!value) return 'Pending';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Pending' : date.toLocaleString();
};

const scoreLabel = (score?: number) => {
  if (score === null || score === undefined) return 'Pending';
  return `${Math.round(Number(score) * 100)}%`;
};

const percent = (value?: number) => `${Math.round(Number(value || 0) * 100)}%`;

const badgeForStatus = (status?: string) => {
  const normalized = String(status || '').toUpperCase();
  if (['PASSED', 'APPROVED', 'LEGAL_CHECK', 'CLOSED', 'SOLD'].includes(normalized)) return 'badge badge-green';
  if (['REJECTED', 'BLOCKED', 'FLAGGED'].includes(normalized)) return 'badge badge-danger';
  if (['RUNNING', 'REVIEW_REQUIRED', 'NAME_VERIFY', 'OCR_EXTRACTION', 'PENDING'].includes(normalized)) return 'badge badge-gold';
  return 'badge badge-gray';
};

const downloadFile = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const toCsv = (rows: any[]) => {
  if (!rows.length) return '';
  const columns = Array.from(rows.reduce((keys: Set<string>, row) => {
    Object.keys(row || {}).forEach((key) => keys.add(key));
    return keys;
  }, new Set<string>()));
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => escape(row?.[column])).join(',')),
  ].join('\n');
};

export default function AdminPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [propertyTotal, setPropertyTotal] = useState(0);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [docStats, setDocStats] = useState<any>(null);
  const [sellerOps, setSellerOps] = useState<any>(null);
  const [powerBI, setPowerBI] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');

  const loadDashboard = async () => {
    setLoading(true);
    const [propRes, sellerOpsRes, docStatsRes, verificationRes, powerBIRes] = await Promise.allSettled([
      propertiesApi.list({ page_size: 500 }),
      analyticsApi.adminSellerOps(),
      deedApi.adminSummary(),
      deedApi.adminVerifications(),
      analyticsApi.powerBIDataset(),
    ]);

    if (propRes.status === 'fulfilled') {
      setProperties(propRes.value.data.items || []);
      setPropertyTotal(propRes.value.data.total || 0);
    }
    if (sellerOpsRes.status === 'fulfilled') setSellerOps(sellerOpsRes.value.data);
    if (docStatsRes.status === 'fulfilled') setDocStats(docStatsRes.value.data);
    if (verificationRes.status === 'fulfilled') setVerifications(verificationRes.value.data.items || []);
    if (powerBIRes.status === 'fulfilled') setPowerBI(powerBIRes.value.data);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleApprove = async (propertyId: string) => {
    try {
      await propertiesApi.patch(propertyId, { verified: true });
      setProperties((items) => items.map((p) => (getPropertyId(p) === propertyId ? { ...p, verified: true } : p)));
      alert('Property approved successfully.');
    } catch (error) {
      console.error('Error approving property:', error);
      alert('Failed to approve property.');
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (!propertyId) return;
    if (!window.confirm('Remove this property? This cannot be undone.')) return;
    try {
      await propertiesApi.delete(propertyId);
      setProperties((items) => items.filter((p) => getPropertyId(p) !== propertyId));
      alert('Property removed successfully.');
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to remove property.');
    }
  };

  const openDocument = async (doc: any) => {
    if (!doc?.url || doc.url === '#') return;
    if (/^https?:\/\//i.test(doc.url)) {
      window.open(doc.url, '_blank', 'noopener,noreferrer');
      return;
    }
    try {
      const response = await deedApi.documentBlob(doc.url);
      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: doc.content_type || 'application/octet-stream' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      console.error('Could not open deed document:', error);
      alert('Could not open this document. Please refresh and try again.');
    }
  };

  const handleVerificationDecision = async (verification: any, approved: boolean) => {
    const notes = approved
      ? 'Approved by admin after automated name match and legal checklist.'
      : window.prompt('Reason for rejecting this verification?', 'Rejected by admin after review.');
    if (!approved && notes === null) return;

    try {
      const { data } = await deedApi.updateVerification(verification.verification_id, {
        stage: approved ? 'APPROVED' : 'REJECTED',
        legal_check_status: approved ? 'PASSED' : 'REJECTED',
        notes,
      });
      const updated = data.verification || { ...verification, stage: approved ? 'APPROVED' : 'REJECTED', notes };
      setVerifications((items) => items.map((item) => (
        item.verification_id === verification.verification_id ? updated : item
      )));
    } catch (error) {
      console.error('Verification update failed:', error);
      alert('Could not update verification.');
    }
  };

  const visibleProperties = properties.filter((prop) => (
    activeTab === 'pending' ? !prop.verified : prop.verified
  ));

  const summary = sellerOps?.summary || {};
  const salesTrend = sellerOps?.sales_trend || [];
  const leadPipeline = sellerOps?.lead_pipeline || [];
  const sellerRows = sellerOps?.seller_performance || [];
  const topLocalities = sellerOps?.top_localities || [];
  const reviewInsights = sellerOps?.review_insights || {};
  const projection = sellerOps?.rule_based_projection || {};
  const powerBITables = powerBI?.tables || {};
  const powerBIReportUrl = String((import.meta.env.VITE_POWERBI_REPORT_URL || powerBI?.embed_url || '') as string);

  const statCards = [
    {
      label: 'Sellers',
      value: summary.total_sellers ?? 0,
      icon: Users,
      color: '#9b59b6',
      bg: 'rgba(155, 89, 182, 0.1)',
    },
    {
      label: 'Sold Value',
      value: formatINR(summary.sold_value || 0),
      icon: TrendingUp,
      color: 'var(--accent2)',
      bg: 'var(--lightBg2)',
    },
    {
      label: 'Closed Deals',
      value: summary.sold_count ?? 0,
      icon: CheckCircle,
      color: 'var(--primary)',
      bg: 'rgba(52, 152, 219, 0.1)',
    },
    {
      label: 'Open Leads',
      value: summary.open_leads ?? 0,
      icon: MessageSquare,
      color: 'var(--accent4)',
      bg: 'var(--lightBg4)',
    },
    {
      label: 'Review Flags',
      value: summary.flagged_items ?? 0,
      icon: AlertTriangle,
      color: 'var(--danger)',
      bg: '#FDEDEC',
    },
  ];

  const renderSellerAnalytics = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="grid-2" style={{ gap: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BarChart3 size={20} /> Sold Deals Trend</h3>
              <p style={{ fontSize: '0.85rem' }}>Closed lead value and new seller inventory. This is normal operations data.</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {sellerOps?.demo_data && <span className="badge badge-gold">Demo data</span>}
              <span className="badge badge-blue">No AI model</span>
            </div>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="soldValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent2)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--accent2)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--lightGray)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--gray)' }} />
                <YAxis hide />
                <Tooltip formatter={(value: number, key: string) => (
                  key === 'sold_value' ? [formatINR(value), 'Sold value'] : [value, key === 'sold_count' ? 'Deals sold' : 'New listings']
                )} />
                <Area type="monotone" dataKey="sold_value" stroke="var(--accent2)" strokeWidth={3} fill="url(#soldValue)" />
                <Area type="monotone" dataKey="new_listings" stroke="var(--accent)" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><MessageSquare size={20} /> Lead Pipeline</h3>
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadPipeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--lightGray)" />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: 'var(--gray)' }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
            <div className="badge badge-green" style={{ justifyContent: 'center' }}>Conversion {percent(summary.conversion_rate)}</div>
            <div className="badge badge-purple" style={{ justifyContent: 'center' }}>Reviews {summary.review_count ?? 0}</div>
            <div className="badge badge-gold" style={{ justifyContent: 'center' }}>Rating {summary.avg_rating ?? 'N/A'}</div>
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ gap: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <TrendingUp size={20} color="var(--accent2)" />
            <h3>Rule-Based Projection</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
            {projection.potential_sales_30d ?? 0} deals
          </div>
          <div style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>{formatINR(projection.potential_value_30d || 0)} possible 30-day value</div>
          <p style={{ marginTop: 12, fontSize: '0.8rem' }}>{projection.method || 'Uses open leads and current conversion rate. No AI model used.'}</p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Star size={20} color="var(--accent4)" />
            <h3>Reviews</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{reviewInsights.avg_rating ?? 'N/A'}</div>
          <div style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>{reviewInsights.total_reviews ?? 0} total reviews</div>
          <div style={{ marginTop: 12 }}>
            <span className={Number(reviewInsights.flagged_reviews || 0) > 0 ? 'badge badge-danger' : 'badge badge-green'}>
              {reviewInsights.flagged_reviews ?? 0} review flags
            </span>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Building2 size={20} color="var(--accent)" />
            <h3>Inventory</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{summary.total_listings ?? propertyTotal}</div>
          <div style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>seller listings</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <span className="badge badge-green">{summary.verified_listings ?? 0} verified</span>
            <span className="badge badge-gold">{summary.pending_listings ?? 0} pending</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Seller Performance</h3>
          <span className="badge badge-blue">Sold data + leads + reviews</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--lightBg3)' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '14px 20px' }}>Seller</th>
              <th style={{ textAlign: 'left', padding: '14px 20px' }}>Listings</th>
              <th style={{ textAlign: 'left', padding: '14px 20px' }}>Leads</th>
              <th style={{ textAlign: 'left', padding: '14px 20px' }}>Sold</th>
              <th style={{ textAlign: 'left', padding: '14px 20px' }}>Sold Value</th>
              <th style={{ textAlign: 'left', padding: '14px 20px' }}>Reviews</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 36, textAlign: 'center' }}>Loading seller analytics...</td></tr>
            ) : sellerRows.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 36, textAlign: 'center', color: 'var(--gray)' }}>No seller records yet.</td></tr>
            ) : sellerRows.map((seller: any) => (
              <tr key={seller.seller_id} style={{ borderTop: '1px solid var(--lightGray)' }}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ fontWeight: 700 }}>{seller.seller_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{seller.email || seller.seller_id}</div>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <strong>{seller.listings}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{seller.verified_listings} verified</div>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <strong>{seller.leads}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{percent(seller.conversion_rate)} conversion</div>
                </td>
                <td style={{ padding: '14px 20px' }}>{seller.sold_count}</td>
                <td style={{ padding: '14px 20px', fontWeight: 700 }}>{formatINR(seller.sold_value)}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span className={Number(seller.flagged_reviews || 0) > 0 ? 'badge badge-danger' : 'badge badge-green'}>
                    {seller.avg_rating ?? 'N/A'} / {seller.review_count}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid-2" style={{ gap: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 16 }}>Top Localities by Sold Data</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topLocalities.length === 0 ? (
              <p>No locality sales yet.</p>
            ) : topLocalities.map((item: any) => (
              <div key={item.locality} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, paddingBottom: 10, borderBottom: '1px solid var(--lightGray)' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{item.locality}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{item.listings} listings, avg {formatINR(item.avg_price)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800 }}>{item.sold_count} sold</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{formatINR(item.sold_value)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 16 }}>Review & Safety Queue</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(reviewInsights.moderation_queue || []).length === 0 ? (
              <p>No flagged reviews or risky chat messages.</p>
            ) : reviewInsights.moderation_queue.map((item: any, i: number) => (
              <div key={`${item.type}-${i}`} style={{ padding: 12, borderRadius: 8, background: 'var(--lightGray)' }}>
                <span className={item.type === 'review' ? 'badge badge-gold' : 'badge badge-danger'}>{item.type === 'review' ? 'Review' : 'Chat flag'}</span>
                <div style={{ marginTop: 8, fontSize: '0.85rem' }}>{item.comment || item.text}</div>
                <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--gray)' }}>{formatDate(item.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPowerBI = () => {
    const tableEntries = Object.entries(powerBITables as Record<string, any[]>);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="grid-3" style={{ gap: 24 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Database size={20} color="var(--accent)" />
              <h3>Power BI Dataset</h3>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{powerBI?.dataset_name || 'PROPIQ Admin Seller Operations'}</div>
            <div style={{ color: 'var(--gray)', fontSize: '0.82rem', marginTop: 6 }}>{formatDate(powerBI?.generated_at)}</div>
            <div style={{ marginTop: 12 }}>
              <span className={powerBI?.demo_data ? 'badge badge-gold' : 'badge badge-green'}>
                {powerBI?.demo_data ? 'Demo data' : 'Live data'}
              </span>
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <BarChart3 size={20} color="var(--accent2)" />
              <h3>Tables</h3>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{tableEntries.length}</div>
            <div style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>ready for import</div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Download size={20} color="var(--accent4)" />
              <h3>Export</h3>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => downloadFile('propiq-powerbi-dataset.json', JSON.stringify(powerBI || {}, null, 2), 'application/json')}
              disabled={!powerBI}
            >
              <Download size={16} /> JSON
            </button>
          </div>
        </div>

        {powerBIReportUrl ? (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--lightGray)' }}>
              <h3>Power BI Report</h3>
              <a className="btn btn-secondary btn-sm" href={powerBIReportUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={14} /> Open
              </a>
            </div>
            <iframe
              title="Power BI Report"
              src={powerBIReportUrl}
              style={{ width: '100%', height: 560, border: 'none', display: 'block' }}
              allowFullScreen
            />
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--lightGray)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart3 size={20} /> Power BI Report Preview
              </h3>
              <span className="badge badge-gold">Embed URL pending</span>
            </div>

            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="grid-3" style={{ gap: 14 }}>
                {[
                  ['Total Sellers', summary.total_sellers ?? 0],
                  ['Sold Value', formatINR(summary.sold_value || 0)],
                  ['Closed Deals', summary.sold_count ?? 0],
                  ['Open Leads', summary.open_leads ?? 0],
                  ['Conversion', percent(summary.conversion_rate)],
                  ['Avg Rating', summary.avg_rating ?? 'N/A'],
                ].map(([label, value]) => (
                  <div key={label} style={{ padding: 14, border: '1px solid var(--lightGray)', borderRadius: 8, background: '#fff' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{label}</div>
                    <div style={{ marginTop: 6, fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>{value}</div>
                  </div>
                ))}
              </div>

              <div className="grid-2" style={{ gap: 18 }}>
                <div style={{ minHeight: 290, border: '1px solid var(--lightGray)', borderRadius: 8, padding: 16, background: '#fff' }}>
                  <h3 style={{ marginBottom: 12 }}>Monthly Sold Value</h3>
                  <div style={{ height: 230 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesTrend}>
                        <defs>
                          <linearGradient id="powerbiSoldValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.03} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--lightGray)" />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--gray)' }} />
                        <YAxis hide />
                        <Tooltip formatter={(value: number, key: string) => (
                          key === 'sold_value' ? [formatINR(value), 'Sold value'] : [value, 'Closed deals']
                        )} />
                        <Area type="monotone" dataKey="sold_value" stroke="var(--primary)" strokeWidth={3} fill="url(#powerbiSoldValue)" />
                        <Area type="monotone" dataKey="sold_count" stroke="var(--accent2)" strokeWidth={2} fill="transparent" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ minHeight: 290, border: '1px solid var(--lightGray)', borderRadius: 8, padding: 16, background: '#fff' }}>
                  <h3 style={{ marginBottom: 12 }}>Lead Pipeline</h3>
                  <div style={{ height: 230 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={leadPipeline}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--lightGray)" />
                        <XAxis dataKey="stage" tick={{ fontSize: 11, fill: 'var(--gray)' }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid-2" style={{ gap: 18 }}>
                <div style={{ border: '1px solid var(--lightGray)', borderRadius: 8, padding: 16, background: '#fff' }}>
                  <h3 style={{ marginBottom: 12 }}>Top Sellers</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {sellerRows.slice(0, 5).map((seller: any) => (
                      <div key={seller.seller_id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{seller.seller_name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--gray)' }}>{seller.sold_count} deals, {seller.leads} leads</div>
                        </div>
                        <strong>{formatINR(seller.sold_value)}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ border: '1px solid var(--lightGray)', borderRadius: 8, padding: 16, background: '#fff' }}>
                  <h3 style={{ marginBottom: 12 }}>Top Localities</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {topLocalities.slice(0, 5).map((item: any) => (
                      <div key={item.locality} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{item.locality}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--gray)' }}>{item.listings} listings, {item.sold_count} sold</div>
                        </div>
                        <strong>{formatINR(item.sold_value)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid-3" style={{ gap: 18 }}>
          {tableEntries.map(([name, rows]) => (
            <div key={name} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <h3 style={{ textTransform: 'capitalize' }}>{name.replace(/_/g, ' ')}</h3>
                  <p style={{ fontSize: '0.82rem' }}>{rows.length} rows</p>
                </div>
                <span className="badge badge-blue">Power BI</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => downloadFile(`propiq-${name}.csv`, toCsv(rows), 'text/csv')}
                  disabled={!rows.length}
                >
                  <Download size={14} /> CSV
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => downloadFile(`propiq-${name}.json`, JSON.stringify(rows, null, 2), 'application/json')}
                  disabled={!rows.length}
                >
                  <Download size={14} /> JSON
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPropertyTable = () => (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: 'var(--lightBg3)' }}>
          <tr>
            <th style={{ textAlign: 'left', padding: '16px 24px' }}>Property Details</th>
            <th style={{ textAlign: 'left', padding: '16px 24px' }}>Seller</th>
            <th style={{ textAlign: 'left', padding: '16px 24px' }}>Price</th>
            <th style={{ textAlign: 'left', padding: '16px 24px' }}>Verification</th>
            <th style={{ textAlign: 'right', padding: '16px 24px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center' }}>Loading listings...</td></tr>
          ) : visibleProperties.length === 0 ? (
            <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--gray)' }}>No listings in this view.</td></tr>
          ) : visibleProperties.map((prop, i) => (
            <tr key={getPropertyId(prop) || i} style={{ borderTop: '1px solid var(--lightGray)' }}>
              <td style={{ padding: '16px 24px' }}>
                <div style={{ fontWeight: 600 }}>{prop.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{prop.locality}, {prop.city}</div>
              </td>
              <td style={{ padding: '16px 24px' }}>
                <div style={{ fontSize: '0.9rem' }}>{prop.owner_name || ['John Doe', 'Priya Rao', 'Amit Shah'][i % 3]}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>UID: {prop.owner_user_id || `8273${i}`}</div>
              </td>
              <td style={{ padding: '16px 24px' }}>{formatINR(prop.price)}</td>
              <td style={{ padding: '16px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: prop.verified ? 'var(--accent2)' : 'var(--accent4)', fontSize: '0.85rem' }}>
                  {prop.verified ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                  {prop.verified ? 'Verified' : 'Pending Review'}
                </div>
                {!prop.verified && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: 4 }}>
                    Check Deed Tools before approval
                  </div>
                )}
              </td>
              <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  {!prop.verified && (
                    <button className="btn btn-primary btn-sm" style={{ background: 'var(--accent2)', border: 'none' }} onClick={() => {
                      if (window.confirm('Please confirm the deed check is completed and approved in the Buyer Verification Docs tab. Proceed with listing approval?')) {
                        handleApprove(getPropertyId(prop));
                      }
                    }}>
                      <CheckCircle size={14} /> Approve
                    </button>
                  )}
                  <button className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)', padding: 8 }} onClick={() => handleDelete(getPropertyId(prop))}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderDeedTable = () => (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: 'var(--lightBg2)' }}>
          <tr>
            <th style={{ textAlign: 'left', padding: '16px 20px' }}>Buyer / Parcel</th>
            <th style={{ textAlign: 'left', padding: '16px 20px' }}>Documents</th>
            <th style={{ textAlign: 'left', padding: '16px 20px' }}>Name Match</th>
            <th style={{ textAlign: 'left', padding: '16px 20px' }}>Legal Check</th>
            <th style={{ textAlign: 'left', padding: '16px 20px' }}>Status</th>
            <th style={{ textAlign: 'right', padding: '16px 20px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center' }}>Loading verification docs...</td></tr>
          ) : verifications.length === 0 ? (
            <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--gray)' }}>No buyer verification documents uploaded yet.</td></tr>
          ) : verifications.map((verification) => {
            const matchOk = Number(verification.name_match_score || 0) >= 0.85;
            return (
              <tr key={verification.verification_id} style={{ borderTop: '1px solid var(--lightGray)', verticalAlign: 'top' }}>
                <td style={{ padding: '16px 20px', minWidth: 180 }}>
                  <div style={{ fontWeight: 700 }}>{verification.submitted_by_name || 'Buyer'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>Parcel: {verification.parcel_id}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: 4 }}>Updated {formatDate(verification.updated_at)}</div>
                </td>
                <td style={{ padding: '16px 20px', minWidth: 220 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(verification.documents || []).map((doc: any) => (
                      <button
                        key={`${verification.verification_id}-${doc.filename}`}
                        className="btn btn-secondary btn-sm"
                        style={{ justifyContent: 'space-between', maxWidth: 240 }}
                        onClick={() => openDocument(doc)}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <FileText size={14} /> {doc.filename}
                        </span>
                        <Eye size={14} />
                      </button>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '16px 20px', minWidth: 180 }}>
                  <span className={matchOk ? 'badge badge-green' : 'badge badge-danger'}>
                    <ClipboardCheck size={14} /> {scoreLabel(verification.name_match_score)}
                  </span>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray)', marginTop: 8 }}>
                    Declared: <strong>{verification.declared_name || 'Pending'}</strong>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray)' }}>
                    OCR: <strong>{verification.extracted_name || 'Pending'}</strong>
                  </div>
                </td>
                <td style={{ padding: '16px 20px', minWidth: 260 }}>
                  <span className={badgeForStatus(verification.legal_check_status)}>
                    <Scale size={14} /> {verification.legal_check_status || 'PENDING'}
                  </span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: 8, lineHeight: 1.5 }}>
                    {verification.legal_check_summary || verification.notes || 'Legal RAG checklist pending.'}
                  </div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span className={badgeForStatus(verification.stage)}>{verification.stage || 'UPLOAD'}</span>
                  {verification.notes && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: 8 }}>{verification.notes}</div>
                  )}
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                    {verification.stage !== 'APPROVED' && (
                      <button className="btn btn-primary btn-sm" style={{ background: 'var(--accent2)', border: 'none' }} onClick={() => handleVerificationDecision(verification, true)}>
                        <CheckCircle size={14} /> Approve
                      </button>
                    )}
                    {verification.stage !== 'REJECTED' && (
                      <button className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleVerificationDecision(verification, false)}>
                        <XCircle size={14} /> Reject
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ padding: 32, maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1>Admin Command Center</h1>
          <p style={{ color: 'var(--gray)' }}>Seller operations, sold data, reviews, listings, and buyer verification docs</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: 16, color: 'var(--gray)' }} />
            <input type="text" className="form-control" placeholder="Search listings..." style={{ paddingLeft: 40, width: 250 }} />
          </div>
          <button className="btn btn-primary" onClick={loadDashboard}><RefreshCw size={18} /> Refresh</button>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: bg, color, padding: 10, borderRadius: 8 }}>
              <Icon size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--gray)' }}>{label}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{value}</div>
            </div>
          </div>
        ))}
        <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ background: 'var(--lightBg2)', color: 'var(--accent2)', padding: 10, borderRadius: 8 }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--gray)' }}>Buyer Doc Checks</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{docStats?.total_verifications ?? verifications.length}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--lightGray)', marginBottom: 24, overflowX: 'auto' }}>
        {[
          { key: 'analytics', label: 'Seller Analytics' },
          { key: 'powerbi', label: 'Power BI' },
          { key: 'pending', label: 'Pending Listings' },
          { key: 'active', label: 'Active Listings' },
          { key: 'deeds', label: 'Buyer Verification Docs' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as AdminTab)}
            style={{
              padding: '12px 20px',
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === key ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === key ? 'var(--primary)' : 'var(--gray)',
              fontWeight: activeTab === key ? 700 : 500,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'analytics' && renderSellerAnalytics()}
      {activeTab === 'powerbi' && renderPowerBI()}
      {(activeTab === 'pending' || activeTab === 'active') && renderPropertyTable()}
      {activeTab === 'deeds' && renderDeedTable()}
    </div>
  );
}
