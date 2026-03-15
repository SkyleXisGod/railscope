import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Polyline, Marker, useMapEvents } from "react-leaflet";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import "./MapPopup.css";
import L from "leaflet";
import axios from "axios";

const POLAND_BOUNDS = L.latLngBounds([49.0, 14.0], [55.0, 24.5]);

const calcMin = (timeStr) => {
  if (!timeStr || timeStr === "??:??" || timeStr === "-") return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
};

function ZoomListener({ setZoomLevel }) {
  useMapEvents({
    zoomend: (e) => {
      setZoomLevel(e.target.getZoom());
    },
  });
  return null;
}

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

const trainDotIcon = L.divIcon({
  className: 'custom-train-dot',
  html: `<div style="width: 16px; height: 16px; background-color: #007bff; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5); transform: translate(-2px, -2px);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

export default function MapView({ sidebarOpen }) {
  const [stations, setStations] = useState([]);
  const [trackedTrain, setTrackedTrain] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [localShapeCoords, setLocalShapeCoords] = useState([]);
  
  const stationId = searchParams.get("station");
  const trainId = searchParams.get("trainId");
  const isLiveMode = searchParams.get("live") === "true";
  
  const [mapInstance, setMapInstance] = useState(null);
  const [pulseSize, setPulseSize] = useState(16);
  const [trainPos, setTrainPos] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(6);

  useEffect(() => {
    axios.get("http://localhost:8080/api/stations")
      .then(res => setStations(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (trainId) {
      axios.get(`http://localhost:8080/api/trains/${trainId}`)
        .then(async (res) => {
          let trainData = res.data;
          trainData.delay = 0;

          if (isLiveMode && trainData.route && trainData.route.length > 0) {
            try {
              const now = new Date();
              const currentMins = now.getHours() * 60 + now.getMinutes();

              const activeStation = trainData.route.find(s => {
                  const arrMin = calcMin(s.arr);
                  const depMin = calcMin(s.dep);
                  return (arrMin && arrMin > currentMins - 20); 
              }) || trainData.route[trainData.route.length - 1]; 

              const timetableRes = await axios.get(`http://localhost:8080/api/timetable/${activeStation.id}`);
              const rawTrains = timetableRes.data || [];
              const getT = (iso) => iso?.includes("T") ? iso.split("T")[1].substring(0, 5) : iso?.substring(0, 5);
              const liveTrain = rawTrains.find(t => String(t.trainOrderId) === String(trainId));
              
              if (liveTrain) {
                const sInfo = liveTrain.stations?.find(s => String(s.stationId) === String(activeStation.id)) || {};
                const pArr = getT(sInfo.plannedArrival);
                const pDep = getT(sInfo.plannedDeparture);
                const aArr = getT(sInfo.actualArrival);
                const aDep = getT(sInfo.actualDeparture);

                const delayArr = aArr && pArr ? Math.max(0, (calcMin(aArr) || 0) - (calcMin(pArr) || 0)) : 0;
                const delayDep = aDep && pDep ? Math.max(0, (calcMin(aDep) || 0) - (calcMin(pDep) || 0)) : 0;
                
                trainData.delay = Math.max(delayArr, delayDep);
              }
            } catch (e) {
              console.warn("Błąd pobierania delay live:", e);
            }
          }
          setTrackedTrain(trainData);
        })
        .catch(err => {
          console.error(err);
          setTrackedTrain(null);
        });
    } else {
      setTrackedTrain(null);
    }
  }, [trainId, isLiveMode]);

  const getTrainStyle = (categorySymbol) => {
    const categories = ["EIP", "EIC", "IC", "TLK"];
    const styleClass = categories.includes(categorySymbol) ? `cat-${categorySymbol}` : "cat-REG";
    const emojis = { "EIP": "🚄", "EIC": "🚆", "IC": "🚆", "TLK": "🚂", "BUS": "🚌", "ZKA": "🚌" };
    return { accentClass: styleClass, label: categorySymbol || "REG", emoji: emojis[categorySymbol] || "🚆" };
  };

  useEffect(() => {
    // 1. Zmieniamy źródło punktów: najpierw kształt GTFS, potem (jako backup) stacje
    const points = (trackedTrain?.shapeCoords && trackedTrain.shapeCoords.length > 0) 
      ? trackedTrain.shapeCoords 
      : trackedTrain?.route?.filter(r => r.lat && r.lon).map(r => [r.lat, r.lon]);

    if (!isLiveMode || !trackedTrain || !points || points.length < 2) {
      setTrainPos(null);
      return;
    }

    const updatePosition = () => {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes() + (now.getSeconds() / 60);
      
      // Obliczamy całkowity postęp pociągu na trasie (od pierwszej do ostatniej stacji)
      const firstStop = trackedTrain.route[0];
      const lastStop = trackedTrain.route[trackedTrain.route.length - 1];
      
      const delay = trackedTrain.delay || 0;
      const startTime = calcMin(firstStop.dep) + delay;
      const endTime = calcMin(lastStop.arr) + delay;

      if (currentMins <= startTime) {
        setTrainPos(points[0]);
        return;
      }
      if (currentMins >= endTime) {
        setTrainPos(points[points.length - 1]);
        return;
      }

      // Procentowy postęp całej trasy
      const totalProgress = (currentMins - startTime) / (endTime - startTime);
      
      // Znajdujemy punkt na "ładnej linii" odpowiadający temu postępowi
      const pointIndex = Math.floor(totalProgress * (points.length - 1));
      const nextPointIndex = Math.min(pointIndex + 1, points.length - 1);
      const segmentProgress = (totalProgress * (points.length - 1)) - pointIndex;

      const p1 = points[pointIndex];
      const p2 = points[nextPointIndex];

      const interpolatedPos = [
        p1[0] + (p2[0] - p1[0]) * segmentProgress,
        p1[1] + (p2[1] - p1[1]) * segmentProgress
      ];

      setTrainPos(interpolatedPos);
    };

    updatePosition();
    const interval = setInterval(updatePosition, 1000);
    return () => clearInterval(interval);
  }, [trackedTrain, isLiveMode]);

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

  const handleMarkerClick = (id) => setSearchParams({ station: id });

  const activeStation = stations.find(s => String(s.id) === String(stationId));
  const routeCoords = trackedTrain?.route?.filter(stop => stop.lat && stop.lon).map(stop => [stop.lat, stop.lon]) || [];
  const shapeCoords = trackedTrain?.shapeCoords || [];
  const lineToDraw = shapeCoords.length > 0 ? shapeCoords : routeCoords;

  return (
    <MapContainer center={[52, 19]} zoom={6} className="map-container">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ZoomListener setZoomLevel={setCurrentZoom} />
      <MapLogic sidebarOpen={sidebarOpen} station={activeStation} routeCoords={routeCoords} trainId={trainId} />

      {lineToDraw.length > 0 && (
        <Polyline positions={lineToDraw} pathOptions={{ color: "#ff2b2b", weight: 4, opacity: 0.6, lineJoin: 'round' }} />
      )}

      {isLiveMode && trainPos && trackedTrain && (
        <Marker position={trainPos} icon={trainDotIcon} zIndexOffset={9999}>
          <Popup className="train-next-gen-popup">
            {(() => {
              const style = getTrainStyle(trackedTrain.categorySymbol);
              return (
                <div className={`custom-popup ${style.accentClass}`}>
                  <div className="popup-side-accent"></div>
                  <div className="popup-content">
                    <div className="popup-header">
                      <span className="popup-emoji">{style.emoji}</span>
                      <span className={`popup-category ${style.accentClass}-badge`}>{style.label}</span>
                      <span className="popup-number">{trackedTrain.number}</span>
                    </div>
                    {trackedTrain.name && (
                      <div className="popup-train-name">"{trackedTrain.name}"</div>
                    )}
                    <div className="popup-relation">{trackedTrain.relation}</div>
                    <div className={`popup-delay ${trackedTrain.delay > 0 ? 'delayed' : 'on-time'}`}>
                      {trackedTrain.delay > 0 ? `Opóźnienie: +${trackedTrain.delay} min` : "O czasie"}
                    </div>
                  </div>
                </div>
              );
            })()}
          </Popup>
        </Marker>
      )}

      {stations.map(s => {
        const isActive = String(s.id) === String(stationId);
        const isOnTrackedRoute = trackedTrain?.route?.some(rs => String(rs.id) === String(s.id));
        if (s.isRegional && currentZoom < 10 && !isOnTrackedRoute && !isActive) return null;

        return (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lon]}
            radius={isActive ? 6 : (s.isRegional ? 3 : 4)} 
            eventHandlers={{ click: () => handleMarkerClick(s.id) }}
            pathOptions={{
              color: "#333",
              fillColor: isActive || isOnTrackedRoute ? "#ff2b2b" : (s.isRegional ? "#f1c40f" : "#00ffd5"), 
              fillOpacity: 1,
              weight: 1
            }}
          >
            {isActive && (
              <CircleMarker center={[s.lat, s.lon]} radius={pulseSize} pathOptions={{ color: "#ff2b2b", fillOpacity: 0.2 }} />
            )}
            <Popup><strong>{s.name}</strong></Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}