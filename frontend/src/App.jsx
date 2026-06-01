import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './context/AuthContext'; 
import { motion, AnimatePresence } from "framer-motion"; // Dodano 'motion'
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
import GamesPage from "./pages/GamesPage";
import AdminPage from "./pages/AdminPage";

// --- KOMPONENT NAKŁADKI BANA (LIVE ODLICZANIE) ---
function BanOverlay({ bannedUntil, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(new Date(bannedUntil) - new Date());

  useEffect(() => {
    // Aktualizujemy licznik co sekundę
    const interval = setInterval(() => {
      const diff = new Date(bannedUntil) - new Date();
      if (diff <= 0) {
        clearInterval(interval);
        onExpire(); // Odpalamy funkcję, która ściąga bana live!
      } else {
        setTimeLeft(diff);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [bannedUntil, onExpire]);

  // Sprawdzamy czy do końca bana zostało mniej niż 24 godziny
  const isLessThan24h = timeLeft > 0 && timeLeft < 24 * 60 * 60 * 1000;
  
  // Formatowanie czasu (HH:MM:SS)
  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
  const minutes = Math.floor((timeLeft / 1000 / 60) % 60).toString().padStart(2, '0');
  const seconds = Math.floor((timeLeft / 1000) % 60).toString().padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      transition={{ duration: 1.5, ease: "easeInOut" }} // Długie, kinowe zniknięcie
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', 
        background: 'rgba(10, 10, 15, 0.85)', 
        color: '#ff4d4d', zIndex: 99999, 
        textAlign: 'center', padding: '20px', fontFamily: 'system-ui, sans-serif'
      }}
    >
      <motion.h1 
        animate={{ scale: [1, 1.02, 1] }} // Pulsujący napis
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        style={{ fontSize: '3rem', margin: '0 0 10px 0', textShadow: '0 0 20px rgba(255, 77, 77, 0.5)' }}
      >
        🚫 KONTO ZABLOKOWANE
      </motion.h1>
      
      <p style={{ fontSize: '1.2rem', color: '#ccc', margin: '0 0 15px 0' }}>
        Twój dostęp do systemu RailScope został zawieszony.
      </p>

      {/* Renderowanie warunkowe: Licznik vs Data */}
      {isLessThan24h ? (
        <div style={{
          marginTop: '20px', background: 'rgba(255,77,77,0.05)', padding: '20px 40px', 
          borderRadius: '16px', border: '1px solid rgba(255,77,77,0.2)',
          boxShadow: '0 0 30px rgba(255, 77, 77, 0.1) inset'
        }}>
          <p style={{ margin: '0 0 10px 0', color: '#ff6b6b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Blokada wygasa za:
          </p>
          <div style={{ 
            fontFamily: "'JetBrains Mono', monospace", fontSize: '3.5rem', 
            fontWeight: 'bold', color: '#fff', textShadow: '0 0 15px rgba(255, 77, 77, 0.8)' 
          }}>
            {hours}:{minutes}:{seconds}
          </div>
        </div>
      ) : (
        <p style={{ fontSize: '1rem', color: '#888', background: 'rgba(255,77,77,0.1)', padding: '10px 20px', borderRadius: '8px' }}>
          Blokada wygasa: <strong style={{ color: '#fff' }}>{new Date(bannedUntil).toLocaleString()}</strong>
        </p>
      )}
      
      <button 
        onClick={() => {
          localStorage.removeItem('token'); 
          localStorage.removeItem('railscope_user');
          window.location.href = '/auth';
        }}
        style={{
          marginTop: '30px', padding: '12px 24px', background: 'transparent',
          border: '1px solid #ff4d4d', color: '#ff4d4d', borderRadius: '8px',
          cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => { e.target.style.background = '#ff4d4d'; e.target.style.color = '#fff'; }}
        onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#ff4d4d'; }}
      >
        Wyloguj się
      </button>
    </motion.div>
  );
}
// ----------------------------------------------


function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null; 
  return user ? children : <Navigate to="/auth" />;
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  
  const { user } = useAuth();
  // Trzymamy stan bana lokalnie, żeby móc go dynamicznie zmienić (odbanować na żywo)
  const [isLiveBanned, setIsLiveBanned] = useState(false);

  const lang = user?.settings?.language || 'PL';
  const t = translations[lang]?.app || translations.PL.app;
  const navigate = useNavigate();
  const location = useLocation();

  // Sprawdzenie stanu bana przy załadowaniu komponentu / zmianie użytkownika
  useEffect(() => {
    if (user?.bannedUntil && new Date(user.bannedUntil) > new Date()) {
      setIsLiveBanned(true);
    } else {
      setIsLiveBanned(false);
    }
  }, [user]);

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
      
      {/* Owijamy nakładkę w AnimatePresence - dzięki temu, gdy 'isLiveBanned' zmieni
        się na false (bo czas minął), komponent BanOverlay nie zniknie nagle,
        tylko pięknie się rozmyje dzięki propowi 'exit' z framer-motion.
      */}
      <AnimatePresence>
        {isLiveBanned && (
          <BanOverlay 
            bannedUntil={user.bannedUntil} 
            onExpire={() => setIsLiveBanned(false)} 
          />
        )}
      </AnimatePresence>

      {/* --- GŁÓWNA STRUKTURA APLIKACJI --- */}
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
              <button className="sidebar-nav-item" onClick={() => go("/games")}>🎮 {t.games_title}</button>
              <button className="sidebar-nav-item" onClick={() => go("/statystyki")}>📊 {t.stats}</button>
              <button className="sidebar-nav-item" onClick={() => go("/ustawienia")}>⚙️ {t.settings}</button>
              <button className="sidebar-nav-item" onClick={() => go("/profil")}>👤 {t.profile}</button>
              {['ADMIN', 'ZARZADCA'].includes(user?.role) && (
                <button className="sidebar-nav-item" onClick={() => go("/admin")}>🛠️ {t.admin_panel}</button>
              )}
            </div>
          }
        >
          {/* Dynamiczna blokada kliknięć - uwalnia stronę, gdy licznik zjedzie do zera */}
          <div style={{ pointerEvents: isLiveBanned ? 'none' : 'auto', height: '100%' }}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PrivateRoute><PageWrapper><MapView sidebarOpen={sidebarOpen} /></PageWrapper></PrivateRoute>} />
                <Route path="/pociagi" element={<PrivateRoute><PageWrapper><TrainsPage /></PageWrapper></PrivateRoute>} />
                <Route path="/stacje" element={<PrivateRoute><PageWrapper><StationsPage /></PageWrapper></PrivateRoute>} />
                <Route path="/statystyki" element={<PrivateRoute><PageWrapper><StatsPage /></PageWrapper></PrivateRoute>} />
                <Route path="/ustawienia" element={<PrivateRoute><PageWrapper><SettingsPage /></PageWrapper></PrivateRoute>} />
                <Route path="/profil" element={<PrivateRoute><PageWrapper><ProfilePage /></PageWrapper></PrivateRoute>} />
                <Route path="/pay" element={<PrivateRoute><PageWrapper><PaymentPage /></PageWrapper></PrivateRoute>} />
                <Route path="/games" element={<PrivateRoute><PageWrapper><GamesPage /></PageWrapper></PrivateRoute>} />
                <Route path="/admin" element={<PrivateRoute><PageWrapper><AdminPage /></PageWrapper></PrivateRoute>} />
                <Route path="*" element={<Navigate to="/auth" />} />
              </Routes>
            </AnimatePresence>
          </div>
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