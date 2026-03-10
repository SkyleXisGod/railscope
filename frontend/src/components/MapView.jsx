import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Polyline, Marker } from "react-leaflet";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import axios from "axios";

const POLAND_BOUNDS = L.latLngBounds([49.0, 14.0], [55.0, 24.5]);

function MapLogic({ sidebarOpen, station, routeCoords, trainId }) {
  const map = useMap();
  const prevTrainId = useRef(null);
  const prevStationId = useRef(null);

  useEffect(() => {
    map.setMinZoom(6);
    map.setMaxZoom(18); 
    
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 350);
    return () => clearTimeout(timer);
  }, [sidebarOpen, map]);

  // FIX: Mapa centruje się tylko raz, gdy zmienia się ID pociągu lub stacji
  useEffect(() => {
    if (station && station.id !== prevStationId.current) {
      map.flyTo([station.lat, station.lon], 15, { duration: 1.2 });
      prevStationId.current = station.id;
    }
  }, [station, map]);

  useEffect(() => {
    if (routeCoords && routeCoords.length > 0 && trainId !== prevTrainId.current) {
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [50, 50], duration: 1.2 });
      prevTrainId.current = trainId;
    }
  }, [routeCoords, map, trainId]);

  useEffect(() => {
    const handleMoveEnd = () => {
      if (!map.getBounds().overlaps(POLAND_BOUNDS)) {
        map.panInsideBounds(POLAND_BOUNDS, { animate: true });
      }
    };
    map.on("moveend", handleMoveEnd);
    return () => map.off("moveend", handleMoveEnd);
  }, [map]);

  return null;
}

// NOWA IKONA: Profesjonalna kropka trackera
const trainDotIcon = L.divIcon({
  className: 'custom-train-dot',
  html: `
    <div style="
      width: 16px; 
      height: 16px; 
      background-color: #007bff; 
      border: 3px solid white; 
      border-radius: 50%; 
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
      transform: translate(-2px, -2px);
    "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

export default function MapView({ sidebarOpen }) {
  const [stations, setStations] = useState([]);
  const [trackedTrain, setTrackedTrain] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const stationId = searchParams.get("station");
  const trainId = searchParams.get("trainId");

  const [pulseSize, setPulseSize] = useState(16);
  const [trainPos, setTrainPos] = useState(null);

  const markerRefs = useRef({});

  useEffect(() => {
    axios.get("http://localhost:8080/api/stations")
      .then(res => setStations(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (trainId) {
      axios.get(`http://localhost:8080/api/trains/${trainId}`)
        .then(res => setTrackedTrain(res.data))
        .catch(err => {
            console.error(err);
            setTrackedTrain(null);
        });
    } else {
      setTrackedTrain(null);
      setTrainPos(null);
    }
  }, [trainId]);

  // Logika LIVE (bez zmian w obliczeniach, tylko interwał)
  useEffect(() => {
    if (!trackedTrain || !trackedTrain.route || stations.length === 0) return;

    const updatePosition = () => {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes() + (now.getSeconds() / 60);

      let previousMins = -1;
      const continuousStops = trackedTrain.route.map((stop, idx) => {
        const s = stations.find(st => st.name.toLowerCase() === stop.name.toLowerCase() || String(st.id) === String(stop.id));
        const delay = trackedTrain.delay || 0;
        
        const getMins = (tStr) => {
          if (!tStr || tStr === "-") return null;
          const [h, m] = tStr.split(':').map(Number);
          return h * 60 + m + delay;
        };
        
        let arr = getMins(stop.arr);
        let dep = getMins(stop.dep);
        
        if (idx === 0 && arr === null) arr = dep;
        if (idx === trackedTrain.route.length - 1 && dep === null) dep = arr;
        if (arr === null && dep !== null) arr = dep;
        if (dep === null && arr !== null) dep = arr;
        
        if (arr !== null) {
           if (previousMins !== -1 && arr < previousMins - 12 * 60) arr += 24 * 60;
           previousMins = arr;
        }
        if (dep !== null) {
           if (previousMins !== -1 && dep < previousMins - 12 * 60) dep += 24 * 60;
           previousMins = dep;
        }
        
        return { ...stop, lat: s?.lat, lon: s?.lon, arr, dep };
      }).filter(s => s.lat && s.lon);

      if (continuousStops.length < 2) return;

      let cMins = currentMins;
      const startMins = continuousStops[0]?.dep;
      if (startMins && cMins < startMins - 12 * 60 && startMins > 12 * 60) cMins += 24 * 60;

      let newPos = null;
      for (let i = 0; i < continuousStops.length - 1; i++) {
        const A = continuousStops[i];
        const B = continuousStops[i + 1];

        if (cMins >= A.arr && cMins < A.dep) {
          newPos = [A.lat, A.lon];
          break;
        }
        if (cMins >= A.dep && cMins <= B.arr) {
          const duration = B.arr - A.dep;
          const elapsed = cMins - A.dep;
          const progress = duration > 0 ? elapsed / duration : 0;
          newPos = [
            A.lat + (B.lat - A.lat) * progress,
            A.lon + (B.lon - A.lon) * progress
          ];
          break;
        }
      }

      if (!newPos) {
        const first = continuousStops[0];
        const last = continuousStops[continuousStops.length - 1];
        if (cMins <= first.arr) newPos = [first.lat, first.lon];
        else if (cMins >= last.dep) newPos = [last.lat, last.lon];
      }
      setTrainPos(newPos);
    };

    updatePosition();
    const interval = setInterval(updatePosition, 1000);
    return () => clearInterval(interval);
  }, [trackedTrain, stations]);

  // Efekt pulsowania stacji
  useEffect(() => {
    if (!stationId) return;
    let growing = true;
    const interval = setInterval(() => {
      setPulseSize(prev => {
        if (prev > 20) growing = false;
        if (prev < 14) growing = true;
        return growing ? prev + 0.4 : prev - 0.4;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [stationId]);

  const handleMarkerClick = (id) => {
    setSearchParams({ station: id });
  };

  const activeStation = stations.find(s => String(s.id) === String(stationId));
  const routeCoords = trackedTrain?.route
    ?.filter(stop => stop.lat && stop.lon)
    .map(stop => [stop.lat, stop.lon]) || [];

  return (
    <MapContainer center={[52, 19]} zoom={6} className="map-container">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <MapLogic 
        sidebarOpen={sidebarOpen} 
        station={activeStation} 
        routeCoords={routeCoords}
        trainId={trainId}
      />

      {routeCoords.length > 0 && (
        <Polyline positions={routeCoords} pathOptions={{ color: "#ff2b2b", weight: 4, opacity: 0.6 }} />
      )}

      {trainPos && (
        <Marker position={trainPos} icon={trainDotIcon} zIndexOffset={9999}>
          <Popup>
            <div style={{ textAlign: 'center' }}>
                <strong>{trackedTrain.category} {trackedTrain.number}</strong><br/>
                {trackedTrain.trainName && <span style={{ color: '#007bff' }}>"{trackedTrain.trainName}"</span>}
            </div>
          </Popup>
        </Marker>
      )}

      {stations.map(s => {
        const isActive = String(s.id) === String(stationId);
        const isOnTrackedRoute = trackedTrain?.route?.some(rs => String(rs.id) === String(s.id));
        return (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lon]}
            radius={isActive ? 6 : 4}
            eventHandlers={{ click: () => handleMarkerClick(s.id) }}
            pathOptions={{
              color: "#333",
              fillColor: isActive || isOnTrackedRoute ? "#ff2b2b" : "#00ffd5",
              fillOpacity: 1,
              weight: 1
            }}
          >
            {isActive && (
              <CircleMarker 
                center={[s.lat, s.lon]} 
                radius={pulseSize} 
                pathOptions={{ color: "#ff2b2b", fillOpacity: 0.2 }} 
              />
            )}
            <Popup><strong>{s.name}</strong></Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}