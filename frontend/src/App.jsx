import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './context/AuthContext'; 
import { AnimatePresence } from "framer-motion";
import { translations } from "./pages/constants/translations";
import Layout from "./components/Layout";
import MapView from "./components/MapView";
import StationsPage from "./pages/StationsPage";
import PageWrapper from "./components/PageWrapper";
import TrainsPage from "./pages/TrainsPage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";
import GlobalLoader from "./components/GlobalLoader";
import ProfilePage from "./pages/ProfilePage";
import PaymentPage from "./pages/PaymentPage";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null; 
  return user ? children : <Navigate to="/auth" />;
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const { user } = useAuth();
  const lang = user?.settings?.language || 'PL';
  const t = translations[lang]?.app || translations.PL.app;
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsGlobalLoading(true);
    const timer = setTimeout(() => setIsGlobalLoading(false), 900);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const go = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <>
      <GlobalLoader isVisible={isGlobalLoading} />
      
      {/* Jeśli jesteśmy na stronie logowania, nie pokazujemy Layoutu (Topbar/Sidebar) */}
      {location.pathname === "/auth" ? (
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      ) : (
        <Layout
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebar={
            <div className="sidebar-menu">
              <button className="sidebar-nav-item" onClick={() => go("/")}>📍 {t.map}</button>
              <button className="sidebar-nav-item" onClick={() => go("/pociagi")}>🚆 {t.trains}</button>
              <button className="sidebar-nav-item" onClick={() => go("/stacje")}>🚉 {t.stations}</button>
              <button className="sidebar-nav-item" onClick={() => go("/statystyki")}>📊 {t.stats}</button>
              <button className="sidebar-nav-item" onClick={() => go("/ustawienia")}>⚙️ {t.settings}</button>
              <button className="sidebar-nav-item" onClick={() => go("/profil")}>👤 {t.profile}</button>
            </div>
          }
        >
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PrivateRoute><PageWrapper><MapView sidebarOpen={sidebarOpen} /></PageWrapper></PrivateRoute>} />
              <Route path="/pociagi" element={<PrivateRoute><PageWrapper><TrainsPage /></PageWrapper></PrivateRoute>} />
              <Route path="/stacje" element={<PrivateRoute><PageWrapper><StationsPage /></PageWrapper></PrivateRoute>} />
              <Route path="/statystyki" element={<PrivateRoute><PageWrapper><StatsPage /></PageWrapper></PrivateRoute>} />
              <Route path="/ustawienia" element={<PrivateRoute><PageWrapper><SettingsPage /></PageWrapper></PrivateRoute>} />
              <Route path="/profil" element={<PrivateRoute><PageWrapper><ProfilePage /></PageWrapper></PrivateRoute>} />
              <Route path="/pay" element={<PrivateRoute><PageWrapper><PaymentPage /></PageWrapper></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/auth" />} />
            </Routes>
          </AnimatePresence>
        </Layout>
      )}
    </>
  );
}

export default function App() {
  return (
      <AuthProvider>
        <AppContent />
      </AuthProvider>
  );
}