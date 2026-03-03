import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import axios from "axios";

/* 🔥 Map resize helper (bardzo ważne dla Leaflet + React layout animations) */
function MapResizer({ sidebarOpen }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 350); // dopasowane do animacji sidebar

    return () => clearTimeout(timer);
  }, [sidebarOpen, map]);

  return null;
}

export default function MapView({ sidebarOpen }) {

  const [stations, setStations] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8080/api/stations")
      .then(res => setStations(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <MapContainer
      center={[52, 19]}
      zoom={6}
      className="map-container"
    >

      {/* Tile warstwa */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* 🔥 Resize map when sidebar animates */}
      <MapResizer sidebarOpen={sidebarOpen} />

      {/* Markery */}
      {stations.map(s => (
        <CircleMarker
          key={s.id}
          center={[s.lat, s.lon]}
          radius={3.5}
          pathOptions={{
            color: "#000",
            fillColor: "#00ffd5",
            fillOpacity: 0.9,
            weight: 0.5
          }}
        >
          <Popup>{s.name}</Popup>
        </CircleMarker>
      ))}

    </MapContainer>
  );
}