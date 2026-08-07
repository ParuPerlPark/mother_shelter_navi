import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ★ ロゴを正しく読み込む（components → assets）
import logo from "../assets/logo.png";

function FirstLogin() {
  const navigate = useNavigate();

  const [lifeStage, setLifeStage] = useState([]);
  const [dueDate, setDueDate] = useState("");
  const [childCount, setChildCount] = useState("");
  const [location, setLocation] = useState({ lat: null, lng: null });

  // 既存ユーザーの復元
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const fetchUser = async () => {
      const res = await fetch(
        `https://mother-shelter-api.tokyo-odh-247.workers.dev/api/user/${userId}`
      );
      const data = await res.json();
      console.log("復元されたユーザー情報:", data);
    };

    fetchUser();
  }, []);

  // ライフステージ切り替え
  const toggleStage = (stage) => {
    if (lifeStage.includes(stage)) {
      setLifeStage(lifeStage.filter((s) => s !== stage));
    } else {
      setLifeStage([...lifeStage, stage]);
    }
  };

  // 不要な値をクリア
  useEffect(() => {
    if (!lifeStage.includes("pregnant")) setDueDate("");
    if (!lifeStage.includes("childcare")) setChildCount("");
  }, [lifeStage]);

  // 現在地取得
  const getLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  };

  // 保存処理
  const saveUser = async () => {
    const payload = { lifeStage, dueDate, childCount, location };

    const res = await fetch(
      "https://mother-shelter-api.tokyo-odh-247.workers.dev/api/user",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const { userId } = await res.json();

    // localStorage 保存
    localStorage.setItem("userId", userId);
    localStorage.setItem("lifeStage", JSON.stringify(lifeStage));
    localStorage.setItem("dueDate", dueDate);
    localStorage.setItem("childCount", childCount);
    localStorage.setItem("userLat", location.lat);
    localStorage.setItem("userLon", location.lng);

    alert("保存しました！");
    navigate("/home");
  };

  return (
    <div
      style={{
        maxWidth: "420px",
        margin: "60px auto",
        padding: "30px",
        borderRadius: "16px",
        backgroundColor: "#fff",
        boxShadow: "0 6px 16px rgba(255,182,193,0.3)",
        fontFamily: "'Noto Sans JP', sans-serif",
        textAlign: "center",
      }}
    >
      {/* ★ ロゴを中央に表示 */}
      <img
        src={logo}
        alt="Boshevi ロゴ"
        style={{
          display: "block",
          margin: "0 auto 20px",
          width: "140px",
          height: "140px",
          borderRadius: "50%",
          objectFit: "contain",
        }}
      />

      <h2
        style={{
          color: "#d96c9f",
          textAlign: "center",
          marginBottom: "24px",
          fontWeight: "600",
        }}
      >
        母子避難ナビ 初回設定
      </h2>

      {/* ライフステージ */}
      <label style={{ color: "#555", fontWeight: "500" }}>
        ライフステージ：
      </label>

      <div style={{ marginTop: "10px", marginBottom: "20px", textAlign: "left" }}>
        <label>
          <input
            type="checkbox"
            checked={lifeStage.includes("pregnant")}
            onChange={() => toggleStage("pregnant")}
          />
          妊娠中
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={lifeStage.includes("childcare")}
            onChange={() => toggleStage("childcare")}
          />
          育児中
        </label>
      </div>

      {/* 妊娠中の入力欄 */}
      {lifeStage.includes("pregnant") && (
        <>
          <label style={{ color: "#555", fontWeight: "500" }}>出産予定日：</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "6px",
              marginBottom: "20px",
              borderRadius: "8px",
              border: "1px solid #f8c8dc",
              backgroundColor: "#fff7fa",
            }}
          />
        </>
      )}

      {/* 育児中の入力欄 */}
      {lifeStage.includes("childcare") && (
        <>
          <label style={{ color: "#555", fontWeight: "500" }}>子どもの人数：</label>
          <input
            type="number"
            min="1"
            value={childCount}
            onChange={(e) => setChildCount(e.target.value)}
            placeholder="例：2"
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "6px",
              marginBottom: "20px",
              borderRadius: "8px",
              border: "1px solid #f8c8dc",
              backgroundColor: "#fff7fa",
            }}
          />
        </>
      )}

      {/* 現在地 */}
      <button
        onClick={getLocation}
        style={{
          backgroundColor: "#f8c8dc",
          color: "#333",
          border: "none",
          padding: "10px 18px",
          borderRadius: "8px",
          cursor: "pointer",
          marginRight: "10px",
          fontWeight: "500",
        }}
      >
        現在地を取得
      </button>

      {location.lat && (
        <p style={{ marginTop: "10px", color: "#666" }}>
          現在地: {location.lat}, {location.lng}
        </p>
      )}

      <br /><br />

      {/* 保存ボタン */}
      <button
        onClick={saveUser}
        style={{
          backgroundColor: "#f48fb1",
          color: "white",
          border: "none",
          padding: "10px 18px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "500",
          width: "100%",
        }}
      >
        保存してはじめる
      </button>
    </div>
  );
}

export default FirstLogin;
