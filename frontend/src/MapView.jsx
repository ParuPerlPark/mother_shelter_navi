import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import milkIconPng from "./assets/milk.png";
import diaperIconPng from "./assets/diaper.png";
import equipmentIconPng from "./assets/equipment.png";

// デフォルトマーカー（青）
const DefaultIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// 現在地（赤ピン）
const UserIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// ★ 番号入りピン＋アイコン群
const createRankIconWithPng = (rank, equipment, milk, diaper) => {
  const color = rank === 1 ? "#ff4d4d" : rank === 2 ? "#ff7f50" : "#ffa500";

  const icons = [];
  if (equipment) icons.push(`<img src="${equipmentIconPng}" width="32" height="32" />`);
  if (milk) icons.push(`<img src="${milkIconPng}" width="32" height="32" />`);
  if (diaper) icons.push(`<img src="${diaperIconPng}" width="32" height="32" />`);

  const html = `
    <div style="position: relative; text-align: center;">
      <svg xmlns="http://www.w3.org/2000/svg" width="55" height="70">
        <path d="M27.5 0C17 0 9 8 9 17c0 13 18.5 33 18.5 33S46 30 46 17C46 8 38 0 27.5 0z"
              fill="${color}" stroke="#333" stroke-width="1"/>
        <text x="27.5" y="25" text-anchor="middle"
              font-size="18" font-weight="bold" fill="white">${rank ?? ""}</text>
      </svg>
      <div style="display:flex; justify-content:center; gap:0; margin-top:-18px;">
        ${icons.join("")}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "",
    iconSize: [55, 80],
    iconAnchor: [27.5, 80],
    popupAnchor: [0, -60],
  });
};

export default function MapView() {
  const [shelters, setShelters] = useState([]);
  const [top3, setTop3] = useState([]);
  const [savedShelters, setSavedShelters] = useState([]);

  // lifeStage の安全な読み取り
  let raw = localStorage.getItem("lifeStage");
  let lifeStageRaw = [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      lifeStageRaw = parsed;
    }
  } catch {
    lifeStageRaw = [];
  }

  const dueDate = localStorage.getItem("dueDate");
  const childCount = localStorage.getItem("childCount");

  // ★ テスト用：板橋区立文化会館を現在地に固定
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

  // 登録済み避難所読み込み
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedShelters") || "[]");
    setSavedShelters(saved);
  }, []);

  // API取得
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
        console.log("API結果:", data.results);
        setShelters(data.results);

        const top = data.results.slice(0, 3).map((s, i) => ({
          ...s,
          rank: i + 1,
        }));
        setTop3(top);
      })
      .catch((err) => console.error("API取得エラー:", err));
  }, [userLat, userLon, lifeStageRaw, weeks]);

  return (
    <>
      {/* ★ 左上 UI */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "60px", // ← 右に寄せてズームボタンと重ならないように
          backgroundColor: "#ffe4ec",
          padding: "10px 20px",
          borderRadius: "20px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          zIndex: 1000,
          fontFamily: "'Noto Sans JP', sans-serif",
          color: "#d96c9f",
          fontWeight: "600",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "12px",
        }}
      >
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

        {/* 避難所登録ボタン */}
        <button
          onClick={() => {
            const name = prompt("登録名を入力してください（例：自宅、職場など）");
            if (!name) return;

            const saved = JSON.parse(localStorage.getItem("savedShelters") || "[]");
            const topNames = top3.map((s) => s.name); // ★ Top3避難所名を取得

            saved.push({
              name,
              lat: userLat,
              lon: userLon,
              topShelters: topNames, // ★ Top3を保存
            });

            localStorage.setItem("savedShelters", JSON.stringify(saved));
            setSavedShelters(saved);

            alert(`「${name}」を登録しました`);
          }}
          style={{
            backgroundColor: "#f8c8dc",
            padding: "6px 12px",
            borderRadius: "12px",
            color: "#333",
            fontWeight: "500",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            border: "none",
            cursor: "pointer",
          }}
        >
          📍 避難所を登録
        </button>

      </div>

      <MapContainer
        center={[userLat, userLon]}
        zoom={15}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* 現在地 */}
        <Marker position={[userLat, userLon]} icon={UserIcon}>
          <Popup>あなたの位置</Popup>
        </Marker>

        {/* ★ 登録済み避難所 */}
        {savedShelters.map((s, i) => (
          <Marker key={`saved-${i}`} position={[s.lat, s.lon]} icon={DefaultIcon}>
            <Popup>
              <b>登録名：{s.name}</b>
              <br />
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${s.lat},${s.lon}&travelmode=walking`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: "8px",
                  padding: "8px 14px",
                  backgroundColor: "#f48fb1",
                  color: "white",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: "600",
                }}
              >
                🚶‍♀️ 案内開始
              </a>
            </Popup>
          </Marker>
        ))}

        {/* トップ3 */}
        {top3.map((s, i) => (
          <Marker
            key={`top-${i}`}
            position={[s.lat, s.lon]}
            icon={createRankIconWithPng(s.rank, s.equipment, s.milk, s.diaper)}
          >
            <Popup>
              <b>{s.rank}位: {s.name}</b>
              <br />
              スコア: {s.score.toFixed(4)}
              <br />
              産婦人科まで: {s.distance_ob}m
              <br />
              小児科まで: {s.distance_pe}m
              <br />
              ミルク：{s.milk ? "あり" : "情報なし"}
              <br />
              おむつ：{s.diaper ? "あり" : "情報なし"}
              <br />
              設備：{s.equipment ? "あり" : "情報なし"}
              <br /><br />

              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${s.lat},${s.lon}&travelmode=walking`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: "8px",
                  padding: "8px 14px",
                  backgroundColor: "#f48fb1",
                  color: "white",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: "600",
                }}
              >
                🚶‍♀️ 案内開始
              </a>
            </Popup>
          </Marker>
        ))}

        {/* その他の避難所 */}
        {shelters.slice(3).map((s, i) => (
          <Marker
            key={`other-${i}`}
            position={[s.lat, s.lon]}
            icon={createRankIconWithPng(null, s.equipment, s.milk, s.diaper)}
          >
            <Popup>
              {s.name}
              <br />
              スコア: {s.score.toFixed(4)}
              <br />
              <br />
              ミルク：{s.milk ? "あり" : "情報なし"}
              <br />
              おむつ：{s.diaper ? "あり" : "情報なし"}
              <br />
              設備：{s.equipment ? "あり" : "情報なし"}
              <br /><br />

              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${s.lat},${s.lon}&travelmode=walking`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: "8px",
                  padding: "8px 14px",
                  backgroundColor: "#f48fb1",
                  color: "white",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: "600",
                }}
              >
                🚶‍♀️ 案内開始
              </a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}
