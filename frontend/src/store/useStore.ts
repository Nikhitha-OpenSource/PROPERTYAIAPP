import { create } from 'zustand';

interface Property {
  property_id: string;
  title: string;
  price: number;
  price_per_sqft: number;
  locality: string;
  bhk: number;
  area_sqft: number;
  listing_type: string;
  furnishing: string;
  verified: boolean;
  latitude?: number;
  longitude?: number;
  image_urls?: string[];
  amenities?: string[];
  [key: string]: unknown;
}

interface Filters {
  locality?: string;
  bhk?: number;
  min_price?: number;
  max_price?: number;
  listing_type?: string;
  verified_only?: boolean;
}

interface PropertyStore {
  properties: Property[];
  total: number;
  loading: boolean;
  filters: Filters;
  page: number;
  compareList: Property[];
  setProperties: (props: Property[], total: number) => void;
  setLoading: (v: boolean) => void;
  setFilters: (f: Partial<Filters>) => void;
  setPage: (p: number) => void;
  addToCompare: (p: Property) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
}

export const usePropertyStore = create<PropertyStore>((set, get) => ({
  properties: [],
  total: 0,
  loading: false,
  filters: {},
  page: 1,
  compareList: [],

  setProperties: (props, total) => set({ properties: props, total }),
  setLoading:    (v) => set({ loading: v }),
  setFilters:    (f) => set({ filters: { ...get().filters, ...f }, page: 1 }),
  setPage:       (p) => set({ page: p }),

  addToCompare: (p) => {
    const list = get().compareList;
    const pId = p.property_id || (p as any)._id || (p as any).id;
    if (list.length < 3 && !list.find((x) => (x.property_id || (x as any)._id || (x as any).id) === pId)) {
      set({ compareList: [...list, p] });
    }
  },
  removeFromCompare: (id) => set({ compareList: get().compareList.filter((x) => (x.property_id || (x as any)._id || (x as any).id) !== id) }),
  clearCompare: () => set({ compareList: [] }),
}));

interface AuthStore {
  token: string | null;
  user: { user_id: string; name: string; role: string } | null;
  setAuth: (token: string, user: AuthStore['user']) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: localStorage.getItem('token'),
  user: (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  })(),
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));
