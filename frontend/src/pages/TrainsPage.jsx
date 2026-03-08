import { useState, useEffect } from "react";
import axios from "axios";
import "./TrainsPage.css";

export default function TrainsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [trains, setTrains] = useState([]);
  const [expandedTrain, setExpandedTrain] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Nie szukaj, jeśli pola są puste (oszczędza to zasoby)
    if (search.trim().length < 2 && categoryFilter === "") {
        setTrains([]);
        return;
    }

    const fetchTrains = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get("http://localhost:8080/api/trains/search", {
                params: { q: search, category: categoryFilter }
            });
            setTrains(res.data);
        } catch (err) {
            console.error("Błąd wyszukiwania pociągów:", err);
            setError("Wystąpił problem z połączeniem z serwerem.");
        } finally {
            setLoading(false);
        }
    };

    // Opóźnienie wpisywania (debounce) - 300ms
    const delay = setTimeout(fetchTrains, 300);
    return () => clearTimeout(delay);
  }, [search, categoryFilter]);

  return (
    <div className="trains-container">
      <div className="trains-header">
        <h1 className="trains-title">Katalog Pociągów</h1>
        <p className="trains-subtitle">Wyszukaj po numerze, nazwie lub relacji</p>
        
        <div className="search-controls">
          <input
            className="train-search-input"
            placeholder="Np. 1806, RYBAK, Kraków..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select 
            className="category-select" 
            value={categoryFilter} 
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="">Wszystkie Kategorie</option>
            <option value="IC">IC / EIC - InterCity</option>
            <option value="TLK">TLK - Twoje Linie Kolejowe</option>
            <option value="EIP">EIP - Pendolino</option>
            <option value="REG">REG - Regionalne / Osobowe</option>
            <option value="BUS">BUS - Komunikacja Zastępcza</option>
          </select>
        </div>
      </div>

      <div className="trains-list">
        {loading && <div className="loader">Pobieranie danych...</div>}
        {error && <div className="error-message">{error}</div>}
        
        {!loading && !error && trains.length > 0 && (
            trains.map((t, idx) => (
                <div key={idx} className={`train-card ${expandedTrain === t.trainOrderId ? 'active' : ''}`}>
                    <div className="train-card-header" onClick={() => setExpandedTrain(expandedTrain === t.trainOrderId ? null : t.trainOrderId)}>
                        <div className="train-id-section">
                            <span className={`cat-badge cat-${t.categorySymbol}-badge`}>{t.categorySymbol}</span>
                            <span className="train-number">{t.number}</span>
                            {t.name && <span className="train-name">"{t.name}"</span>}
                        </div>
                        <div className="train-relation-section">{t.relation}</div>
                        <span className="arrow">{expandedTrain === t.trainOrderId ? '▲' : '▼'}</span>
                    </div>

                    {expandedTrain === t.trainOrderId && (
                        <div className="train-route-details">
                            <h4>Trasa pociągu:</h4>
                            <table className="route-table">
                                <thead>
                                    <tr>
                                        <th>Stacja</th>
                                        <th>Przyjazd</th>
                                        <th>Odjazd</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {t.route && t.route.map((stop, sIdx) => (
                                        <tr key={sIdx}>
                                            <td className="stop-name">{stop.name}</td>
                                            <td className="stop-time">{stop.arr !== "-" ? stop.arr.substring(0,5) : "-"}</td>
                                            <td className="stop-time">{stop.dep !== "-" ? stop.dep.substring(0,5) : "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ))
        )}

        {!loading && !error && trains.length === 0 && (
            <div className="no-data">
                {search.length < 2 && categoryFilter === "" 
                    ? "Zacznij pisać lub wybierz kategorię." 
                    : "Brak wyników dla tych kryteriów."}
            </div>
        )}
      </div>
    </div>
  );
}