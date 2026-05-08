import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Map, BarChart2, FileText, LogOut, LogIn, Cpu, LayoutDashboard, Shield, Plus } from 'lucide-react';
import { useAuthStore } from '../../store/useStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const role = user?.role?.toLowerCase();
  const canList = role === 'seller' || role === 'admin';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: '1.6rem' }}>🏠</div>
          <span className="logo-text">
            PROP<span className="logo-ai">IQ</span>&nbsp;
            <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontWeight: 400 }}>AI</span>
          </span>
        </div>

        {/* Nav Links */}
        <div className="navbar-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Home size={15} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Home
          </NavLink>
          <NavLink to="/properties" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Properties
          </NavLink>
          <NavLink to="/properties/map" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Map size={15} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Map
          </NavLink>
          {canList && (
            <NavLink to="/list-property" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Plus size={15} style={{ marginRight: 4, verticalAlign: 'middle' }} /> List Property
            </NavLink>
          )}
          {/* Show Seller Dashboard link for users with role 'seller' */}
          {role === 'seller' && (
            <NavLink to="/seller" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={15} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Seller
            </NavLink>
          )}
          {/* Show Admin Dashboard link for users with role 'admin' */}
          {role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Shield size={15} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Admin
            </NavLink>
          )}
          <NavLink to="/predict/commercial" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Cpu size={15} style={{ marginRight: 4, verticalAlign: 'middle' }} /> AI Predict
          </NavLink>
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          {user ? (
            <>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                Hi, {user.name.split(' ')[0]}
            </span>
            <button className="btn btn-secondary btn-sm" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                onClick={() => { logout(); navigate('/login'); }}>
                <LogOut size={14} /> Logout
            </button>
            </>
          ) : (
            <NavLink to="/login" className="btn btn-gold btn-sm">
              <LogIn size={14} /> Sign In
            </NavLink>
          )}
          {canList && (
            <NavLink to="/list-property" className="btn btn-primary btn-sm"
              style={{ background: '#2E86C1' }}>
              + List Property
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
