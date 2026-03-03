import { useState } from "react";
import Layout from "./components/Layout";
import MapView from "./components/MapView";

function App() {

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Layout
      sidebarOpen={sidebarOpen}
      onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      sidebar={
        <>
          <button>Mapa</button>
          <button>Pociągi</button>
          <button>Stacje</button>
        </>
      }
    >
      <MapView />
    </Layout>
  );
}

export default App;