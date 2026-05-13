import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./StationsPage.css";

const premiumCats = ["IC", "TLK", "EIP", "EIC", "EC", "EN", "NJ"];

const listVariants = {
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
  hidden: { opacity: 0 }
};

const itemVariants = {
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 15, stiffness: 100 } },
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

export default function StationsPage() {
  const [stations, setStations] = useState([]);
  const [search, setSearch] = useState("");
  const [sortAlphabetical, setSortAlphabetical] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(10);
  const [showPast, setShowPast] = useState(false);
  const [showRegio, setShowRegio] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:8080/api/stations")
      .then(res => setStations(res.data))
      .catch(err => console.error("Błąd ładowania stacji:", err));
  }, []);

  // FUNKCJE LOGICZNE (NIE DOTYKANE)
  const calcMin = (timeStr) => {
    if (!timeStr || timeStr === "??:??" || timeStr === "-") return null;
    const parts = timeStr.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  };

  const getStopMins = (stop, index, totalStops) => {
    if (!stop) return null;
    if (index === 0) return calcMin(stop.dep !== "-" ? stop.dep : stop.arr);
    if (index === totalStops - 1) return calcMin(stop.arr !== "-" ? stop.arr : stop.dep);
    const depMins = calcMin(stop.dep);
    return depMins !== null ? depMins : calcMin(stop.arr);
  };

  const isTrainInTransit = (route, delayMins = 0) => {
    if (!route || route.length < 2) return false;
    const now = new Date();
    let currentMins = now.getHours() * 60 + now.getMinutes();
    let startMins = getStopMins(route[0], 0, route.length);
    let endMins = getStopMins(route[route.length - 1], route.length - 1, route.length);
    if (startMins === null || endMins === null) return false;
    startMins += delayMins; endMins += delayMins;
    if (endMins < startMins) endMins += 24 * 60;
    return currentMins >= startMins && currentMins <= endMins;
  };

  const toggleStation = async (stationId) => {
    if (expandedId === stationId) { setExpandedId(null); return; }
    setExpandedId(stationId);
    setLoading(true); setTimetable([]); setVisibleLimit(10);
    try {
      const res = await axios.get(`http://localhost:8080/api/timetable/${stationId}`);
      const rawTrains = res.data || [];
      const now = new Date();
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
      const getT = (iso) => iso ? (iso.includes("T") ? iso.split("T")[1].substring(0, 5) : iso.substring(0, 5)) : null;

      const trainGroups = {};
      rawTrains.forEach(train => {
        const sInfo = train.stations?.find(s => String(s.stationId) === String(stationId)) || {};
        const groupKey = train.cleanNumber ? `${train.cleanNumber}_${train.trainCategory}` : train.trainOrderId; 
        if (!trainGroups[groupKey]) {
          trainGroups[groupKey] = {
            id: train.trainOrderId, number: train.displayNumber, category: train.trainCategory,
            trainName: train.trainName, relation: train.relation, 
            pArr: getT(sInfo.plannedArrival), pDep: getT(sInfo.plannedDeparture),
            actualArr: getT(sInfo.actualArrival), actualDep: getT(sInfo.actualDeparture),
            platform: train.route?.find(rs => String(rs.id) === String(stationId))?.platform || "-",
            route: train.route || []
          };
        }
      });

      const finalTimetable = Object.values(trainGroups).map(g => {
        const delayArr = g.actualArr && g.pArr ? Math.max(0, (calcMin(g.actualArr) || 0) - (calcMin(g.pArr) || 0)) : 0;
        const delayDep = g.actualDep && g.pDep ? Math.max(0, (calcMin(g.actualDep) || 0) - (calcMin(g.pDep) || 0)) : 0;
        const totalDelay = Math.max(delayArr, delayDep);
        const sortTime = g.pDep || g.pArr || "99:99";
        return { 
            ...g, 
            displayTime: (g.pArr && g.pDep && g.pArr !== g.pDep) ? `${g.pArr} ➔ ${g.pDep}` : (g.pDep || g.pArr || "??:??"), 
            sortTime, delay: totalDelay, 
            isPast: (calcMin(sortTime) || 0) + totalDelay < currentTotalMinutes - 2,
            status: totalDelay > 0 ? "OPÓŹNIONY" : "OK" 
        };
      }).sort((a, b) => a.sortTime.localeCompare(b.sortTime));

      setTimetable(finalTimetable);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // NAPRAWA FREEZE: Limitujemy tylko ILE widać na ekranie, logika szukania pozostaje ta sama
  const displayedStations = useMemo(() => {
    let filtered = stations.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    if (sortAlphabetical) filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered.slice(0, 40); // Tylko pierwsze 40 wyników renderuje DOM - to ratuje kartę!
  }, [stations, search, sortAlphabetical]);

  const filteredTimetable = timetable.filter(t => premiumCats.includes(t.category) || showRegio);
  const currentTrains = filteredTimetable.filter(t => !t.isPast);
  const displayPool = showPast ? [...filteredTimetable.filter(t => t.isPast), ...currentTrains] : currentTrains;
  const visibleTrains = displayPool.slice(0, visibleLimit);

  return (
    <div className="stations-container">
      <div className="stations-header">
        <h1 className="stations-title">Stacje</h1>
        <div className="search-controls">
          <input type="text" placeholder="Szukaj stacji..." className="station-search-input" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className={`sort-btn ${sortAlphabetical ? 'active' : ''}`} onClick={() => setSortAlphabetical(!sortAlphabetical)}>
            {sortAlphabetical ? "A-Z" : "Domyślne"}
          </button>
          <div className="experimental-zone">
            <label className="switch">
                <input type="checkbox" checked={showRegio} onChange={() => setShowRegio(!showRegio)} />
                <span className="slider round"></span>
            </label>
            <span>REGIO</span>
          </div>
        </div>
      </div>

      <motion.div className="stations-list-wrapper custom-scrollbar" variants={listVariants} initial="hidden" animate="visible">
        <AnimatePresence mode="popLayout">
            {displayedStations.map((s) => (
            <motion.div key={s.id} layout variants={itemVariants} className={`station-item ${expandedId === s.id ? 'active' : ''}`}>
                <div className="station-row" onClick={() => toggleStation(s.id)}>
                    <span className="station-name">{s.name}</span>
                    <div className="station-actions">
                        <button className="map-btn" onClick={(e) => { e.stopPropagation(); navigate(`/?station=${s.id}`); }}>📍 Mapa</button>
                        <span className="arrow">▼</span>
                    </div>
                </div>

                <AnimatePresence>
                {expandedId === s.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                    <div className="station-details">
                        <button className="control-btn" onClick={() => setShowPast(!showPast)}>{showPast ? "Ukryj odjechane" : "Pokaż historię"}</button>
                        {loading ? <div className="loader">Ładowanie...</div> : visibleTrains.length > 0 ? (
                        <>
                        <table className="timetable-table">
                            <thead><tr><th>Czas</th><th>Pociąg</th><th>Relacja</th><th>Status</th><th>Peron</th><th>Akcja</th></tr></thead>
                            <tbody>
                            {visibleTrains.map((t, idx) => (
                                <tr key={idx} className={t.isPast ? 'row-past' : ''}>
                                    <td>{t.displayTime} {t.delay > 0 && <span className="delay-tag">+{t.delay}</span>}</td>
                                    <td><span className={`cat-badge cat-${t.category}-badge`}>{t.category}</span> {t.number}</td>
                                    <td>{t.relation}</td>
                                    <td>{t.isPast ? 'ODJECHAŁ' : (t.delay > 0 ? `+${t.delay}` : 'OK')}</td>
                                    <td>{t.platform}</td>
                                    <td>
                                        {isTrainInTransit(t.route, t.delay) && (
                                            <button className="track-map-btn" onClick={() => navigate(`/?trainId=${t.id}&live=true`)}>📍 ŚLEDŹ</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {displayPool.length > visibleLimit && (
                            <button className="load-more-btn" onClick={() => setVisibleLimit(prev => prev + 10)}>
                                Załaduj więcej (+10)
                            </button>
                        )}
                        </>
                        ) : <p>Brak danych.</p>}
                    </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </motion.div>
            ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}