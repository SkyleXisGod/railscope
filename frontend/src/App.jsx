import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './context/AuthContext'; // Pamiętaj o stworzeniu tego pliku!
import { AnimatePresence } from "framer-motion";
import Layout from "./components/Layout";
import MapView from "./components/MapView";
import StationsPage from "./pages/StationsPage";
import PageWrapper from "./components/PageWrapper";
import TrainsPage from "./pages/TrainsPage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";
import GlobalLoader from "./components/GlobalLoader";

// Komponent chroniący dostęp - jeśli nie ma usera, wyrzuca do /auth
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null; 
  return user ? children : <Navigate to="/auth" />;
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const { user } = useAuth();
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
              <button className="sidebar-nav-item" onClick={() => go("/")}>📍 Mapa</button>
              <button className="sidebar-nav-item" onClick={() => go("/pociagi")}>🚆 Pociągi</button>
              <button className="sidebar-nav-item" onClick={() => go("/stacje")}>🚉 Stacje</button>
              <button className="sidebar-nav-item" onClick={() => go("/statystyki")}>📊 Statystyki</button>
            </div>
          }
        >
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PrivateRoute><PageWrapper><MapView sidebarOpen={sidebarOpen} /></PageWrapper></PrivateRoute>} />
              <Route path="/pociagi" element={<PrivateRoute><PageWrapper><TrainsPage /></PageWrapper></PrivateRoute>} />
              <Route path="/stacje" element={<PrivateRoute><PageWrapper><StationsPage /></PageWrapper></PrivateRoute>} />
              <Route path="/statystyki" element={<PrivateRoute><PageWrapper><StatsPage /></PageWrapper></PrivateRoute>} />
              <Route path="/settings" element={<PrivateRoute><PageWrapper><SettingsPage /></PageWrapper></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><PageWrapper><div className="coming-soon">Profil Użytkownika - Wkrótce</div></PageWrapper></PrivateRoute>} />
              
              {/* Przekieruj nieznane ścieżki na stronę główną */}
              <Route path="*" element={<Navigate to="/" />} />
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