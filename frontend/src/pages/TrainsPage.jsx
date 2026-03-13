import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./TrainsPage.css";

const premiumCats = ["IC", "EIP", "EIC", "TLK", "EC", "EN", "NJ"];
const regPrefixes = ["R", "RP", "RG", "RE", "AP", "Os", "OsP", "S", "K", "W", "KM", "WKD", "SKM", "A", "Z", "AZ", "KW", "KD", "Ł", "KA"];

export default function TrainsPage() {
    const navigate = useNavigate();
    const [trains, setTrains] = useState([]);
    const [expandedTrain, setExpandedTrain] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [unlockingId, setUnlockingId] = useState(null);
    const [isArmedId, setIsArmedId] = useState(null);
    const [hoverTimeout, setHoverTimeout] = useState(null);
    
    const [numSearch, setNumSearch] = useState("");
    const [nameSearch, setNameSearch] = useState("");
    const [startStation, setStartStation] = useState("");
    const [endStation, setEndStation] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [experimentalEnabled, setExperimentalEnabled] = useState(false);

    const getMinutes = (timeStr) => {
        if (!timeStr || timeStr === "-") return null;
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };

    const handleMouseEnter = (train) => {
        if (premiumCats.includes(train.categorySymbol)) return;
        setUnlockingId(train.trainOrderId);
        const timer = setTimeout(() => {
            setIsArmedId(train.trainOrderId);
            setUnlockingId(null);
        }, 3000);
        setHoverTimeout(timer);
    };

    const handleMouseLeave = () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        setUnlockingId(null);
        setIsArmedId(null);
    };

    const handleRouteClick = (e, train) => {
        e.stopPropagation();
        if (premiumCats.includes(train.categorySymbol) || isArmedId === train.trainOrderId) {
            navigate(`/?trainId=${train.trainOrderId}`);
        }
    };

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
    }, [numSearch, nameSearch, startStation, endStation, categoryFilter, experimentalEnabled]);

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
                        ⚠️ <strong>Tryb eksperymentalny aktywny:</strong> Dostęp do danych REGIO / BUS. Dane mogą być niekompletne.
                    </div>
                )}

                <div className="search-grid">
                    <div className="search-row">
                        <input placeholder="Numer (np. 7412)" value={numSearch} onChange={e => setNumSearch(e.target.value)} />
                        <input placeholder="Nazwa (np. WIATRAK)" value={nameSearch} onChange={e => setNameSearch(e.target.value)} />
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
                        <input placeholder="Stacja (przez / z)..." value={startStation} onChange={e => setStartStation(e.target.value)} />
                        <span className="separator">➔</span>
                        <input placeholder="Stacja (przez / do)..." value={endStation} onChange={e => setEndStation(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="trains-list">
                {loading && <div className="loader">Szukanie pociągów...</div>}
                {error && <div className="error-message">{error}</div>}
                
                {!loading && !error && trains.map((t, idx) => {
                    const hasRoute = t.route && t.route.length > 0;
                    const isPremium = premiumCats.includes(t.categorySymbol);

                    return (
                        <div key={idx} className={`train-card ${expandedTrain === t.trainOrderId ? 'active' : ''}`}>
                            <div className="train-card-header" onClick={() => hasRoute && setExpandedTrain(expandedTrain === t.trainOrderId ? null : t.trainOrderId)}>
                                <div className="train-id-section">
                                    <span className={`cat-badge ${
                                        isPremium ? `cat-${t.categorySymbol}-badge` : 
                                        regPrefixes.some(p => t.categorySymbol.startsWith(p)) ? 'cat-REG-badge' : 'cat-OTHER-badge'
                                    }`}>
                                        {t.categorySymbol}
                                    </span>
                                    <span className="train-number">{t.number}</span>
                                    {t.name && <span className="train-name">"{t.name}"</span>}
                                </div>
                                <div className="train-relation-section">{t.relation}</div>
                                
                                <div className="route-action-container">
                                    <button 
                                        className={`track-map-btn ${!isPremium ? 'warning-btn' : ''} ${unlockingId === t.trainOrderId ? 'unlocking' : ''} ${isArmedId === t.trainOrderId ? 'armed' : ''}`}
                                        onMouseEnter={() => handleMouseEnter(t)}
                                        onMouseLeave={handleMouseLeave}
                                        onClick={(e) => handleRouteClick(e, t)}
                                    >
                                        <span className="btn-content">
                                            {isArmedId === t.trainOrderId ? "🔓 Kliknij, aby wejść" : (
                                                <>
                                                    {!isPremium && <span className="lock-icon">🔒</span>}
                                                    📍 Pokaż trasę
                                                </>
                                            )}
                                        </span>
                                        {unlockingId === t.trainOrderId && <div className="progress-bar-fill"></div>}
                                    </button>
                                </div>
                                {hasRoute && <span className="arrow">{expandedTrain === t.trainOrderId ? '▲' : '▼'}</span>}
                            </div>

                            {expandedTrain === t.trainOrderId && hasRoute && (
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
                                        {t.route.map((stop, sIdx) => {
                                            const now = new Date();
                                            const currentTime = now.getHours() * 60 + now.getMinutes();
                                            let stopArr = getMinutes(stop.arr);
                                            let stopDep = getMinutes(stop.dep);
                                            if (sIdx !== 0 && sIdx !== t.route.length - 1) {
                                                if (stopArr === null) stopArr = stopDep;
                                                if (stopDep === null) stopDep = stopArr;
                                            }
                                            const timeToCompareForPast = (sIdx === t.route.length - 1) ? stopArr : stopDep;
                                            const isCurrentStation = stopArr !== null && stopDep !== null 
                                                ? (currentTime >= stopArr && currentTime <= stopDep) : false;
                                            const isPast = timeToCompareForPast !== null ? currentTime > timeToCompareForPast : false;
                                            const isSearchMatch = (startStation && stop.name.toLowerCase().includes(startStation.toLowerCase())) ||
                                                                (endStation && stop.name.toLowerCase().includes(endStation.toLowerCase()));

                                            return (
                                                <tr key={sIdx} className={`route-row ${isCurrentStation ? 'active' : ''} ${isPast ? 'passed' : ''} ${isSearchMatch ? 'search-highlight' : ''}`}>
                                                    <td className="stop-name">
                                                        {isPast && <span className="passed-check">✔️ </span>}
                                                        {isCurrentStation && <span className="live-dot">● </span>}
                                                        <span className={isCurrentStation ? "current-station-text" : ""}>{stop.name}</span>
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
                    );
                })}
                
                {!loading && !error && trains.length === 0 && (
                    <div className="no-data">
                        {numSearch.length < 2 && nameSearch.length < 2 && startStation.length < 2 && endStation.length < 2 && categoryFilter === "" 
                            ? "Wpisz co najmniej 2 znaki w dowolne pole, aby szukać." 
                            : "Nie znaleziono pociągu."}
                    </div>
                )}
            </div>
        </div>
    );
}