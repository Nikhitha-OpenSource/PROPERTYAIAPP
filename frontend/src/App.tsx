import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/UI/Navbar';
import AgentChat from './components/Agent/AgentChat';
import LandingPage from './pages/LandingPage';
import PropertiesPage from './pages/PropertiesPage';
import MapPage from './pages/MapPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import PredictPage from './pages/PredictPage';
import DeedPage from './pages/DeedPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ComparePage from './pages/ComparePage';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import AddPropertyPage from './pages/AddPropertyPage';
import SellerPage from './pages/SellerPage';
import AdminPage from './pages/AdminPage';
import { useAuthStore } from './store/useStore';

function RequireRole({ roles, children }: { roles: string[]; children: JSX.Element }) {
  const { user } = useAuthStore();
  const role = user?.role?.toLowerCase();
  if (!role) return <Navigate to="/login" replace />;
  if (!roles.map(r => r.toLowerCase()).includes(role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"                   element={<LandingPage />} />
        <Route path="/properties"         element={<PropertiesPage />} />
        <Route path="/properties/map"     element={<MapPage />} />
        <Route path="/properties/:id"     element={<PropertyDetailPage />} />
        <Route path="/properties/:id/chat" element={<ChatPage />} />
        <Route path="/list-property"      element={
          <RequireRole roles={['seller', 'admin']}>
            <AddPropertyPage />
          </RequireRole>
        } />
        <Route path="/predict/commercial" element={<PredictPage />} />
        <Route path="/deeds"              element={<DeedPage />} />
        <Route path="/analytics"          element={<AnalyticsPage />} />
        <Route path="/compare"            element={<ComparePage />} />
        <Route path="/login"              element={<LoginPage />} />
        <Route path="/seller"             element={
          <RequireRole roles={['seller', 'admin']}>
            <SellerPage />
          </RequireRole>
        } />
        <Route path="/admin"              element={
          <RequireRole roles={['admin']}>
            <AdminPage />
          </RequireRole>
        } />
      </Routes>
      <AgentChat />
    </BrowserRouter>
  );
}
