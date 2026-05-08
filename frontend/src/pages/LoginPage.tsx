import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../utils/api';
import { useAuthStore } from '../store/useStore';
import { LogIn, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'BUYER' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const roleOptions = mode === 'login'
    ? [
        { value: 'BUYER', label: 'Buyer' },
        { value: 'SELLER', label: 'Seller' },
        { value: 'ADMIN', label: 'Admin' },
      ]
    : [
        { value: 'BUYER', label: 'Buyer' },
        { value: 'SELLER', label: 'Seller' },
      ];

  const switchMode = (nextMode: 'login'|'register') => {
    setError('');
    setMode(nextMode);
    setForm((f) => nextMode === 'register' && f.role === 'ADMIN' ? { ...f, role: 'BUYER' } : f);
  };

  const submit = async () => {
    setLoading(true); setError('');
    try {
      let data;
      if (mode === 'login') {
        const res = await authApi.login(form.email, form.password, form.role);
        data = res.data;
      } else {
        const res = await authApi.register({ ...form, role: form.role === 'ADMIN' ? 'BUYER' : form.role });
        data = res.data;
      }
      setAuth(data.access_token, { user_id: data.user_id, name: data.name, role: data.role });
      
      const role = data.role?.toLowerCase();
      if (role === 'admin') navigate('/admin');
      else if (role === 'seller') navigate('/seller');
      else navigate('/');
    } catch (e: unknown) {
      setError((e as {response?:{data?:{detail?:string}}})?.response?.data?.detail || 'Authentication failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
      <div className="card animate-scaleIn" style={{ width: 420, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🏠</div>
          <h2 style={{ marginBottom: 4 }}>PROPIQ AI</h2>
          <p style={{ fontSize: '0.9rem' }}>{mode === 'login' ? 'Sign in to your account' : 'Create a new account'}</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button className={`btn btn-sm ${mode==='login'?'btn-primary':'btn-secondary'}`} style={{ flex: 1 }} onClick={() => switchMode('login')}>
            <LogIn size={14} /> Sign In
          </button>
          <button className={`btn btn-sm ${mode==='register'?'btn-primary':'btn-secondary'}`} style={{ flex: 1 }} onClick={() => switchMode('register')}>
            <UserPlus size={14} /> Register
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'register' && (
            <input id="auth-name" className="input" placeholder="Full Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          )}
          <input id="auth-email" className="input" type="email" placeholder="Email Address" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <input id="auth-password" className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          <select id="auth-role" className="input select" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', background: '#FDEDEC', padding: '10px 14px', borderRadius: 8 }}>⚠️ {error}</div>}
          <button id="auth-submit" className="btn btn-primary btn-lg" onClick={submit} disabled={loading} style={{ marginTop: 8 }}>
            {loading ? '⏳ Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </div>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.8rem', color: 'var(--gray)' }}>
          For demo login, use test@propiq.ai / test123 and choose a role
        </div>
      </div>
    </div>
  );
}
