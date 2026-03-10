import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./StationsPage.css";

const premiumCats = ["IC", "TLK", "EIP", "EIC", "EC", "EN", "NJ"];

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

  const [tick, setTick] = useState(0);

  const navigate = useNavigate();

  
  useEffect(() => {
    axios.get("http://localhost:8080/api/stations")
      .then(res => setStations(res.data))
      .catch(err => console.error("Błąd ładowania stacji:", err));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 10000); 
    return () => clearInterval(interval);
  }, []);

  const calcMin = (timeStr) => {
    if (!timeStr || timeStr === "??:??" || timeStr === "-") return null;
    const parts = timeStr.split(':');
    if (parts.length < 2) return null;
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

    startMins += delayMins;
    endMins += delayMins;

    if (endMins < startMins) endMins += 24 * 60;
    
    if (currentMins < startMins && startMins > 18 * 60 && currentMins < 6 * 60) {
      currentMins += 24 * 60;
    }

    return currentMins >= startMins && currentMins <= endMins;
  };

  const toggleStation = async (stationId) => {
    if (expandedId === stationId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(stationId);
    setLoading(true);
    setTimetable([]);
    setVisibleLimit(10);
    setShowPast(false);

    try {
      const res = await axios.get(`http://localhost:8080/api/timetable/${stationId}`);
      const rawTrains = res.data || [];
      
      const now = new Date();
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

      const getT = (iso) => {
        if (!iso) return null;
        return iso.includes("T") ? iso.split("T")[1].substring(0, 5) : iso.substring(0, 5);
      };

      const trainGroups = {};

      rawTrains.forEach(train => {
        const sInfo = train.stations?.find(s => String(s.stationId) === String(stationId)) || {};
        const groupKey = train.cleanNumber ? `${train.cleanNumber}_${train.trainCategory}` : train.trainOrderId; 
        
        const pArr = getT(sInfo.plannedArrival);
        const pDep = getT(sInfo.plannedDeparture);

        const routeStation = train.route?.find(rs => String(rs.id) === String(stationId));
        const platformDisplay = routeStation?.platform || "-";

        if (!trainGroups[groupKey]) {
          trainGroups[groupKey] = {
            id: train.trainOrderId,
            number: train.displayNumber,
            category: train.trainCategory,
            trainName: train.trainName,
            relation: train.relation,
            pArr, pDep,
            actualArr: getT(sInfo.actualArrival),
            actualDep: getT(sInfo.actualDeparture),
            platform: platformDisplay,
            route: train.route || []
          };
        } else {
          const g = trainGroups[groupKey];
          if (!g.pArr) g.pArr = pArr;
          if (!g.pDep) g.pDep = pDep;
          if (!g.actualArr) g.actualArr = getT(sInfo.actualArrival);
          if (!g.actualDep) g.actualDep = getT(sInfo.actualDeparture);
          if (!g.trainName && train.trainName) g.trainName = train.trainName;
        }
      });

      const finalTimetable = Object.values(trainGroups).map(g => {
        const delayArr = g.actualArr && g.pArr ? Math.max(0, (calcMin(g.actualArr) || 0) - (calcMin(g.pArr) || 0)) : 0;
        const delayDep = g.actualDep && g.pDep ? Math.max(0, (calcMin(g.actualDep) || 0) - (calcMin(g.pDep) || 0)) : 0;
        const totalDelay = Math.max(delayArr, delayDep);

        let displayTime = (g.pArr && g.pDep && g.pArr !== g.pDep) 
          ? `${g.pArr} ➔ ${g.pDep}` 
          : (g.pDep || g.pArr || "??:??");

        const sortTime = g.pDep || g.pArr || "99:99";
        const departureTimeInMins = (calcMin(sortTime) || 0) + totalDelay;
        const isPast = departureTimeInMins < currentTotalMinutes - 2;

        return {
          ...g,
          displayTime,
          sortTime,
          delay: totalDelay,
          isPast,
          status: totalDelay > 0 ? "OPÓŹNIONY" : "OK"
        };
      }).sort((a, b) => a.sortTime.localeCompare(b.sortTime));

      setTimetable(finalTimetable);
    } catch (err) {
      console.error("Błąd pobierania danych:", err);
    } finally {
      setLoading(false);
    }
  };

  let processedStations = stations.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );
  if (sortAlphabetical) {
    processedStations = processedStations.sort((a, b) => a.name.localeCompare(b.name));
  }

  const filteredTimetable = timetable.filter(t => {
    const isPremium = premiumCats.includes(t.category);
    return isPremium || showRegio;
  });
  const currentTrains = filteredTimetable.filter(t => !t.isPast);
  const pastTrains = filteredTimetable.filter(t => t.isPast);
  const displayPool = showPast ? [...pastTrains, ...currentTrains] : currentTrains;
  const visibleTrains = displayPool.slice(0, visibleLimit);
  const hasMore = visibleLimit < displayPool.length;

  return (
    <div className="stations-container">
      <div className="stations-header">
        <div className="header-top-row">
          <div>
            <h1 className="stations-title">Stacje</h1>
            <p className="stations-subtitle">Wybierz stację, aby zobaczyć przyjazdy i odjazdy</p>
          </div>
          <div className="experimental-zone">
            <span className="exp-label">Eksperymentalne: REGIO</span>
            <label className="switch">
              <input type="checkbox" checked={showRegio} onChange={() => setShowRegio(!showRegio)} />
              <span className="slider round"></span>
            </label>
          </div>
        </div>

        {showRegio && (
          <div className="experimental-warning">
            ⚠️ <strong>Funkcja eksperymentalna:</strong> Baza danych przystanków lokalnych jest niepełna. 
            Niektóre relacje pociągów regionalnych mogą wyświetlać "???" zamiast stacji docelowej.
          </div>
        )}
        
        <div className="search-controls">
          <input 
            type="text" 
            placeholder="Szukaj stacji..." 
            className="station-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button 
            className={`sort-btn ${sortAlphabetical ? 'active' : ''}`}
            onClick={() => setSortAlphabetical(!sortAlphabetical)}
          >
            {sortAlphabetical ? "Sortowanie: A-Z" : "Sortowanie: Domyślne"}
          </button>
        </div>
      </div>

      <div className="stations-list-wrapper custom-scrollbar">
        {processedStations.map((s) => (
          <div key={s.id} className={`station-item ${expandedId === s.id ? 'active' : ''}`}>
            <div className="station-row" onClick={() => toggleStation(s.id)}>
              <span className="station-name">{s.name}</span>
              <div className="station-actions">
                <button className="map-btn" onClick={(e) => { e.stopPropagation(); navigate(`/?station=${s.id}`); }}>📍 Mapa</button>
                <span className="arrow">{expandedId === s.id ? '▲' : '▼'}</span>
              </div>
            </div>

            {expandedId === s.id && (
              <div className="station-details">
                <div className="details-controls">
                   <button className="control-btn" onClick={() => { setShowPast(!showPast); setVisibleLimit(10); }}>
                      {showPast ? "Ukryj odjechane" : "Pokaż historię z całego dnia"}
                   </button>
                </div>

                {loading ? <div className="loader">Ładowanie danych...</div> : visibleTrains.length > 0 ? (
                  <table className="timetable-table">
                    <thead>
                      <tr>
                        <th>Czas</th>
                        <th>Pociąg</th>
                        <th>Relacja</th>
                        <th>Status</th>
                        <th>Peron</th>
                        <th>Śledź</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleTrains.map((t, idx) => {
                        const inTransit = isTrainInTransit(t.route, t.delay);

                        return (
                          <tr key={`${t.id}-${idx}`} className={t.isPast ? 'row-past' : ''}>
                            {/* 1. CZAS */}
                            <td className="time-cell">
                              <span className="main-time">{t.displayTime}</span>
                              {t.delay > 0 && <span className="delay-tag">+{t.delay} min</span>}
                            </td>

                            {/* 2. POCIĄG */}
                            <td>
                              <span className={`cat-badge cat-${t.category}-badge`}>{t.category}</span>
                              {t.trainName && <strong> "{t.trainName}"</strong>} <small>{t.number}</small>
                            </td>

                            {/* 3. RELACJA (To tutaj backend podstawi dane z regiostationsCache.json) */}
                            <td className="relation-cell">{t.relation}</td>

                            {/* 4. STATUS */}
                            <td>
                              <span className={`status-badge ${t.isPast ? 'PAST' : t.status}`}>
                                {t.isPast ? 'ODJECHAŁ' : (t.delay > 0 ? `+${t.delay} MIN` : 'OK')}
                              </span>
                            </td>

                            {/* 5. PERON */}
                            <td className="platform-cell">{t.platform}</td>

                            {/* 6. ŚLEDZENIE (Naprawiona logika i ikonki) */}
                            <td className="track-cell">
                              {premiumCats.includes(t.category) ? (
                                inTransit ? (
                                  <button 
                                    className="map-btn" 
                                    style={{ margin: 0, padding: '4px 8px' }} 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      navigate(`/?trainId=${t.id}`); 
                                    }}
                                    title="Przejdź do mapy i śledź na żywo"
                                  >
                                    📍
                                  </button>
                                ) : (
                                  <div 
                                    className="blocked-track-icon" 
                                    title="Nie można śledzić pociągu, który nie jest w trasie"
                                    style={{ opacity: 0.5, cursor: "not-allowed", textAlign: "center" }}
                                  >
                                    🚫
                                  </div>
                                )
                              ) : (
                                <div 
                                  className="regio-track-icon" 
                                  title="Nie śledzimy pociągów regionalnych"
                                  style={{ cursor: "help", textAlign: "center", fontSize: "1.2rem" }}
                                >
                                  ⚠️
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : <p className="no-data">Brak pociągów.</p>}
                
                {hasMore && !loading && (
                  <button className="expand-list-btn" onClick={() => setVisibleLimit(p => p + 10)}>Pokaż więcej ▼</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}