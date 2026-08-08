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
  const [showConfirm, setShowConfirm] = useState(false); // ★ 登録確認ポップアップ
  const [showModal, setShowModal] = useState(false); // ★ 保存名入力モーダル
  const [saveName, setSaveName] = useState(""); // ★ 保存名
  const [top3, setTop3] = useState([]); // ★ 避難所トップ3

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

  const userLat = storedLat || 35.6895;
  const userLon = storedLon || 139.6917;

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

  // ★ API 取得
  useEffect(() => {
    fetch(
      `http://localhost:8000/recommend?lat=${userLat}&lon=${userLon}&life_stage=${encodeURIComponent(
        JSON.stringify(lifeStageRaw)
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        setShelters(data.results);

        // ★ トップ3を保存候補として保持
        const top = data.results.slice(0, 3).map((s) => ({
          name: s.避難所名,
          lat: s.lat,
          lon: s.lon,
          距離: s.距離,
          最寄り産科: s.最寄り産科,
          産科までの距離: s.産科までの距離,
          最寄り小児科: s.最寄り小児科,
          小児科までの距離: s.小児科までの距離,
        }));
        setTop3(top);
      })
      .catch((err) => console.error("API取得エラー:", err));
  }, [userLat, userLon, lifeStageRaw]);

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

      {/* ★ 避難所登録ボタン */}
      <button
        onClick={() => setShowConfirm(true)}
        style={{
          position: "absolute",
          top: "70px",
          left: "10px",
          zIndex: 1000,
          backgroundColor: "#f48fb1",
          color: "white",
          padding: "10px 16px",
          borderRadius: "12px",
          border: "none",
          cursor: "pointer",
          fontWeight: "600",
        }}
      >
        現在地の避難所トップ3を登録
      </button>

      {/* ★ 登録確認ポップアップ */}
      {showConfirm && (
        <div
          style={{
            position: "absolute",
            top: "120px",
            left: "10px",
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            zIndex: 2000,
          }}
        >
          <p>現在地から近い避難所トップ3を登録しますか？</p>
          <button
            onClick={() => {
              setShowConfirm(false);
              setShowModal(true);
            }}
            style={{
              backgroundColor: "#f48fb1",
              color: "white",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            はい
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            style={{
              backgroundColor: "#ccc",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            いいえ
          </button>
        </div>
      )}

      {/* ★ 保存名入力モーダル */}
      {showModal && (
        <div
          style={{
            position: "absolute",
            top: "180px",
            left: "10px",
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            zIndex: 2000,
            width: "300px",
          }}
        >
          <p>保存名（例：自宅・職場・実家）</p>
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="保存名を入力"
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              marginBottom: "10px",
            }}
          />

          <button
            onClick={saveShelterSet}
            style={{
              backgroundColor: "#f48fb1",
              color: "white",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            保存
          </button>

          <button
            onClick={() => setShowModal(false)}
            style={{
              backgroundColor: "#ccc",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            キャンセル
          </button>
        </div>
      )}

      {/* ★ 地図 */}
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
