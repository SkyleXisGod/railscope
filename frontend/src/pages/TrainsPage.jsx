import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./TrainsPage.css";

const premiumCats = ["IC", "EIP", "EIC", "TLK", "EC", "EN", "NJ"];
const regPrefixes = ["R", "RP", "RG", "RE", "AP", "Os", "OsP", "S", "K", "W", "KM", "WKD", "SKM", "A", "Z", "AZ", "KW", "KD", "Ł", "KA"];

// --- ZMODYFIKOWANE WARIANTY ANIMACJI ---
const listVariants = {
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
  hidden: { opacity: 0 }
};

const itemVariants = {
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 15, stiffness: 100 } },
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2, ease: "easeOut" } } // <-- Magia usuwania PUF
};

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

    const getMinutes = (timeStr) => {
        if (!timeStr || timeStr === "-") return null;
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
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
            setLoading(true); setError(null);
            try {
                const res = await axios.get("http://localhost:8080/api/trains/search", {
                    params: { number: numSearch, name: nameSearch, start: startStation, end: endStation, category: categoryFilter, experimental: experimentalEnabled }
                });
                setTrains(res.data);
            } catch (err) {
                setError("Błąd połączenia z serwerem.");
            } finally { setLoading(false); }
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
                        <input type="checkbox" checked={experimentalEnabled} onChange={(e) => setExperimentalEnabled(e.target.checked)} />
                        <span className="slider round"></span>
                    </label>
                </div>

                <AnimatePresence>
                    {experimentalEnabled && (
                        <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="experimental-warning">
                            ⚠️ <strong>Tryb eksperymentalny aktywny:</strong> Dostęp do danych REGIO / BUS. Dane mogą być niekompletne.
                        </motion.div>
                    )}
                </AnimatePresence>

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
                            {experimentalEnabled && <option value="REG">Regionalne (REG)</option>}
                        </select>
                    </div>
                    <div className="search-row">
                        <input placeholder="Stacja (przez / z)..." value={startStation} onChange={e => setStartStation(e.target.value)} />
                        <span className="separator">➔</span>
                        <input placeholder="Stacja (przez / do)..." value={endStation} onChange={e => setEndStation(e.target.value)} />
                    </div>
                </div>
            </div>

            <motion.div className="trains-list custom-scrollbar" variants={listVariants} initial="hidden" animate="visible">
                {loading && <div className="loader">Szukanie pociągów...</div>}
                {error && <div className="error-message">{error}</div>}
                
                {/* --- TUTAJ MAGIA ANIMATE PRESENCE --- */}
                <AnimatePresence mode="popLayout">
                    {!loading && !error && trains.map((t, idx) => {
                        const hasRoute = t.route && t.route.length > 0;
                        const isPremium = premiumCats.includes(t.categorySymbol);
                        // WAŻNE: Klucz MUSI być unikalny i stabilny, żeby AnimatePresence wiedziało co usunąć!
                        const uniqueKey = t.trainOrderId || `${t.number}-${idx}`;

                        return (
                            <motion.div 
                                key={uniqueKey} 
                                layout // Pomaga w płynnym przesuwaniu pozostałych pociągów
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className={`train-card ${expandedTrain === t.trainOrderId ? 'active' : ''}`}
                            >
                                <div className="train-card-header" onClick={() => hasRoute && setExpandedTrain(expandedTrain === t.trainOrderId ? null : t.trainOrderId)}>
                                    <div className="train-id-section">
                                        <span className={`cat-badge ${isPremium ? `cat-${t.categorySymbol}-badge` : regPrefixes.some(p => t.categorySymbol.startsWith(p)) ? 'cat-REG-badge' : 'cat-OTHER-badge'}`}>
                                            {t.categorySymbol}
                                        </span>
                                        <span className="train-number">{t.number}</span>
                                        {t.name && <span className="train-name">"{t.name}"</span>}
                                    </div>
                                    <div className="train-relation-section">{t.relation}</div>
                                    
                                    <div className="route-action-container">
                                        <button className="track-map-btn" onClick={(e) => { e.stopPropagation(); navigate(`/?trainId=${t.trainOrderId}`); }}>
                                            <span className="btn-content">📍 POKAŻ TRASĘ</span>
                                        </button>
                                    </div>
                                    {hasRoute && <span className="arrow" style={{transform: expandedTrain === t.trainOrderId ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s'}}>▼</span>}
                                </div>

                                <AnimatePresence>
                                    {expandedTrain === t.trainOrderId && hasRoute && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
                                            style={{ overflow: "hidden" }}
                                        >
                                            <div className="train-route-details">
                                                <h4>Pełna trasa przejazdu:</h4>
                                                <table className="route-table">
                                                    <thead><tr><th>Stacja</th><th>Przyjazd</th><th>Odjazd</th></tr></thead>
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
                                                        const isCurrentStation = stopArr !== null && stopDep !== null ? (currentTime >= stopArr && currentTime <= stopDep) : false;
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
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                
                {!loading && !error && trains.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="no-data">
                        {numSearch.length < 2 && nameSearch.length < 2 && startStation.length < 2 && endStation.length < 2 && categoryFilter === "" 
                            ? "Wpisz co najmniej 2 znaki w dowolne pole, aby szukać." 
                            : "Nie znaleziono pociągu."}
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}