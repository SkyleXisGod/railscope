import { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion"; 
import Layout from "./components/Layout";
import MapView from "./components/MapView";
import StationsPage from "./pages/StationsPage";
import PageWrapper from "./components/PageWrapper"; 
import TrainsPage from "./pages/TrainsPage";
import StatsPage from "./pages/StatsPage";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const go = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
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
          <Route 
            path="/" 
            element={
              <PageWrapper>
                <MapView sidebarOpen={sidebarOpen} />
              </PageWrapper>
            } 
          />
          
          <Route 
            path="/pociagi" 
            element={
              <PageWrapper>
                <TrainsPage />
              </PageWrapper>
            } 
          />

          <Route 
            path="/stacje" 
            element={
              <PageWrapper>
                <StationsPage />
              </PageWrapper>
            } 
          />

          <Route 
            path="/statystyki" 
            element={
              <PageWrapper>
                <StatsPage />
              </PageWrapper>
            } 
          />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}

export default App;

// Kacper Zagłoba i Mateusz Kuśmierski 4P