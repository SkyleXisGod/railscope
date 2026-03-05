import { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion"; 
import Layout from "./components/Layout";
import MapView from "./components/MapView";
import StationsPage from "./pages/StationsPage";
import PageWrapper from "./components/PageWrapper"; 

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
        <>
          <button onClick={() => go("/")}>Mapa</button>
          <button>Pociągi</button>
          <button onClick={() => go("/stacje")}>Stacje</button>
          <button>Gierki</button>
          <button>FAQ</button>
        </>
      }
    >
      {/* mode="wait" zapewnia, że stara strona zniknie przed pojawieniem się nowej */}
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
            path="/stacje" 
            element={
              <PageWrapper>
                <StationsPage />
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