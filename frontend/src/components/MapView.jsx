import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import axios from "axios";

function MapSetup({ sidebarOpen }) {
  const map = useMap();

  useEffect(() => {

    const polandBounds = [
      [49.0, 14.0],
      [55.0, 24.5]
    ];

    // Opóźnienie = poczekaj na animację sidebar
    const timer = setTimeout(() => {

      map.setMaxBounds(polandBounds);
      map.setMinZoom(6);
      map.setMaxZoom(12);

      map.fitBounds(polandBounds, {
        padding: [40, 40]
      });

      map.invalidateSize();

    }, 350);

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
      maxBounds={[
        [49.0, 14.0],
        [55.0, 24.5]
      ]}
      maxBoundsViscosity={1.0}
    >

      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapSetup sidebarOpen={sidebarOpen} />

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