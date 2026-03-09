import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./TrainsPage.css";

const premiumCats = ["IC", "EIP", "EIC", "TLK", "EC", "EN"];
const regPrefixes = ["R", "S", "K", "A", "W", "KM", "SKM", "WKD", "AP", "Os", "OsP"];

export default function TrainsPage() {
    const navigate = useNavigate();
    const [trains, setTrains] = useState([]);
    const [expandedTrain, setExpandedTrain] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const [numSearch, setNumSearch] = useState("");
    const [nameSearch, setNameSearch] = useState("");
    const [startStation, setStartStation] = useState("");
    const [endStation, setEndStation] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    
    const [experimentalEnabled, setExperimentalEnabled] = useState(false);

   const [trackedTrainId, setTrackedTrainId] = useState(null);
   
    useEffect(() => {
        if (!experimentalEnabled && (categoryFilter === "REG" || categoryFilter === "BUS")) {
            setCategoryFilter("");
        }
    }, [experimentalEnabled, categoryFilter]);

    useEffect(() => {
        const hasActiveFilters = numSearch.length >= 2 || nameSearch.length >= 2 || 
                                 startStation.length >= 2 || endStation.length >= 2 || categoryFilter !== "";

        if (!hasActiveFilters) {
            setTrains([]);
            return;
        }

        const fetchTrains = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get("http://localhost:8080/api/trains/search", {
                    params: { 
                        number: numSearch, 
                        name: nameSearch, 
                        start: startStation, 
                        end: endStation, 
                        category: categoryFilter,
                        experimental: experimentalEnabled 
                    }
                });
                setTrains(res.data);
            } catch (err) {
                setError("Błąd połączenia z serwerem.");
            } finally {
                setLoading(false);
            }
        };
        const delay = setTimeout(fetchTrains, 400);
        return () => clearTimeout(delay);
    }, [numSearch, nameSearch, startStation, endStation, categoryFilter]);

    const displayedTrains = trains;

    const hasExperimentalInResults = displayedTrains.some(t => t.categorySymbol === "REG" || t.categorySymbol === "BUS");

    return (
        <div className="trains-container">
            <div className="trains-header">
                <h1 className="trains-title">Katalog Pociągów</h1>
                <p className="trains-subtitle">Wyszukaj po numerze, nazwie lub dowolnych stacjach na trasie</p>
                <div className="experimental-toggle-container">
                    <span className="experimental-label">EKSPERYMENTALNE: REGIO / BUS</span>
                    <label className="switch">
                        <input 
                            type="checkbox" 
                            checked={experimentalEnabled} 
                            onChange={(e) => setExperimentalEnabled(e.target.checked)} 
                        />
                        <span className="slider round"></span>
                    </label>
                </div>

                {experimentalEnabled && (
                    <div className="experimental-warning">
                        ⚠️ <strong>Tryb eksperymentalny aktywny:</strong> Dostęp do danych REGIO / BUS. Dane mogą być niekompletne lub w fazie testów.
                    </div>
                )}

                <div className="search-grid">
                    <div className="search-row">
                        <input 
                            placeholder="Numer (np. 7412)" 
                            value={numSearch} 
                            onChange={e => setNumSearch(e.target.value)} 
                        />
                        <input 
                            placeholder="Nazwa (np. WIATRAK)" 
                            value={nameSearch} 
                            onChange={e => setNameSearch(e.target.value)} 
                        />
                        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                            <option value="">Wszystkie Kategorie</option>
                            <option value="IC">IC</option>
                            <option value="EIC">EIC</option>
                            <option value="TLK">TLK</option>
                            <option value="EIP">Pendolino</option>
                            {experimentalEnabled && (
                                <>
                                    <option value="REG">Regionalne (REG)</option>
                                    <option value="BUS">ZKA (BUS)</option>
                                </>
                            )}
                        </select>
                    </div>
                    <div className="search-row">
                        <input 
                            placeholder="Stacja (przez / z)..." 
                            value={startStation} 
                            onChange={e => setStartStation(e.target.value)} 
                        />
                        <span className="separator">➔</span>
                        <input 
                            placeholder="Stacja (przez / do)..." 
                            value={endStation} 
                            onChange={e => setEndStation(e.target.value)} 
                        />
                    </div>
                </div>
            </div>

            <div className="trains-list">
                {loading && <div className="loader">Szukanie pociągów...</div>}
                {error && <div className="error-message">{error}</div>}
                
                {!loading && !error && displayedTrains.length > 0 && (
                    displayedTrains.map((t, idx) => (
                        <div key={idx} className={`train-card ${expandedTrain === t.trainOrderId ? 'active' : ''}`}>
                            <div className="train-card-header" onClick={() => setExpandedTrain(expandedTrain === t.trainOrderId ? null : t.trainOrderId)}>
                                <div className="train-id-section">
                                    <span className={`cat-badge ${
                                        regPrefixes.some(p => t.categorySymbol.startsWith(p)) ? 'cat-REG-badge' : `cat-${t.categorySymbol}-badge`
                                    }`}>
                                        {t.categorySymbol}
                                    </span>
                                    <span className="train-number">{t.number}</span>
                                    {t.name && <span className="train-name">"{t.name}"</span>}
                                </div>
                                <div className="train-relation-section">{t.relation}</div>
                                <button className="track-map-btn" onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/?trainId=${t.trainOrderId}`);
                                }}>
                                    📍 Pokaż trasę
                                </button>
                                <span className="arrow">{expandedTrain === t.trainOrderId ? '▲' : '▼'}</span>
                            </div>

                            {expandedTrain === t.trainOrderId && (
                                <div className="train-route-details">
                                    <h4>Pełna trasa przejazdu:</h4>
                                    <table className="route-table">
                                        <thead>
                                            <tr>
                                                <th>Stacja</th>
                                                <th>Przyjazd</th>
                                                <th>Odjazd</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {t.route && t.route.map((stop, sIdx) => {
                                                const now = new Date();
                                                const currentTime = now.getHours() * 60 + now.getMinutes();
                                                
                                                const getMinutes = (timeStr) => {
                                                    if (!timeStr || timeStr === "-") return null;
                                                    const [h, m] = timeStr.split(':').map(Number);
                                                    return h * 60 + m;
                                                };

                                                const stopDep = getMinutes(stop.dep);
                                                const stopArr = getMinutes(stop.arr);
                                                
                                                const isCurrentStation = stopArr && stopDep ? (currentTime >= stopArr && currentTime <= stopDep) : false;
                                                const isPast = stopDep ? currentTime > stopDep : false;
                                                
                                                const isSearchMatch = (startStation && stop.name.toLowerCase().includes(startStation.toLowerCase())) ||
                                                                      (endStation && stop.name.toLowerCase().includes(endStation.toLowerCase()));

                                                return (
                                                    <tr key={sIdx} className={`route-row 
                                                        ${isCurrentStation ? 'active' : ''} 
                                                        ${isPast ? 'passed' : ''} 
                                                        ${isSearchMatch ? 'search-highlight' : ''}`}>
                                                        <td className="stop-name">
                                                            {isPast && <span className="passed-check">✔️ </span>}
                                                            {isCurrentStation && <span className="live-dot">● </span>}
                                                            <span className={isCurrentStation ? "current-station-text" : ""}>
                                                                {stop.name}
                                                            </span>
                                                        </td>
                                                        <td className="stop-time">{stop.arr !== "-" ? stop.arr.substring(0,5) : "-"}</td>
                                                        <td className="stop-time">{stop.dep !== "-" ? stop.dep.substring(0,5) : "-"}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))
                )}

                {!loading && !error && displayedTrains.length === 0 && (
                    <div className="no-data">
                        {numSearch.length < 2 && nameSearch.length < 2 && startStation.length < 2 && endStation.length < 2 && categoryFilter === "" 
                            ? "Wpisz co najmniej 2 znaki w dowolne pole, aby szukać." 
                            : "Nie znaleziono pociągu spełniającego wszystkie kryteria."}
                    </div>
                )}
            </div>
        </div>
    );
}