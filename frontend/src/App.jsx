import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './context/AuthContext'; 
import { MailboxProvider } from './context/MailboxContext';
import { motion, AnimatePresence } from "framer-motion";
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
import TicketsPage from "./pages/TicketsPage";
import LiveChatPage from "./pages/LiveChat";
import Mailbox from "./pages/Mailbox";

function AdminTodoPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem("railscope_admin_todos");
    return saved ? JSON.parse(saved) : [
      { id: 1, text: "Mailbox - skrzynka pocztowa użytkowników.", done: false },
      { id: 2, text: "Livechat - czat na żywo pomiędzy użytkownikami ( PREMIUM! )", done: false },
      { id: 3, text: "System ticketowy - zgłoszenia problemów i sugestii od użytkowników.", done: false },
      { id: 4, text: "System powiadomień - informowanie użytkowników o ważnych wydarzeniach i aktualizacjach.", done: false }
    ];
  });
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    localStorage.setItem("railscope_admin_todos", JSON.stringify(todos));
  }, [todos]);

  const addTodo = (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    setTodos([...todos, { id: Date.now(), text: newTodo.trim(), done: false }]);
    setNewTodo("");
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, fontFamily: 'system-ui, sans-serif' }}>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            style={{
              width: '320px', background: '#111116', border: '1px solid #ff0055',
              boxShadow: '0 0 20px rgba(255, 0, 85, 0.25)', borderRadius: '12px', padding: '16px',
              color: '#fff'
            }}
            >

            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #222', paddingBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', color: '#ff0055', fontSize: '0.9rem', letterSpacing: '1px' }}>🛠️ ZARZĄDCA TODO</span>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.1rem', marginLeft: 'auto' }}
              >
                ✕
              </button>
            </div>

            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '12px', paddingRight: '4px' }}>
              {todos.length === 0 ? (
                <p style={{ color: '#666', fontSize: '0.85rem', textAlign: 'center', margin: '15px 0' }}>Brak zadań. Czyste biurko!</p>
              ) : (
                todos.map(todo => (
                  <div key={todo.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', padding: '6px 0', gap: '8px' }}>
                    <input 
                      type="checkbox" 
                      checked={todo.done} 
                      onChange={() => toggleTodo(todo.id)}
                      style={{ accentColor: '#ff0055', cursor: 'pointer' }}
                    />
                    <span style={{ 
                      fontSize: '0.85rem', color: todo.done ? '#666' : '#ddd',
                      textDecoration: todo.done ? 'line-through' : 'none',
                      wordBreak: 'break-word', flex: 1
                    }}>
                      {todo.text}
                    </span>
                    <button 
                      onClick={() => deleteTodo(todo.id)}
                      style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.8rem', opacity: 0.6 }}
                      onMouseOver={(e) => e.target.style.opacity = 1}
                      onMouseOut={(e) => e.target.style.opacity = 0.6}
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={addTodo} style={{ display: 'flex', gap: '6px' }}>
              <input 
                type="text" 
                placeholder="Nowe zadanie..." 
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                style={{
                  flex: 1, background: '#1a1a24', border: '1px solid #333', borderRadius: '6px',
                  color: '#fff', padding: '6px 10px', fontSize: '0.85rem', outline: 'none'
                }}
              />
              <button 
                type="submit"
                style={{
                  background: '#ff0055', border: 'none', borderRadius: '6px', color: '#fff',
                  padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem'
                }}
              >
                +
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            style={{
              width: '48px', height: '48px', borderRadius: '50%', background: '#111116',
              border: '1px solid #ff0055', color: '#ff0055', fontSize: '1.3rem', cursor: 'pointer',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              boxShadow: '0 0 15px rgba(255, 0, 85, 0.4)'
            }}
          >
            📝
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function BanOverlay({ bannedUntil, onExpire }) {
  // ... (kod BanOverlay z poprzedniej odpowiedzi) ...
  const [timeLeft, setTimeLeft] = useState(new Date(bannedUntil) - new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(bannedUntil) - new Date();
      if (diff <= 0) { clearInterval(interval); onExpire(); } 
      else { setTimeLeft(diff); }
    }, 1000);
    return () => clearInterval(interval);
  }, [bannedUntil, onExpire]);
  const isLessThan24h = timeLeft > 0 && timeLeft < 24 * 60 * 60 * 1000;
  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
  const minutes = Math.floor((timeLeft / 1000 / 60) % 60).toString().padStart(2, '0');
  const seconds = Math.floor((timeLeft / 1000) % 60).toString().padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', 
        background: 'rgba(10, 10, 15, 0.85)', color: '#ff4d4d', zIndex: 99999, 
        textAlign: 'center', padding: '20px', fontFamily: 'system-ui, sans-serif'
      }}
    >
      <motion.h1 animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} style={{ fontSize: '3rem', margin: '0 0 10px 0', textShadow: '0 0 20px rgba(255, 77, 77, 0.5)' }}>🚫 KONTO ZABLOKOWANE</motion.h1>
      <p style={{ fontSize: '1.2rem', color: '#ccc', margin: '0 0 15px 0' }}>Twój dostęp do systemu RailScope został zawieszony.</p>
      {isLessThan24h ? (
        <div style={{ marginTop: '20px', background: 'rgba(255,77,77,0.05)', padding: '20px 40px', borderRadius: '16px', border: '1px solid rgba(255,77,77,0.2)', boxShadow: '0 0 30px rgba(255, 77, 77, 0.1) inset' }}>
          <p style={{ margin: '0 0 10px 0', color: '#ff6b6b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Blokada wygasa za:</p>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '3.5rem', fontWeight: 'bold', color: '#fff', textShadow: '0 0 15px rgba(255, 77, 77, 0.8)' }}>{hours}:{minutes}:{seconds}</div>
        </div>
      ) : (
        <p style={{ fontSize: '1rem', color: '#888', background: 'rgba(255,77,77,0.1)', padding: '10px 20px', borderRadius: '8px' }}>Blokada wygasa: <strong style={{ color: '#fff' }}>{new Date(bannedUntil).toLocaleString()}</strong></p>
      )}
      <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('railscope_user'); window.location.href = '/auth'; }} style={{ marginTop: '30px', padding: '12px 24px', background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s ease' }} onMouseOver={(e) => { e.target.style.background = '#ff4d4d'; e.target.style.color = '#fff'; }} onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#ff4d4d'; }}>Wyloguj się</button>
    </motion.div>
  );
}

function PrivateRoute({ children }) {
  const { user, loading, logout } = useAuth();
  
  if (loading) return null;

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children; 
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  
  const { user } = useAuth();
  const [isLiveBanned, setIsLiveBanned] = useState(false);

  const lang = user?.settings?.language || 'PL';
  const t = translations[lang]?.app || translations.PL.app;
  const navigate = useNavigate();
  const location = useLocation();

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

  // Sprawdzamy, czy zalogowany użytkownik to konkretnie Twoje konto admina/zarządcy
  const isTargetAdminAccount = user?.email === "1@1";

  return (
    <>
      <GlobalLoader isVisible={isGlobalLoading} />
      
      <AnimatePresence>
        {isLiveBanned && (
          <BanOverlay 
            bannedUntil={user.bannedUntil} 
            onExpire={() => setIsLiveBanned(false)} 
          />
        )}
      </AnimatePresence>

      {isTargetAdminAccount && location.pathname === "/" && !isLiveBanned && (
        <AdminTodoPopup />
      )}

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
              <button className="sidebar-nav-item" onClick={() => go("/livechat")}>💬 {t.livechat}</button>
              <button className="sidebar-nav-item" onClick={() => go("/statystyki")}>📊 {t.stats}</button>
              <button className="sidebar-nav-item" onClick={() => go("/ustawienia")}>⚙️ {t.settings}</button>
              <button className="sidebar-nav-item" onClick={() => go("/profil")}>👤 {t.profile}</button>
              {['ADMIN', 'ZARZADCA'].includes(user?.role) && (
                <button className="sidebar-nav-item" onClick={() => go("/admin")}>🛠️ {t.admin_panel}</button>
              )}
            </div>
          }
        >
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
                <Route path="/tickets" element={<PrivateRoute><PageWrapper><TicketsPage /></PageWrapper></PrivateRoute>} />
                <Route path="/livechat" element={<PrivateRoute><PageWrapper><LiveChatPage /></PageWrapper></PrivateRoute>} />
                <Route path="/poczta" element={<PrivateRoute><PageWrapper><Mailbox /></PageWrapper></PrivateRoute>} />
                <Route path="/auth" element={<Navigate to="/" />} />
                <Route path="*" element={user ? <Navigate to="/" /> : <Navigate to="/auth" />} />
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
        <MailboxProvider>
          <AppContent />
        </MailboxProvider>
      </AuthProvider>
  );
}