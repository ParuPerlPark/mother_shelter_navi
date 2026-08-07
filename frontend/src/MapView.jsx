import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import logo from "./assets/logo.png";


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

  const storedLat = parseFloat(localStorage.getItem("userLat"));
  const storedLon = parseFloat(localStorage.getItem("userLon"));

  // ★ lifeStage は配列 or 文字列の両方に対応
  let raw = localStorage.getItem("lifeStage");
  let lifeStageRaw;

  try {
    lifeStageRaw = JSON.parse(raw); // ["pregnant","childcare"]
  } catch {
    lifeStageRaw = raw ? [raw] : []; // "pregnant" → ["pregnant"]
  }

  const dueDate = localStorage.getItem("dueDate");
  const childCount = localStorage.getItem("childCount");

  const userLat = storedLat || 35.6895;
  const userLon = storedLon || 139.6917;

  // ★ 妊娠週数を計算
  const calcWeeks = () => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.floor((due - now) / (1000 * 60 * 60 * 24));
    const weeks = Math.max(0, Math.floor((280 - diffDays) / 7));
    return weeks;
  };

  // ★ 妊娠ステージ判定
  const getPregnancyStage = (weeks) => {
    if (weeks < 13) return "妊娠初期";
    if (weeks < 27) return "妊娠中期";
    if (weeks < 37) return "妊娠後期";
    return "臨月";
  };

  // ★ 表示用ステージを組み立て
  let pregnancyStage = null;
  let weeks = null;

  if (lifeStageRaw.includes("pregnant")) {
    weeks = calcWeeks();
    pregnancyStage = weeks !== null ? getPregnancyStage(weeks) : null;
  }

  const displayStages = [];

  if (pregnancyStage) {
    displayStages.push(`${pregnancyStage}${weeks !== null ? `（${weeks}週目）` : ""}`);
  }

  if (lifeStageRaw.includes("childcare") && childCount) {
    displayStages.push(`子育て中（${childCount}人）`);
  }

  // ★ API に複数ステージを渡す
  useEffect(() => {
    fetch(
      `http://localhost:8000/recommend?lat=${userLat}&lon=${userLon}&life_stage=${encodeURIComponent(
        JSON.stringify(lifeStageRaw)
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("APIレスポンス:", data);
        setShelters(data.results);
      })
      .catch((err) => console.error("API取得エラー:", err));
  }, [userLat, userLon, lifeStageRaw]);

  return (
    <>
      {/* ★ ロゴ左寄せ＋ライフステージ＋設定ボタン */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          backgroundColor: "#ffe4ec",
          padding: "10px 20px",
          borderRadius: "20px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          zIndex: 1000,
          fontFamily: "'Noto Sans JP', sans-serif",
          color: "#d96c9f",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {/* ★ ロゴ（左側） */}
        <img
          src={logo}
          alt="Boshevi ロゴ"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            objectFit: "contain",
          }}
        />

        {/* ライフステージ */}
        <span>
          現在のライフステージ：
          {displayStages.length > 0 ? displayStages.join("・") : "未設定"}
        </span>

        {/* 設定ボタン */}
        <a
          href="/settings"
          style={{
            backgroundColor: "#f8c8dc",
            padding: "6px 12px",
            borderRadius: "12px",
            color: "#333",
            textDecoration: "none",
            fontWeight: "500",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
        >
          ⚙ 設定
        </a>
      </div>

      <MapContainer
        center={[userLat, userLon]}
        zoom={15}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Marker position={[userLat, userLon]} icon={UserIcon}>
          <Popup>あなたの位置</Popup>
        </Marker>

        {shelters.map((s, i) => (
          <Marker key={i} position={[s.lat, s.lon]}>
            <Popup>
              {s.避難所名}
              <br />
              スコア: {s.総合スコア.toFixed(4)}
              <br />
              産婦人科: {s.最寄り産科}（{s.産科までの距離}m）
              <br />
              小児科: {s.最寄り小児科}（{s.小児科までの距離}m）
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}
