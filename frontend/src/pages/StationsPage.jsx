import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./StationsPage.css";

export default function StationsPage() {
  const [stations, setStations] = useState([]);
  const [search, setSearch] = useState("");
  const [sortAlphabetical, setSortAlphabetical] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(10);
  const [showPast, setShowPast] = useState(false);
  
  // FUNKCJA EKSPERYMENTALNA: REGIO
  const [showRegio, setShowRegio] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:8080/api/stations")
      .then(res => setStations(res.data))
      .catch(err => console.error("Błąd ładowania stacji:", err));
  }, []);

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
            platform: sInfo.platform || "-",
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
        const calcMin = (timeStr) => {
          if (!timeStr || timeStr === "??:??") return 0;
          const [h, m] = timeStr.split(':').map(Number);
          return h * 60 + m;
        };

        const delayArr = g.actualArr && g.pArr ? Math.max(0, calcMin(g.actualArr) - calcMin(g.pArr)) : 0;
        const delayDep = g.actualDep && g.pDep ? Math.max(0, calcMin(g.actualDep) - calcMin(g.pDep)) : 0;
        const totalDelay = Math.max(delayArr, delayDep);

        let displayTime = (g.pArr && g.pDep && g.pArr !== g.pDep) 
          ? `${g.pArr} ➔ ${g.pDep}` 
          : (g.pDep || g.pArr || "??:??");

        const sortTime = g.pDep || g.pArr || "99:99";
        const departureTimeInMins = calcMin(sortTime) + totalDelay;
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

  // Filtrowanie stacji
  let processedStations = stations.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );
  if (sortAlphabetical) {
    processedStations = processedStations.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Filtrowanie pociągów (IC vs REGIO)
  const filteredTimetable = timetable.filter(t => {
    if (!showRegio && t.category === "REG") return false;
    return true;
  });

  const currentTrains = filteredTimetable.filter(t => !t.isPast);
  const pastTrains = filteredTimetable.filter(t => t.isPast);
  const displayPool = showPast ? [...pastTrains, ...currentTrains] : currentTrains;
  const visibleTrains = displayPool.slice(0, visibleLimit);
  const hasMore = visibleLimit < displayPool.length;

  return (
    <div className="stations-container">
      <div className="stations-header">
        <h1 className="stations-title">RailScope</h1>
        
        <div className="header-top-row">
          <p className="stations-subtitle">Tablice Stacyjne (Live)</p>
          
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
            className="station-search-input"
            placeholder="Wyszukaj stację..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button 
            className={`sort-btn ${sortAlphabetical ? 'active' : ''}`}
            onClick={() => setSortAlphabetical(!sortAlphabetical)}
          >
            {sortAlphabetical ? "A-Z (Włączone)" : "Sortuj A-Z"}
          </button>
        </div>
      </div>

      <div className="stations-list-wrapper">
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
                  <>
                    <table className="timetable-table">
                      <thead>
                        <tr><th>Czas</th><th>Pociąg</th><th>Relacja</th><th>Status</th><th>Peron</th></tr>
                      </thead>
                      <tbody>
                        {visibleTrains.map((t, i) => (
                          <tr key={i} className={t.isPast ? 'row-past' : ''}>
                            <td className="time-cell">
                              <span className="main-time">{t.displayTime}</span>
                              {t.delay > 0 && <span className="delay-tag">+{t.delay} min</span>}
                            </td>
                            <td>
                               <span className={`cat-badge cat-${t.category}-badge`}>{t.category}</span>
                               {t.trainName && <strong> "{t.trainName}"</strong>} <small>{t.number}</small>
                            </td>
                            <td className="relation-cell">{t.relation}</td>
                            <td><span className={`status-badge ${t.isPast ? 'PAST' : t.status}`}>
                                {t.isPast ? 'ODJECHAŁ' : (t.delay > 0 ? `+${t.delay} MIN` : 'OK')}
                            </span></td>
                            <td>{t.platform}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {hasMore && <button className="expand-list-btn" onClick={() => setVisibleLimit(p => p + 10)}>Pokaż więcej ▼</button>}
                  </>
                ) : <p className="no-data">Brak pociągów spełniających kryteria.</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}