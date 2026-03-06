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
  
  // NOWE STANY DO OBSŁUGI WIDOKU
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
      setShowAll(false); // Reset przy zamknięciu
      setShowPast(false);
      return;
    }

    setExpandedId(stationId);
    setLoading(true);
    setTimetable([]);
    setShowAll(false);
    setShowPast(false);

    try {
      const res = await axios.get(`http://localhost:8080/api/timetable/${stationId}`);
      const rawTrains = res.data.trains || res.data || [];
      
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, '0') + ":" + 
                          now.getMinutes().toString().padStart(2, '0');

      const grouped = rawTrains.reduce((acc, train) => {
        const trainId = train.trainOrderId;
        const sInfo = train.stations?.find(s => String(s.stationId) === String(stationId)) || {};
        const getT = (iso) => iso ? iso.split("T")[1].substring(0, 5) : null;
        
        const arr = getT(sInfo.actualArrival);
        const dep = getT(sInfo.actualDeparture);
        const pArr = getT(sInfo.plannedArrival);
        const pDep = getT(sInfo.plannedDeparture);

        const calcDelay = (actual, planned) => {
          if (!actual || !planned || actual === planned) return 0;
          const [aH, aM] = actual.split(':').map(Number);
          const [pH, pM] = planned.split(':').map(Number);
          const diff = (aH * 60 + aM) - (pH * 60 + pM);
          return diff > 0 ? diff : 0;
        };

        const delay = Math.max(calcDelay(arr, pArr), calcDelay(dep, pDep));

        if (!acc[trainId]) {
          acc[trainId] = {
            id: trainId,
            name: train.trainName ? `${train.trainCategory || ''} ${train.trainNumber || ''} "${train.trainName}"` : `${train.trainCategory || ''} ${train.trainNumber || ''}`,
            category: train.trainCategory || "REG",
            arrival: arr || pArr,
            departure: dep || pDep,
            delay: delay,
            status: delay > 0 ? "OPÓŹNIONY" : "PLANOWY",
            platform: sInfo.platform || sInfo.plannedSequenceNumber || "-",
            isPast: (dep || arr || "00:00") < currentTime // Flaga czy pociąg odjechał
          };
        }
        return acc;
      }, {});

      const finalData = Object.values(grouped)
        .map(t => ({
          ...t,
          displayTime: t.departure || t.arrival || "??:??",
          sortTime: t.departure || t.arrival || "00:00"
        }))
        .sort((a, b) => a.sortTime.localeCompare(b.sortTime));

      setTimetable(finalData);
    } catch (err) {
      console.error("Błąd pobierania danych:", err);
    } finally {
      setLoading(false);
    }
  };

  // LOGIKA FILTROWANIA I WYŚWIETLANIA
  const now = new Date();
  const currentTime = now.getHours().toString().padStart(2, '0') + ":" + 
                      now.getMinutes().toString().padStart(2, '0');

  // 1. Najpierw filtrujemy czy pokazywać przeszłe
  const filteredByTime = showPast 
    ? timetable 
    : timetable.filter(t => t.sortTime >= currentTime);

  // 2. Potem ograniczamy ilość (10 zamiast 15 dla lepszej czytelności przycisku)
  const visibleTrains = showAll ? filteredByTime : filteredByTime.slice(0, 10);

  const filtered = stations.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="stations-container">
      <div className="stations-header">
        <h1>Lista Stacji</h1>
        <input
          className="station-search-input"
          placeholder="Szukaj stacji..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="stations-list-wrapper">
        {filtered.map((s) => (
          <div key={s.id} className={`station-item ${expandedId === s.id ? 'active' : ''}`}>
            <div className="station-row" onClick={() => toggleStation(s.id)}>
              <div className="station-info">
                <span className="station-name">{s.name}</span>
                <span className="station-coords">{s.lat}, {s.lon}</span>
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
                <div className="station-controls" style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                   <button 
                    className="control-btn"
                    onClick={() => setShowPast(!showPast)}
                    style={{ background: showPast ? '#00ffcc' : '#333', color: showPast ? '#000' : '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                   >
                     {showPast ? "Ukryj historię poprzednich" : "Pokaż historię poprzednich"}
                   </button>
                </div>

                {loading ? (
                  <div className="loader-inline">Pobieranie danych...</div>
                ) : visibleTrains.length > 0 ? (
                  <>
                    <table className="timetable-table">
                      <thead>
                        <tr>
                          <th>Godzina</th>
                          <th>Pociąg</th>
                          <th>Status</th>
                          <th>Numer postoju</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleTrains.map((t, i) => (
                          <tr key={i} style={{ opacity: t.isPast ? 0.6 : 1 }}>
                            <td className="time-cell">
                              <span className="main-time">{t.displayTime}</span>
                              {t.delay > 0 && <span className="delay-tag" style={{color: 'red', marginLeft: '5px'}}>+{t.delay} min</span>}
                            </td>
                            <td className="train-info-cell">
                              <span className={`train-name cat-${t.category.replace(/\s/g, '')}`}>
                                {t.name.trim() || `Pociąg ${t.id}`}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge ${t.isPast ? 'PAST' : t.status}`}>{t.isPast ? 'ODJECHAŁ' : t.status}</span>
                            </td>
                            <td className="platform-num">{t.platform}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {filteredByTime.length > 10 && (
                      <button 
                        className="expand-list-btn" 
                        onClick={() => setShowAll(!showAll)}
                        style={{ width: '100%', padding: '10px', marginTop: '10px', background: 'rgba(255,255,255,0.1)', color: '#00ffcc', border: '1px solid #00ffcc', cursor: 'pointer', borderRadius: '4px' }}
                      >
                        {showAll ? "▲ Zwiń listę" : `▼ Pokaż pozostałe (${filteredByTime.length - 10})`}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="no-data">Brak pociągów do wyświetlenia.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}