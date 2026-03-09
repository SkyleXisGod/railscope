import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Polyline } from "react-leaflet";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import axios from "axios";

const POLAND_BOUNDS = L.latLngBounds([49.0, 14.0], [55.0, 24.5]);

function MapLogic({ sidebarOpen, station, routeCoords }) {
  const map = useMap();

  useEffect(() => {
    map.setMinZoom(6);
    map.setMaxZoom(18); 
    
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 350);
    return () => clearTimeout(timer);
  }, [sidebarOpen, map]);

  useEffect(() => {
    if (!station) return;
    map.flyTo([station.lat, station.lon], 15, { 
      duration: 1.2,
      easeLinearity: 0.25
    });
  }, [station, map]);

  useEffect(() => {
    if (routeCoords && routeCoords.length > 0) {
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [50, 50], duration: 1.2 });
    }
  }, [routeCoords, map]);

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

export default function MapView({ sidebarOpen }) {
  const [stations, setStations] = useState([]);
  const [trackedTrain, setTrackedTrain] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const stationId = searchParams.get("station");
  const trainId = searchParams.get("trainId");

  const [pulseSize, setPulseSize] = useState(16);
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
        .catch(err => console.error(err));
    } else {
      setTrackedTrain(null);
    }
  }, [trainId]);

  useEffect(() => {
    if (stationId && markerRefs.current[stationId]) {
      const marker = markerRefs.current[stationId];
      const timer = setTimeout(() => {
        marker.openPopup();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [stationId, stations]);

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
    <MapContainer
      center={[52, 19]}
      zoom={6}
      className="map-container"
      preferCanvas={true}
      zoomAnimation={true}
      markerZoomAnimation={false}
    >
      <TileLayer 
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        updateWhenZooming={false}
      />

      <MapLogic 
        sidebarOpen={sidebarOpen} 
        station={activeStation} 
        routeCoords={routeCoords}
      />

      {/* RYSOWANIE LINII TRASY */}
      {routeCoords.length > 0 && (
        <Polyline 
          positions={routeCoords} 
          pathOptions={{ 
            color: "#ff2b2b", 
            weight: 3, 
            opacity: 0.8 
          }} 
        />
      )}

      {stations.map(s => {
        const isActive = String(s.id) === String(stationId);
        const isOnTrackedRoute = trackedTrain?.route?.some(rs => String(rs.id) === String(s.id));
        const isRed = isActive || isOnTrackedRoute;

        return (
          <CircleMarker
            key={s.id}
            ref={(el) => (markerRefs.current[s.id] = el)}
            center={[s.lat, s.lon]}
            radius={isActive ? 5 : 3.5} 
            eventHandlers={{ click: () => handleMarkerClick(s.id) }}
            pathOptions={{
              color: "#000",
              fillColor: isRed ? "#ff2b2b" : "#00ffd5", 
              fillOpacity: 1, 
              weight: 1
            }}
          >
            {isActive && (
              <CircleMarker
                center={[s.lat, s.lon]}
                radius={pulseSize}
                interactive={false}
                pathOptions={{
                  color: "#ff2b2b",
                  fillColor: "#ff2b2b",
                  fillOpacity: 0.2,
                  weight: 1
                }}
              />
            )}
            <Popup autoPan={false}>
              <div style={{ fontWeight: 'bold', color: '#333' }}>{s.name}</div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}