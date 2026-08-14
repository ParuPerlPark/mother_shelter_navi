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

// ★ 番号入りピンを作る関数（1,2,3）
const createRankIcon = (rank) => {
  const color = rank === 1 ? "#ff4d4d" : rank === 2 ? "#ff7f50" : "#ffa500";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="45">
      <path d="M15 0C9 0 4 5 4 11c0 9 11 22 11 22s11-13 11-22C26 5 21 0 15 0z"
            fill="${color}" stroke="#333" stroke-width="1"/>
      <text x="15" y="17" text-anchor="middle"
            font-size="14" font-weight="bold" fill="white">${rank}</text>
    </svg>
  `;

  return L.icon({
    iconUrl: "data:image/svg+xml;base64," + btoa(svg),
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [0, -40],
  });
};

export default function MapView() {
  const [shelters, setShelters] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [top3, setTop3] = useState([]);

  const storedLat = parseFloat(localStorage.getItem("userLat"));
  const storedLon = parseFloat(localStorage.getItem("userLon"));

  // lifeStage は配列 or 文字列の両方に対応
  let raw = localStorage.getItem("lifeStage");
  let lifeStageRaw;
  try {
    lifeStageRaw = JSON.parse(raw);
  } catch {
    lifeStageRaw = raw ? [raw] : [];
  }

  const dueDate = localStorage.getItem("dueDate");
  const childCount = localStorage.getItem("childCount");

  // ★ 現在地は固定
  const userLat = 35.7515;
  const userLon = 139.7090;

  // 妊娠週数計算
  const calcWeeks = () => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.floor((due - now) / (1000 * 60 * 60 * 24));
    const weeks = Math.max(0, Math.floor((280 - diffDays) / 7));
    return weeks;
  };

  const getPregnancyStage = (weeks) => {
    if (weeks < 13) return "妊娠初期";
    if (weeks < 27) return "妊娠中期";
    if (weeks < 37) return "妊娠後期";
    return "臨月";
  };

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

  // ★ API 取得（weeks を Python に渡す）
  useEffect(() => {
    const payload = {
      pregnant: lifeStageRaw.includes("pregnant"),
      childcare: lifeStageRaw.includes("childcare"),
      weeks: weeks,
    };

    fetch(
      `http://localhost:8000/recommend?lat=${userLat}&lon=${userLon}&life_stage=${encodeURIComponent(
        JSON.stringify(payload)
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        setShelters(data.results);

        // ★ トップ3に rank を付ける
        const top = data.results.slice(0, 3).map((s, i) => ({
          ...s,
          rank: i + 1,
        }));
        setTop3(top);
      })
      .catch((err) => console.error("API取得エラー:", err));
  }, [userLat, userLon, lifeStageRaw, weeks]);

  // ★ 保存処理
  const saveShelterSet = () => {
    if (!saveName) {
      alert("保存名を入力してください");
      return;
    }

    const saved = JSON.parse(localStorage.getItem("savedShelters") || "[]");

    saved.push({
      name: saveName,
      shelters: top3,
      createdAt: new Date().toISOString(),
    });

    localStorage.setItem("savedShelters", JSON.stringify(saved));

    alert("避難所セットを保存しました！");
    setShowModal(false);
    setSaveName("");
  };

  return (
    <>
      {/* ★ ロゴ＋ステージ＋設定 */}
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

        <span>
          現在のライフステージ：
          {displayStages.length > 0 ? displayStages.join("・") : "未設定"}
        </span>

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

      {/* ★ 地図 */}
      <MapContainer
        center={[userLat, userLon]}
        zoom={15}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* ★ 現在地（赤ピン） */}
        <Marker position={[userLat, userLon]} icon={UserIcon}>
          <Popup>あなたの位置</Popup>
        </Marker>

        {/* ★ トップ3は番号入りピン */}
        {top3.map((s, i) => (
          <Marker key={`top-${i}`} position={[s.lat, s.lon]} icon={createRankIcon(s.rank)}>
            <Popup>
              <b>{s.rank}位: {s.避難所名}</b>
              <br />
              スコア: {s.総合スコア.toFixed(4)}
              <br />
              産婦人科: {s.最寄り産科}（{s.産科までの距離}m）
              <br />
              小児科: {s.最寄り小児科}（{s.小児科までの距離}m）
              <br />
              <b>設備: {s.設備あり ? "あり" : "なし"}</b>
            </Popup>
          </Marker>
        ))}

        {/* ★ その他の避難所は青ピン */}
        {shelters.slice(3).map((s, i) => (
          <Marker key={`other-${i}`} position={[s.lat, s.lon]}>
            <Popup>
              {s.避難所名}
              <br />
              スコア: {s.総合スコア.toFixed(4)}
              <br />
              <b>設備: {s.設備あり ? "あり" : "なし"}</b>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}
