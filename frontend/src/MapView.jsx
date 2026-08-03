import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Leafletのデフォルトマーカー（青）
const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// ★ ユーザー位置用の赤いマーカー
const UserIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapView() {
  const [shelters, setShelters] = useState([]);
  const userLat = 35.7486;
  const userLon = 139.7080;

  useEffect(() => {
    fetch(
      `http://localhost:8000/recommend?lat=${userLat}&lon=${userLon}&life_stage=妊娠初期`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("APIレスポンス:", data);
        setShelters(data.results);
      })
      .catch((err) => console.error("API取得エラー:", err));
  }, []);

  return (
    <MapContainer
      center={[userLat, userLon]}
      zoom={15}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* ★ ユーザー位置（赤ピン） */}
      <Marker position={[userLat, userLon]} icon={UserIcon}>
        <Popup>あなたの位置</Popup>
      </Marker>

      {/* 推奨避難所のピン（青ピン） */}
      {shelters.map((s, i) => (
        <Marker key={i} position={[s.lat, s.lon]}>
          <Popup>
            {s.避難所名}
            <br />
            スコア: {s.総合スコア.toFixed(4)}
            <br />
            産科まで: {s.産科までの距離}m
            <br />
            小児科まで: {s.小児科までの距離}m
            <br />
            救急科まで: {s.救急科までの距離}m
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
