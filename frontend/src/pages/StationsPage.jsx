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
            name: `${train.trainCategory || ''} ${train.trainNumber || ''} ${train.trainName || ''}`.trim(),
            category: train.trainCategory || "REG",
            arrival: arr,
            departure: dep,
            delay: delay,
            status: train.trainStatus === "C" ? "Kursuje" : "Planowy",
            platform: sInfo.plannedSequenceNumber || "-"
          };
        } else {
          if (arr) acc[trainId].arrival = arr;
          if (dep) acc[trainId].departure = dep;
          if (delay > acc[trainId].delay) acc[trainId].delay = delay;
        }
        return acc;
      }, {});

      const finalData = Object.values(grouped)
        .map(t => ({
          ...t,
          displayTime: (t.arrival && t.departure && t.arrival !== t.departure) 
                       ? `${t.arrival} - ${t.departure}` 
                       : (t.arrival || t.departure || "??:??"),
          sortTime: t.departure || t.arrival || "00:00"
        }))
        .filter(t => t.sortTime >= currentTime)
        .sort((a, b) => a.sortTime.localeCompare(b.sortTime))
        .slice(0, 15);

      setTimetable(finalData);
    } catch (err) {
      console.error("Błąd pobierania danych:", err);
    } finally {
      setLoading(false);
    }
  };

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
                {loading ? (
                  <div className="loader-inline">Pobieranie danych...</div>
                ) : timetable.length > 0 ? (
                  <table className="timetable-table">
                    <thead>
                      <tr>
                        <th>Godzina</th>
                        <th>Pociąg</th>
                        <th>Status</th>
                        <th>Peron</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timetable.map((t, i) => (
                        <tr key={i}>
                          <td className="time-cell">
                            <span className="main-time">{t.displayTime}</span>
                            {t.delay > 0 && <span className="delay-tag">+{t.delay} min</span>}
                          </td>
                          <td className="train-info-cell">
                            <span className={`train-name cat-${t.category.replace(/\s/g, '')}`}>
                              {t.name || `Pociąg ${t.id}`}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${t.status}`}>{t.status}</span>
                          </td>
                          <td className="platform-num">{t.platform}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

// Kacper Zagłoba i Mateusz Kuśmierski 4P