import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import axios from "axios";
import "leaflet/dist/leaflet.css";

export default function MapView() {

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
      style={{ height: "100vh", width: "100%" }}
    >

      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {stations.map(s => (
        <Marker key={s.id} position={[s.lat, s.lon]}>
          <Popup>
            {s.name}
          </Popup>
        </Marker>
      ))}

    </MapContainer>
  );
}