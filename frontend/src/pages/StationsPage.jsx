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

  // Pobieranie listy stacji przy starcie
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
      const currentTime = now.getHours().toString().padStart(2, '0') + ":" + 
                          now.getMinutes().toString().padStart(2, '0');

      // Funkcja wyciągania godziny - teraz odporna na błędy formatowania
      const getT = (iso) => {
        if (!iso) return null;
        if (iso.includes("T")) return iso.split("T")[1].substring(0, 5);
        if (iso.length >= 5) return iso.substring(0, 5); 
        return null;
      };

      const finalData = rawTrains.map(train => {
        // Dopasowanie stacji z obsługą różnych typów danych (string/int)
        const sInfo = train.stations?.find(s => String(s.stationId) == String(stationId)) || {};
        
        const pArr = getT(sInfo.plannedArrival);
        const pDep = getT(sInfo.plannedDeparture);
        const aArr = getT(sInfo.actualArrival);
        const aDep = getT(sInfo.actualDeparture);

        // Obliczanie opóźnienia w minutach
        const calcDelay = (actual, planned) => {
          if (!actual || !planned || actual === planned) return 0;
          const [aH, aM] = actual.split(':').map(Number);
          const [pH, pM] = planned.split(':').map(Number);
          const diff = (aH * 60 + aM) - (pH * 60 + pM);
          return diff > 0 ? diff : 0;
        };

        const delay = Math.max(calcDelay(aArr, pArr), calcDelay(aDep, pDep));
        const dispTime = pDep || pArr || "??:??";

        return {
          id: train.trainOrderId || Math.random(),
          fullName: train.trainName ? `${train.trainCategoryFull} "${train.trainName}"` : `${train.trainCategoryFull} ${train.trainNumber}`,
          category: train.trainCategory,
          displayTime: dispTime,
          delay: delay,
          status: delay > 0 ? "OPÓŹNIONY" : "PLANOWY",
          platform: sInfo.platform || "-",
          isPast: dispTime !== "??:??" && dispTime < currentTime
        };
      })
      .filter(t => t.displayTime !== "??:??") // Ukrywamy pociągi bez poprawnej godziny
      .sort((a, b) => a.displayTime.localeCompare(b.displayTime));

      setTimetable(finalData);
    } catch (err) {
      console.error("Błąd pobierania danych:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStations = stations.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const nowTime = new Date().getHours().toString().padStart(2, '0') + ":" + 
                  new Date().getMinutes().toString().padStart(2, '0');

  const filteredByTime = showPast ? timetable : timetable.filter(t => t.displayTime >= nowTime);
  const visibleTrains = showAll ? filteredByTime : filteredByTime.slice(0, 10);

  return (
    <div className="stations-container">
      {/* Dynamiczny import czcionki odręcznej */}
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');`}
      </style>

      <div className="stations-header">
        <h1 style={{ fontFamily: "'Dancing Script', cursive", fontSize: '3.5rem' }}>
          RailScope
        </h1>
        <p style={{ marginTop: '-15px', marginBottom: '20px', color: '#ccc' }}>Tablice Stacyjne</p>
        
        <input
          className="station-search-input"
          placeholder="Szukaj stacji (np. Warszawa Centralna)..."
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
                  <>
                    <table className="timetable-table">
                      <thead>
                        <tr>
                          <th>Godzina</th>
                          <th>Pociąg i kategoria</th>
                          <th>Status</th>
                          <th>Peron</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleTrains.map((t, i) => (
                          <tr key={i} className={t.isPast ? 'row-past' : ''}>
                            <td className="time-cell">
                              <span className="main-time">{t.displayTime}</span>
                              {t.delay > 0 && <span className="delay-tag">+{t.delay} min</span>}
                            </td>
                            <td className="train-info-cell">
                              <span className={`train-name cat-${t.category}`}>
                                {t.fullName}
                              </span>
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

                    {filteredByTime.length > 10 && (
                      <button className="expand-list-btn" onClick={() => setShowAll(!showAll)}>
                        {showAll ? "▲ Zwiń" : `▼ Pokaż pozostałe (${filteredByTime.length - 10})`}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="no-data">Brak pociągów w najbliższym czasie.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}