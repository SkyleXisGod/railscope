import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./StationsPage.css";

export default function StationsPage() {
  const [stations, setStations] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [showAll, setShowAll] = useState(false);
  const [showPast, setShowPast] = useState(false);

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
    setShowAll(false);

    try {
      const res = await axios.get(`http://localhost:8080/api/timetable/${stationId}`);
      const rawTrains = res.data || [];
      
      const now = new Date();
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

      const getT = (iso) => {
        if (!iso) return null;
        if (iso.includes("T")) return iso.split("T")[1].substring(0, 5);
        if (iso.length >= 5) return iso.substring(0, 5); 
        return null;
      };

      // ... (importy bez zmian)

      // Wewnątrz funkcji toggleStation, zamień pętlę rawTrains.forEach:

      const trainGroups = {};

      rawTrains.forEach(train => {
        const sInfo = train.stations?.find(s => String(s.stationId) === String(stationId)) || {};
        const groupKey = train.trainOrderId; 
        
        const pArr = getT(sInfo.plannedArrival);
        const pDep = getT(sInfo.plannedDeparture);

        if (!trainGroups[groupKey]) {
          trainGroups[groupKey] = {
            id: train.trainOrderId,
            number: train.trainNumber,
            category: train.trainCategory,
            categoryFull: train.trainCategoryFull || "REG",
            trainName: train.trainName,
            relation: train.relation,
            pArr, 
            pDep,
            actualArr: getT(sInfo.actualArrival),
            actualDep: getT(sInfo.actualDeparture),
            platform: sInfo.platform || "-",
          };
        } else {
          const g = trainGroups[groupKey];
          if (!g.pArr) g.pArr = pArr;
          if (!g.pDep) g.pDep = pDep;
          if (g.number !== train.trainNumber && !g.number.includes('/')) {
            g.number = `${g.number}/${train.trainNumber}`;
          }
        }
      });

      const finalTimetable = Object.values(trainGroups).map(g => {
        const calcMin = (timeStr) => {
          if (!timeStr) return 0;
          const [h, m] = timeStr.split(':').map(Number);
          return h * 60 + m;
        };

        const delayArr = g.actualArr && g.pArr ? Math.max(0, calcMin(g.actualArr) - calcMin(g.pArr)) : 0;
        const delayDep = g.actualDep && g.pDep ? Math.max(0, calcMin(g.actualDep) - calcMin(g.pDep)) : 0;
        const totalDelay = Math.max(delayArr, delayDep);

        let displayTime = "";
        if (g.pArr && g.pDep && g.pArr !== g.pDep) {
          displayTime = `${g.pArr} ➔ ${g.pDep}`;
        } else {
          displayTime = g.pDep || g.pArr || "??:??";
        }

        const sortTime = g.pArr || g.pDep || "99:99";
        const isPast = calcMin(g.pDep || g.pArr) < currentTotalMinutes - 2;

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

  const filteredStations = stations.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredByTime = showPast ? timetable : timetable.filter(t => !t.isPast);
  const visibleTrains = showAll ? filteredByTime : filteredByTime.slice(0, 10);

  return (
    <div className="stations-container">
      <div className="stations-header">
        <h1 style={{ fontFamily: "'Dancing Script', cursive", fontSize: '3.5rem' }}>RailScope</h1>
        <p style={{ marginTop: '-15px', marginBottom: '20px', color: '#ccc' }}>Tablice Stacyjne</p>
        <input
          className="station-search-input"
          placeholder="Szukaj stacji..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="stations-list-wrapper">
        {filteredStations.map((s) => (
          <div key={s.id} className={`station-item ${expandedId === s.id ? 'active' : ''}`}>
            <div className="station-row" onClick={() => toggleStation(s.id)}>
              <div className="station-info">
                <span className="station-name">{s.name}</span>
              </div>
              <div className="station-actions">
                <button className="map-btn" onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/?station=${s.id}`);
                }}>📍 Mapa</button>
                <span className="arrow">{expandedId === s.id ? '▲' : '▼'}</span>
              </div>
            </div>

            {expandedId === s.id && (
              <div className="station-details">
                <div className="station-controls">
                   <button 
                    className={`control-btn ${showPast ? 'active' : ''}`}
                    onClick={() => setShowPast(!showPast)}
                   >
                     {showPast ? "Ukryj historię" : "Pokaż historię"}
                   </button>
                </div>

                {loading ? (
                  <div className="loader-inline">Trwa łączenie danych rozkładowych...</div>
                ) : visibleTrains.length > 0 ? (
                  <table className="timetable-table">
                    <thead>
                      <tr>
                        <th>Przyjazd-Odjazd</th>
                        <th>Pociąg</th>
                        <th>Relacja</th>
                        <th>Status</th>
                        <th>Peron</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleTrains.map((t, i) => (
                        <tr key={i} className={t.isPast ? 'row-past' : ''}>
                          <td className="time-cell">
                            <div className="time-wrapper">
                              <span className="main-time">{t.displayTime}</span>
                              <span className="delay-container">
                                {t.delay > 0 ? (
                                  <span className="delay-tag">+{t.delay} min</span>
                                ) : (
                                  <span className="delay-placeholder"></span> 
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="train-info-cell">
                            <span className={`train-name cat-${t.category}`}>
                                <span className="cat-badge">{t.category}</span>
                                {t.trainName && <strong className="name-highlight"> "{t.trainName}"</strong>}
                                <small className="num-muted"> {t.number}</small>
                            </span>
                          </td>
                          <td className="relation-cell" style={{fontSize: '0.85rem', color: '#ccc'}}>
                            {t.relation}
                          </td>
                          <td>
                            <span className={`status-badge ${t.isPast ? 'PAST' : t.status}`}>
                              {t.isPast ? 'ODJECHAŁ' : (t.delay > 0 ? `+${t.delay} MIN` : 'OK')}
                            </span>
                          </td>
                          <td className="platform-num">{t.platform}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="no-data">Brak pociągów.</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}