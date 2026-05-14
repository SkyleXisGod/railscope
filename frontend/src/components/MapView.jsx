import React, { useEffect, useState, memo, useRef, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Pane, Polyline, Marker, useMapEvents, Tooltip } from "react-leaflet";
import { useSearchParams } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { translations } from "../pages/constants/translations";
import L from "leaflet";
import axios from "axios";
import "./MapPopup.css";
import "./MapCenterButton.css";

const POLAND_BOUNDS = L.latLngBounds([46.0, 10.0], [58.0, 28.0]);

const listVariants = {
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1, delayChildren: 0.3 } 
  },
  hidden: { opacity: 0 }
};

const itemVariants = {
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", damping: 12, stiffness: 100 } 
  },
  hidden: { opacity: 0, y: 20, scale: 0.95 }
};

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

const StationsLayer = memo(({ stations, currentZoom, stationId, trackedTrain, stationDepartures, onStationClick, loadingDepartures }) => {
  const { user } = useAuth();
  const lang = user?.settings?.language || 'PL';
  const t = translations[lang]?.stations || translations.PL.stations;

  useMapEvents({
    popupclose: (e) => {
      const params = new URLSearchParams(window.location.search);
      const currentIdInUrl = params.get("stationId");
      if (e.popup.options.className === "station-next-gen-popup" && currentIdInUrl) {
        onStationClick(currentIdInUrl);
      }
    }
  });

const getUpcomingDepartures = (payload) => {
  // Rozpakowanie danych (obsługa obiektu { departures: [] })
  const departures = Array.isArray(payload) ? payload : (payload?.departures || []);

  if (!departures.length) return [];

  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  // 1. Obliczamy różnicę czasu dla każdego pociągu
  const processed = departures.map(t => {
    const timeStr = (t.dep && t.dep !== "-") ? t.dep : t.arr;
    if (!timeStr || timeStr === "??:??") return { ...t, diff: 9999 };

    const [hours, mins] = timeStr.split(':').map(Number);
    let tMins = hours * 60 + mins;
    let diff = tMins - currentMins;
    
    // Obsługa zawijania doby
    if (diff < -720) diff += 1440; 
    
    return { ...t, diff };
  });

  // 2. Sortujemy: najpierw te, które odjadą (diff >= 0), potem te, co odjechały (diff < 0)
  // Ale ogólnie chcemy te, których diff jest najbliższy zeru.
  processed.sort((a, b) => {
    // Pociągi w przyszłości mają priorytet i są rosnąco (0, 10, 20min...)
    // Pociągi w przeszłości są na końcu
    if (a.diff >= 0 && b.diff < 0) return -1;
    if (a.diff < 0 && b.diff >= 0) return 1;
    return a.diff - b.diff;
  });

  // 3. Zwracamy 5 rekordów (najbliższych czasowo)
  return processed.slice(0, 5);
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
  
  return (
    <>
      {stations.map(s => {
        const isSelected = stationId && String(s.id) === String(stationId);
        const isOnTrackedRoute = trackedTrain?.route?.some(rs => String(rs.id) === String(s.id));
        
        if (s.isRegional && currentZoom < 10 && !isOnTrackedRoute && !isSelected) return null;

        return (
          <React.Fragment key={`station-${s.id}`}>
            <CircleMarker
              center={[parseFloat(s.lat), parseFloat(s.lon)]}
              radius={isSelected ? 6 : (s.isRegional ? 3 : 5)}
              eventHandlers={{ click: () => onStationClick(s.id) }}
              pathOptions={{
                color: "#222",
                fillColor: isSelected || isOnTrackedRoute ? "#ff2b2b" : (s.isRegional ? "#f1c40f" : "#00ffd5"),
                fillOpacity: 1,
                weight: 1.5,
              }}
            >
              {!s.isRegional && currentZoom >= 12 && !isSelected && (
                <Tooltip direction="top" offset={[0, -10]} opacity={0.8} permanent className="station-tooltip">
                  {s.name}
                </Tooltip>
              )}

              <Popup className="station-next-gen-popup" offset={[0, -5]}>
                <div className="popup-main-container station-variant">
                  <div className="popup-top-bar"></div>
                  <div className="popup-content-padding">
                    <div className="popup-station-header">
                      <span className="popup-station-icon">🏢</span>
                      <span className="popup-station-name">
                        <span className="marquee-wrap">
                          <span className="marquee-text">{s.name}</span>
                        </span>
                      </span>
                    </div>

                    {isSelected && (
                   <div className="popup-departures">
                      <div className="departures-title">{t.upcoming_departures}</div>
                      <div className="station-departures-list">
    {loadingDepartures ? (
      <div className="loader-container">
        <div className="loading-spinner"></div>
        <p>{t.loading}</p>
      </div>
    ) : stationDepartures.length > 0 ? (
      stationDepartures.map((dep, index) => (
        <div key={index} className="departure-item">
          <div className={`dep-cat cat-${dep.cat}`}>{dep.cat}</div>
          <div className="dep-main-info">
            <span className="dep-train-name">{dep.train}</span>
            <span className="dep-dest"><span className="marquee-wrap"><span className="marquee-text">{dep.dest}</span></span></span>
          </div>
          <div className="dep-time">{dep.dep}</div>
        </div>
      ))
    ) : (
      <p className="no-data">{t.no_results}</p>
    )}
  </div>
                    </div>
                    )}
                    <div className="popup-station-footer">
                      <span className="type-tag">{s.isRegional ? t.regio_station : t.long_distance_station}</span>
                      <span className="mini-coords">{parseFloat(s.lat).toFixed(4)}, {parseFloat(s.lon).toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
            
            {isSelected && (
              <CircleMarker
                center={[parseFloat(s.lat), parseFloat(s.lon)]}
                radius={14}
                pathOptions={{ color: '#00ffd5', weight: 2, fillOpacity: 0, dashArray: '4, 6' }}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
});

function MapController({ selectedStation, trainLocation, sidebarOpen, isTracking, setIsTracking, isLive, firstStation }) {
  const map = useMap();
  const lastTargetId = useRef(null);

  useMapEvents({
    dragstart: () => {
      if (isTracking) setIsTracking(false);
    }
  });

  useEffect(() => {
    map.setMinZoom(6);
    map.setMaxZoom(18);
    const timer = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(timer);
  }, [sidebarOpen, map]);

  useEffect(() => {
    const target = isLive ? trainLocation : (selectedStation || firstStation);
    
    if (target && target.lat && target.lon) {
      const targetEntityId = isLive ? 'active-train' : (selectedStation ? `station-${selectedStation.id}` : 'route-start');

      if (lastTargetId.current !== targetEntityId) {
        map.flyTo([target.lat, target.lon], 12, { animate: true, duration: 1.2 });
        lastTargetId.current = targetEntityId;
      }

      if (isLive && isTracking && trainLocation) {
        map.setView([trainLocation.lat, trainLocation.lon], 14, { animate: true, duration: 0.5 });
      }
    } else if (!target) {
      lastTargetId.current = null;
    }
  }, [selectedStation, trainLocation?.lat, trainLocation?.lon, isTracking, map, isLive, firstStation]);

  return null;
}

function ZoomListener({ setZoomLevel }) {
  useMapEvents({ zoomend: (e) => setZoomLevel(e.target.getZoom()) });
  return null;
}

export default function MapView({ sidebarOpen }) {
  const { user } = useAuth();
  const lang = user?.settings?.language || 'PL';
  const t = translations[lang].stations;
  const [searchParams, setSearchParams] = useSearchParams();
  const stationId = searchParams.get("stationId");
  const trainId = searchParams.get("trainId");
  const isLive = searchParams.get("live") === "true";
  const [loadingDepartures, setLoadingDepartures] = useState(false);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [stationDepartures, setStationDepartures] = useState([]);
  const [trackedTrain, setTrackedTrain] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [currentZoom, setCurrentZoom] = useState(6);
  const [computedTrainPos, setComputedTrainPos] = useState(null);
  const [tick, setTick] = useState(0);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    axios.get("http://localhost:8080/api/stations")
      .then(res => setStations(res.data))
      .catch(err => console.error("Stations error:", err));
  }, []);

useEffect(() => {
    if (stationId) {
      setLoadingDepartures(true); // Odpalamy loader
      setStationDepartures([]);    // CZYŚCIMY stare dane, żeby nie "straszyły"

      Promise.all([
        axios.get(`http://localhost:8080/api/stations/${stationId}`),
        axios.get(`http://localhost:8080/api/timetable/${stationId}`)
      ])
      .then(([stationRes, timetableRes]) => {
        setSelectedStation(stationRes.data);
        
        const rawTrains = timetableRes.data || [];
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const getT = (iso) => iso?.includes("T") ? iso.split("T")[1].substring(0, 5) : iso?.substring(0, 5);

        // Grupowanie - identyczne jak w StationsPage
        const trainGroups = {};
        rawTrains.forEach(train => {
          const sInfo = train.stations?.find(s => String(s.stationId) === String(stationId)) || {};
          const groupKey = train.cleanNumber ? `${train.cleanNumber}_${train.trainCategory}` : train.trainOrderId;
          
          if (!trainGroups[groupKey]) {
            trainGroups[groupKey] = {
              cat: train.trainCategory || "REG",
              train: train.trainName || train.displayNumber || "Pociąg",
              dest: train.relation?.split(" - ").pop() || "Stacja docelowa",
              dep: getT(sInfo.plannedDeparture) || getT(sInfo.plannedArrival) || "??:??",
            };
          }
        });

        // Filtrowanie i sortowanie 5 najbliższych
        const processed = Object.values(trainGroups)
          .map(t => {
            const [h, m] = t.dep.split(':').map(Number);
            let tMins = h * 60 + m;
            let diff = tMins - currentMins;
            if (diff < -720) diff += 1440;
            return { ...t, diff };
          })
          .filter(t => t.diff >= -2) 
          .sort((a, b) => a.diff - b.diff)
          .slice(0, 5);

        setStationDepartures(processed);
      })
      .catch(err => console.error("Błąd stacji:", err))
      .finally(() => setLoadingDepartures(false)); // Wyłączamy loader
    }
  }, [stationId]);

  useEffect(() => {
    if (trainId) {
      axios.get(`http://localhost:8080/api/trains/${encodeURIComponent(trainId)}`)
        .then(res => {
          setTrackedTrain(res.data);
          if (res.data.shapeCoords && res.data.shapeCoords.length > 0) {
            setRouteCoords(res.data.shapeCoords);
          } else if (res.data.route) {
            setRouteCoords(res.data.route.map(s => [s.lat, s.lon]));
          }
        })
        .catch(() => {
          setTrackedTrain(null);
          setRouteCoords([]);
        });
    } else {
      setTrackedTrain(null);
      setRouteCoords([]);
      setIsTracking(false); 
    }
  }, [trainId]);

  useEffect(() => {
    if (!trackedTrain || !trackedTrain.route || routeCoords.length === 0 || !isLive) {
      setComputedTrainPos(null);
      return;
    }

    const now = new Date();
    const currentTotalMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    const d = trackedTrain.delay || 0;
    const r = trackedTrain.route;

    let newPos = null;
    const firstDep = calcMin(r[0].dep) + d;
    if (currentTotalMin < firstDep) {
      newPos = { lat: r[0].lat, lon: r[0].lon, status: "stopped", progress: 0, nextStation: r[1] };
    }

    const lastArr = calcMin(r[r.length - 1].arr) + d;
    if (!newPos && currentTotalMin > lastArr) {
      newPos = { lat: r[r.length-1].lat, lon: r[r.length-1].lon, status: "finished", progress: 1, nextStation: null };
    }

    if (!newPos) {
      for (let i = 0; i < r.length; i++) {
        const arrTime = calcMin(r[i].arr) + d;
        const depTime = calcMin(r[i].dep) + d;

        if (currentTotalMin >= arrTime && currentTotalMin <= depTime) {
          newPos = { lat: r[i].lat, lon: r[i].lon, status: "stopped", progress: 0, nextStation: r[i+1] };
          break;
        }

        if (i < r.length - 1) {
          let t1 = calcMin(r[i].dep) + d;
          let t2 = calcMin(r[i+1].arr) + d;
          if (t2 < t1) t2 += 1440;
          let tCurr = currentTotalMin;
          if (tCurr < t1 - 120 && t2 > 1440) tCurr += 1440;

          if (tCurr > t1 && tCurr < t2) {
            const progress = (tCurr - t1) / (t2 - t1);
            let cLat = r[i].lat, cLon = r[i].lon;

            if (trackedTrain.shapeCoords && trackedTrain.shapeCoords.length > 0) {
              let minDist1 = Infinity, idx1 = 0, minDist2 = Infinity, idx2 = 0;
              trackedTrain.shapeCoords.forEach((pt, idx) => {
                const d1 = Math.pow(pt[0] - r[i].lat, 2) + Math.pow(pt[1] - r[i].lon, 2);
                if (d1 < minDist1) { minDist1 = d1; idx1 = idx; }
                const d2 = Math.pow(pt[0] - r[i+1].lat, 2) + Math.pow(pt[1] - r[i+1].lon, 2);
                if (d2 < minDist2) { minDist2 = d2; idx2 = idx; }
              });

              if (idx1 <= idx2) {
                const targetIdx = idx1 + Math.floor(progress * (idx2 - idx1));
                cLat = trackedTrain.shapeCoords[targetIdx][0];
                cLon = trackedTrain.shapeCoords[targetIdx][1];
              } else {
                cLat = r[i].lat + (r[i+1].lat - r[i].lat) * progress;
                cLon = r[i].lon + (r[i+1].lon - r[i].lon) * progress;
              }
            } else {
              cLat = r[i].lat + (r[i+1].lat - r[i].lat) * progress;
              cLon = r[i].lon + (r[i+1].lon - r[i].lon) * progress;
            }
            newPos = { lat: cLat, lon: cLon, status: "moving", progress, nextStation: r[i+1] };
            break;
          }
        }
      }
    }
    setComputedTrainPos(newPos);
  }, [trackedTrain, routeCoords, tick, isLive]);

  const handleStationClick = useCallback((id) => {
    setSearchParams((prevParams) => {
      const newParams = new URLSearchParams(prevParams);
      const currentId = newParams.get("stationId");
      if (currentId && String(currentId) === String(id)) {
        newParams.delete("stationId");
        setSelectedStation(null); 
      } else {
        newParams.set("stationId", id);
      }
      return newParams;
    });
  }, [setSearchParams]); 

  let pastRoute = [];
  let futureRoute = routeCoords;
  if (isLive && computedTrainPos && routeCoords.length > 0) {
      let minD = Infinity, closestIdx = 0;
      routeCoords.forEach((pt, i) => {
          const d = Math.pow(pt[0] - computedTrainPos.lat, 2) + Math.pow(pt[1] - computedTrainPos.lon, 2);
          if (d < minD) { minD = d; closestIdx = i; }
      });
      pastRoute = routeCoords.slice(0, closestIdx + 1);
      futureRoute = routeCoords.slice(closestIdx);
  }

  const nextStation = computedTrainPos?.nextStation;
  let prevStation = null;
  if (nextStation && trackedTrain?.route) {
      const nextIdx = trackedTrain.route.findIndex(s => s.id === nextStation.id);
      if (nextIdx > 0) prevStation = trackedTrain.route[nextIdx - 1];
  }

  const trainIcon = L.divIcon({
    className: 'custom-train-icon',
    html: `<div class="train-marker-wrapper ${computedTrainPos?.status === 'stopped' ? 'is-stopped' : ''}"><div class="train-marker-core"></div><div class="train-marker-pulse"></div></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  const trainShadowIcon = L.divIcon({
    className: 'train-shadow-icon',
    html: ``,
    iconSize: [20, 20],
    iconAnchor: [10, -5] 
  });

  const firstStationOnRoute = trackedTrain?.route?.[0];
  const mapTheme = user?.settings?.map_theme || user?.settings?.mapTheme || 'dark';
  const tileUrl = mapTheme === 'light'
    ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    : 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      {trainId && isLive && (
        <button 
          className={`map-tracking-button ${isTracking ? 'active' : ''}`}
          onClick={() => setIsTracking(!isTracking)}
        >
          <span className="tracking-dot"></span>
          {isTracking ? "ŚLEDZENIE WŁĄCZONE" : "ŚLEDŹ POCIĄG"}
        </button>
      )}

      <MapContainer
        center={[52.23, 21.01]} 
        zoom={6} 
        maxBoundsViscosity={0.8}
        maxBounds={POLAND_BOUNDS}
        preferCanvas={true} 
        style={{ height: "100%", width: "100%", background: "var(--bg-main)" }}
      >
        <TileLayer url={tileUrl} />
        <ZoomListener setZoomLevel={setCurrentZoom} />
        <MapController 
          selectedStation={selectedStation} 
          trainLocation={computedTrainPos} 
          sidebarOpen={sidebarOpen}
          isTracking={isTracking}
          setIsTracking={setIsTracking}
          isLive={isLive}
          firstStation={firstStationOnRoute}
        />

        {pastRoute.length > 0 && (
          <Polyline 
            positions={pastRoute} 
            pathOptions={{ color: "#750000", weight: 3, opacity: 0.5, dashArray: '5, 5' }} 
          />
        )}

        {futureRoute.length > 0 && (
          <Polyline 
            positions={futureRoute} 
            pathOptions={{ color: "#ff2b2b", weight: 4, opacity: 0.8 }} 
          />
        )}

        <Pane name="shadow-pane" style={{ zIndex: 640 }}>
          {computedTrainPos && trackedTrain && isLive && (
            <Marker position={[computedTrainPos.lat, computedTrainPos.lon]} icon={trainShadowIcon} pane="shadow-pane" interactive={false} />
          )}
        </Pane>

        <Pane name="train-pane" style={{ zIndex: 650 }}>
          {computedTrainPos && trackedTrain && isLive && (
            <Marker position={[computedTrainPos.lat, computedTrainPos.lon]} icon={trainIcon} pane="train-pane">
              <Popup className={`train-next-gen-popup popup-accent-${trackedTrain.categorySymbol}`} offset={[0, -10]}>
                <div className={`popup-main-container popup-accent-${trackedTrain.categorySymbol}`}>
                  <div className="popup-top-bar"></div> 
                  <div className="popup-content-padding">
                    <div className="popup-row-header">
                      <div className="popup-train-identity">
                        <span className="popup-category-tag">{trackedTrain.categorySymbol}</span>
                        <span className="popup-train-id">{trackedTrain.number}</span>
                      </div>
                      <span className="popup-speed-badge">
                        {computedTrainPos?.status === "stopped" ? "STOI" : `⚡ ${trackedTrain.speed || 150} km/h`}
                      </span>
                    </div>
                    {trackedTrain.name && trackedTrain.name.trim().length > 0 && (
                      <div className="popup-train-name-row">"{trackedTrain.name}"</div>
                    )}
                    <div className="popup-route-text">{trackedTrain.relation}</div>
                    
                    <div className="popup-status-row">
                      <span className={`status-dot ${trackedTrain.delay > 0 ? 'delayed' : 'on-time'}`}></span>
                      <div className={`status-text ${trackedTrain.delay > 0 ? 'delayed' : 'on-time'}`}>
                        Opóźnienie: {trackedTrain.delay > 0 ? <strong>+{trackedTrain.delay} min</strong> : <strong>O czasie</strong>}
                      </div>
                    </div>

                    {prevStation && nextStation && (
                      <div className="timeline-container">
                         <div className="timeline-station">
                             <div className="timeline-station-name"><span className="marquee-wrap"><span className="marquee-text">{prevStation.name}</span></span></div>
                             <div className="timeline-time">{prevStation.dep}</div>
                         </div>
                         <div className="timeline-track">
                             <div className="timeline-progress" style={{ width: `${computedTrainPos.progress * 100}%` }}></div>
                             <div className="timeline-train-icon" style={{ left: `${computedTrainPos.progress * 100}%` }}>🚅</div>
                         </div>
                         <div className="timeline-station">
                             <div className="timeline-station-name"><span className="marquee-wrap"><span className="marquee-text">{nextStation.name}</span></span></div>
                             <div className="timeline-time">{nextStation.arr}</div>
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </Pane>

        <StationsLayer 
          stations={stations}
          currentZoom={currentZoom}
          loadingDepartures={loadingDepartures}
          stationId={stationId}
          trackedTrain={trackedTrain} 
          stationDepartures={stationDepartures}
          onStationClick={handleStationClick}
        />
      </MapContainer>
    </div>
  );
}