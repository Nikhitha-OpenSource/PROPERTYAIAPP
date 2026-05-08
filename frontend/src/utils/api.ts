import axios from 'axios';
import {
  MOCK_PROPERTIES, MOCK_PROPERTY_DETAIL, MOCK_GEOJSON,
  MOCK_MARKET_TRENDS, MOCK_TOP_LOCALITIES, MOCK_COMMERCIAL_ZONES, MOCK_HEATMAP,
  MOCK_PRICE_PREDICTION, MOCK_COMMERCIAL_SCORE, MOCK_APPRECIATION,
  MOCK_AGENT_CHAT,
  MOCK_DEED_STATUS, MOCK_DEED_TIMELINE, MOCK_STAMP_DUTY, MOCK_RERA,
} from './mockData';

// ── Toggle this to false when real backend is running ──────────────────────
export const USE_MOCK = String(import.meta.env.VITE_USE_MOCK ?? 'false').toLowerCase() === 'true';

// Simulated network delay (ms)
const delay = (ms = 350) => new Promise(res => setTimeout(res, ms));
const mock = async <T>(data: T) => { await delay(); return { data }; };

// ── Real Axios instance (used when USE_MOCK=false) ─────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const requestUrl = String(err.config?.url || '');
    const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
    if (err.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Property APIs ──────────────────────────────────────────────────────────
export const propertiesApi = {
  list: (params?: Record<string, unknown>) => {
    if (USE_MOCK) {
      let items = [...(MOCK_PROPERTIES as any[])];
      if (params?.locality) items = items.filter(p => p.locality === params.locality);
      if (params?.bhk) items = items.filter(p => p.bhk === Number(params.bhk));
      if (params?.listing_type) items = items.filter(p => p.listing_type === params.listing_type);
      if (params?.min_price) items = items.filter(p => p.price >= Number(params.min_price));
      if (params?.max_price) items = items.filter(p => p.price <= Number(params.max_price));
      if (params?.furnishing) items = items.filter(p => p.furnishing === params.furnishing);
      if (params?.verified_only) items = items.filter(p => p.verified);
      const page = Number((params as any)?.page || 1);
      const size = Number((params as any)?.page_size || 12);
      const paged = items.slice((page - 1) * size, page * size);
      return mock({ items: paged, total: items.length, page, page_size: size });
    }
    return api.get('/properties/', { params });
  },

  get: (id: string) => {
    if (USE_MOCK) return mock(MOCK_PROPERTY_DETAIL(id));
    return api.get(`/properties/${id}`);
  },

  geojson: (city = 'Hyderabad') => {
    if (USE_MOCK) return mock(MOCK_GEOJSON);
    return api.get('/properties/map/geojson', { params: { city } });
  },

  nearby: (id: string, radius = 1000) => {
    if (USE_MOCK) {
      const prop = MOCK_PROPERTY_DETAIL(id);
      return mock(prop.nearby);
    }
    return api.get(`/properties/${id}/nearby`, { params: { radius_m: radius } });
  },

  priceHistory: (id: string) => {
    if (USE_MOCK) {
      const prop = MOCK_PROPERTY_DETAIL(id);
      return mock(prop.price_history);
    }
    return api.get(`/properties/${id}/price-history`);
  },

  create: (data: unknown) => {
    if (USE_MOCK) return mock({ success: true, property_id: 'mock-new-001' });
    return api.post('/properties/', data);
  },

  update: (id: string, data: unknown) => {
    if (USE_MOCK) return mock({ success: true, message: 'Property updated' });
    return api.put(`/properties/${id}`, data);
  },

  patch: (id: string, data: unknown) => {
    if (USE_MOCK) return mock({ success: true, message: 'Property patched' });
    return api.patch(`/properties/${id}`, data);
  },

  delete: (id: string) => {
    if (USE_MOCK) return mock({ success: true, message: 'Property removed' });
    return api.delete(`/properties/${id}`);
  },
};

// ── ML / Predict APIs ──────────────────────────────────────────────────────
export const predictApi = {
  landPrice: (data: unknown) => {
    if (USE_MOCK) return mock(MOCK_PRICE_PREDICTION(data as Parameters<typeof MOCK_PRICE_PREDICTION>[0]));
    return api.post('/predict/land-price', data);
  },

  appreciation: (data: unknown) => {
    if (USE_MOCK) return mock(MOCK_APPRECIATION(data as Parameters<typeof MOCK_APPRECIATION>[0]));
    return api.post('/predict/appreciation', data);
  },

  commercialScore: (data: unknown) => {
    if (USE_MOCK) return mock(MOCK_COMMERCIAL_SCORE(data as Parameters<typeof MOCK_COMMERCIAL_SCORE>[0]));
    return api.post('/predict/commercial-score', data);
  },

  anomaly: (data: unknown) => {
    if (USE_MOCK) return mock({ anomaly_score: 0.12, is_anomaly: false, reason: 'Price within normal market range' });
    return api.post('/predict/anomaly', data);
  },

  localityInsights: (locality: string) => {
    if (USE_MOCK) return mock({ locality, avg_price: 5200, trend: 'Upward', demand: 'High', investment_rating: 'A' });
    return api.get(`/predict/locality-insights/${locality}`);
  },
};

// ── Agent APIs ─────────────────────────────────────────────────────────────
export const agentApi = {
  chat: (data: unknown) => {
    if (USE_MOCK) {
      const { message, session_id } = data as { message: string; session_id?: string };
      return mock(MOCK_AGENT_CHAT(message, session_id));
    }
    return api.post('/agents/chat', data);
  },

  search: (q: string) => {
    if (USE_MOCK) {
      const items = (MOCK_PROPERTIES as any[]).filter(p =>
        String(p.title || '').toLowerCase().includes(q.toLowerCase()) ||
        String(p.locality || '').toLowerCase().includes(q.toLowerCase())
      );
      return mock({ results: items, total: items.length });
    }
    return api.post('/agents/search', { natural_language_query: q });
  },

  docQuery: (query: string, type?: string) => {
    if (USE_MOCK) return mock({ answer: `Mock answer for "${query}" (doc type: ${type || 'general'})`, confidence: 0.91 });
    return api.post('/agents/doc-query', { query, document_type: type });
  },

  voice: (text: string) => {
    if (USE_MOCK) {
      return Promise.reject({ response: { data: { detail: 'Voice is unavailable in mock mode' } } });
    }
    return api.post('/agents/voice', { text }, { responseType: 'blob' });
  },
};

// ── Analytics APIs ─────────────────────────────────────────────────────────
export const analyticsApi = {
  marketTrends: () => {
    if (USE_MOCK) return mock(MOCK_MARKET_TRENDS);
    return api.get('/analytics/market-trends');
  },

  heatmap: () => {
    if (USE_MOCK) return mock(MOCK_HEATMAP);
    return api.get('/analytics/heatmap');
  },

  topLocalities: (metric = 'score') => {
    if (USE_MOCK) return mock(MOCK_TOP_LOCALITIES);
    return api.get('/analytics/top-localities', { params: { metric } });
  },

  commercialZones: () => {
    if (USE_MOCK) return mock(MOCK_COMMERCIAL_ZONES);
    return api.get('/analytics/commercial-zones');
  },

  demandForecast: () => {
    if (USE_MOCK) return mock({
      labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      values: [450, 480, 520, 510, 590, 620, 680],
      growth: '+12.5%'
    });
    return api.get('/analytics/demand-forecast');
  },

  adminSellerOps: () => {
    if (USE_MOCK) {
      return mock({
        summary: {
          total_sellers: 12,
          total_listings: 1284,
          verified_listings: 1040,
          pending_listings: 14,
          total_leads: 320,
          open_leads: 188,
          sold_count: 76,
          sold_value: 684000000,
          conversion_rate: 0.238,
          avg_rating: 4.3,
          review_count: 142,
          flagged_items: 3,
        },
        sales_trend: [
          { month: '2025-12', sold_count: 7, sold_value: 62000000, new_listings: 32 },
          { month: '2026-01', sold_count: 9, sold_value: 82000000, new_listings: 41 },
          { month: '2026-02', sold_count: 11, sold_value: 101000000, new_listings: 45 },
          { month: '2026-03', sold_count: 13, sold_value: 117000000, new_listings: 48 },
          { month: '2026-04', sold_count: 16, sold_value: 145000000, new_listings: 52 },
          { month: '2026-05', sold_count: 20, sold_value: 177000000, new_listings: 55 },
        ],
        lead_pipeline: [
          { stage: 'NEW', count: 92 },
          { stage: 'CONTACTED', count: 54 },
          { stage: 'VISIT', count: 28 },
          { stage: 'NEGOTIATION', count: 14 },
          { stage: 'CLOSED', count: 76 },
        ],
        seller_performance: [
          { seller_id: 's1', seller_name: 'Priya Estates', email: 'seller1@example.com', listings: 42, verified_listings: 38, pending_listings: 4, leads: 91, sold_count: 18, sold_value: 164000000, conversion_rate: 0.198, avg_rating: 4.6, review_count: 35, flagged_reviews: 0 },
          { seller_id: 's2', seller_name: 'Hyderabad Homes', email: 'seller2@example.com', listings: 36, verified_listings: 34, pending_listings: 2, leads: 74, sold_count: 15, sold_value: 139000000, conversion_rate: 0.203, avg_rating: 4.2, review_count: 28, flagged_reviews: 1 },
        ],
        top_localities: [
          { locality: 'Kondapur', listings: 122, sold_count: 18, sold_value: 162000000, avg_price: 9000000 },
          { locality: 'Gachibowli', listings: 98, sold_count: 14, sold_value: 154000000, avg_price: 11000000 },
        ],
        review_insights: { avg_rating: 4.3, total_reviews: 142, flagged_reviews: 3, moderation_queue: [] },
        rule_based_projection: { method: 'Current conversion rate over open leads. No AI model used.', potential_sales_30d: 45, potential_value_30d: 405000000 },
      });
    }
    return api.get('/analytics/admin/seller-ops');
  },

  powerBIDataset: () => {
    if (USE_MOCK) {
      return mock({
        dataset_name: 'PROPIQ Admin Seller Operations',
        generated_at: new Date().toISOString(),
        demo_data: true,
        tables: {
          summary: [{
            total_sellers: 12,
            total_listings: 1284,
            sold_count: 76,
            sold_value: 684000000,
            conversion_rate: 0.238,
            avg_rating: 4.3,
            demo_data: true,
          }],
          seller_performance: [
            { seller_id: 's1', seller_name: 'Priya Estates', listings: 42, leads: 91, sold_count: 18, sold_value: 164000000, conversion_rate: 0.198, avg_rating: 4.6 },
            { seller_id: 's2', seller_name: 'Hyderabad Homes', listings: 36, leads: 74, sold_count: 15, sold_value: 139000000, conversion_rate: 0.203, avg_rating: 4.2 },
          ],
          sales_trend: [
            { month: '2026-01', sold_count: 9, sold_value: 82000000, new_listings: 41 },
            { month: '2026-02', sold_count: 11, sold_value: 101000000, new_listings: 45 },
            { month: '2026-03', sold_count: 13, sold_value: 117000000, new_listings: 48 },
          ],
          lead_pipeline: [
            { stage: 'NEW', count: 92 },
            { stage: 'CONTACTED', count: 54 },
            { stage: 'CLOSED', count: 76 },
          ],
          top_localities: [
            { locality: 'Kondapur', listings: 122, sold_count: 18, sold_value: 162000000 },
            { locality: 'Gachibowli', listings: 98, sold_count: 14, sold_value: 154000000 },
          ],
          review_moderation: [],
          projection: [{ method: 'Current conversion rate over open leads. No AI model used.', potential_sales_30d: 45, potential_value_30d: 405000000 }],
        },
        table_counts: {
          summary: 1,
          seller_performance: 2,
          sales_trend: 3,
          lead_pipeline: 3,
          top_localities: 2,
          review_moderation: 0,
          projection: 1,
        },
      });
    }
    return api.get('/analytics/admin/powerbi');
  }
};

// ── Deed APIs ──────────────────────────────────────────────────────────────
export const deedApi = {
  upload: (parcelId: string, declaredName: string, files: File[]) => {
    if (USE_MOCK) {
      return mock({
        success: true,
        parcel_id: parcelId,
        message: 'Documents uploaded successfully',
        upload_id: `upload_${Date.now()}`,
        files_count: files.length
      });
    }

    const formData = new FormData();
    formData.append('parcel_id', parcelId);
    formData.append('declared_name', declaredName);
    files.forEach((file) => {
      formData.append('files', file);
    });

    return api.post('/deeds/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  status: (parcelId: string) => {
    if (USE_MOCK) return mock(MOCK_DEED_STATUS(parcelId));
    return api.get(`/deeds/${parcelId}/status`);
  },

  verify: (parcelId: string) => {
    if (USE_MOCK) return mock({ success: true, parcel_id: parcelId, message: 'Verification initiated' });
    return api.post(`/deeds/${parcelId}/verify`);
  },

  timeline: (parcelId: string) => {
    if (USE_MOCK) { void parcelId; return mock(MOCK_DEED_TIMELINE()); }
    return api.get(`/deeds/${parcelId}/legal-timeline`);
  },

  stampDuty: (state: string, value: number) => {
    if (USE_MOCK) return mock(MOCK_STAMP_DUTY(state, value));
    return api.get('/deeds/stamp-duty', { params: { state, property_value: value } });
  },

  rera: (no: string) => {
    if (USE_MOCK) return mock(MOCK_RERA(no));
    return api.get(`/deeds/rera/${no}`);
  },

  adminSummary: () => {
    if (USE_MOCK) {
      return mock({
        total_properties: 1284,
        active_users: 856,
        pending_properties: 14,
        total_verifications: 3,
        pending_verifications: 2,
        matched_verifications: 2,
        legal_passed: 2,
      });
    }
    return api.get('/deeds/admin/summary');
  },

  adminVerifications: () => {
    if (USE_MOCK) {
      return mock({
        total: 1,
        items: [
          {
            verification_id: 'mock-ver-123',
            parcel_id: 'parcel-demo-001',
            submitted_by_name: 'Demo Buyer',
            stage: 'LEGAL_CHECK',
            declared_name: 'Priya Rao',
            extracted_name: 'PRIYA RAO',
            name_match_score: 0.98,
            legal_check_status: 'PASSED',
            legal_check_summary: 'Automated checklist complete. Sale deed, EC, stamp duty, and ID documents are ready for admin review.',
            documents: [{ filename: 'sale-deed.pdf', url: '#', content_type: 'application/pdf', size_bytes: 420000 }],
            updated_at: new Date().toISOString(),
          },
        ],
      });
    }
    return api.get('/deeds/admin/verifications');
  },

  updateVerification: (verificationId: string, data: unknown) => {
    if (USE_MOCK) return mock({ success: true, verification: data });
    return api.patch(`/deeds/admin/verifications/${verificationId}`, data);
  },

  documentBlob: (url: string) => {
    const endpoint = url.startsWith('/api/v1') ? url.replace('/api/v1', '') : url;
    return api.get(endpoint, { responseType: 'blob' });
  },
};

// ── Auth APIs ──────────────────────────────────────────────────────────────
type AuthPayload = {
  name?: string;
  email?: string;
  role?: string;
};

const mockAuthResponse = ({ name = 'Demo User', email = '', role = 'BUYER' }: AuthPayload) => {
  const normalizedRole = String(role || 'BUYER').toUpperCase();
  return {
    access_token: `mock-jwt-token-propiq-2024-${normalizedRole.toLowerCase()}`,
    refresh_token: `mock-refresh-token-propiq-2024-${normalizedRole.toLowerCase()}`,
    token_type: 'bearer',
    user_id: `mock-${normalizedRole.toLowerCase()}-user`,
    role: normalizedRole,
    name: name || 'Demo User',
    email,
  };
};

export const authApi = {
  login: (email: string, _password: string, role: string = 'BUYER') => {
    if (USE_MOCK) {
      return mock(mockAuthResponse({ name: 'Demo User', email, role }));
    }
    return api.post('/auth/login', new URLSearchParams({ username: email, password: _password, role }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  },

  register: (data: unknown) => {
    if (USE_MOCK) {
      const payload = data as AuthPayload;
      if (String(payload.role || 'BUYER').toUpperCase() === 'ADMIN') {
        return Promise.reject({ response: { data: { detail: 'Registration is available only for buyer and seller accounts' } } });
      }
      return mock(mockAuthResponse(payload));
    }
    return api.post('/auth/register', data);
  },
};

// ── Utility ────────────────────────────────────────────────────────────────
export const formatINR = (n: any) => {
  const num = Number(n);
  if (isNaN(num) || num === 0) return '₹ Price on Request';
  if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
  if (num >= 1e5) return `₹${(num / 1e5).toFixed(1)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
};

export const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
  'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80',
  'https://images.unsplash.com/photo-1600607687940-4e524cb35a3a?w=800&q=80',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&q=80',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80',
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
  'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=800&q=80',
];
