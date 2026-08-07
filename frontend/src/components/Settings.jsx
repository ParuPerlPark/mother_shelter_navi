import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();

  // ★ lifeStage は配列 or 文字列の両方に対応させる
  let raw = localStorage.getItem("lifeStage");

  let storedStages;
  try {
    storedStages = JSON.parse(raw);   // ["pregnant", "childcare"]
  } catch {
    storedStages = raw ? [raw] : [];  // "pregnant" → ["pregnant"]
  }

  const [lifeStage, setLifeStage] = useState(storedStages);
  const [dueDate, setDueDate] = useState(localStorage.getItem("dueDate") || "");
  const [childCount, setChildCount] = useState(localStorage.getItem("childCount") || "");

  const [location, setLocation] = useState({
    lat: localStorage.getItem("userLat"),
    lng: localStorage.getItem("userLon"),
  });

  // ★ チェックボックスの切り替え
  const toggleStage = (stage) => {
    if (lifeStage.includes(stage)) {
      setLifeStage(lifeStage.filter((s) => s !== stage));
    } else {
      setLifeStage([...lifeStage, stage]);
    }
  };

  // ★ 切り替え時に不要な値をクリア
  useEffect(() => {
    if (!lifeStage.includes("pregnant")) setDueDate("");
    if (!lifeStage.includes("childcare")) setChildCount("");
  }, [lifeStage]);

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  };

  const saveSettings = () => {
    // ★ 配列として保存
    localStorage.setItem("lifeStage", JSON.stringify(lifeStage));
    localStorage.setItem("dueDate", dueDate);
    localStorage.setItem("childCount", childCount);
    localStorage.setItem("userLat", location.lat);
    localStorage.setItem("userLon", location.lng);

    alert("設定を保存しました");
    navigate("/home");
  };

  const goBack = () => navigate("/home");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom right, #fff0f5, #ffe4ec)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Noto Sans JP', sans-serif",
        color: "#333",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "30px 40px",
          borderRadius: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          width: "90%",
          maxWidth: "400px",
        }}
      >
        <h2 style={{ color: "#d96c9f", textAlign: "center" }}>設定</h2>

        {/* ライフステージ（複数選択） */}
        <label>ライフステージ：</label>

        <div style={{ marginTop: "10px" }}>
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

        <br />

        {/* 妊娠中の入力欄 */}
        {lifeStage.includes("pregnant") && (
          <div key="pregnant-block">
            <p style={{ fontWeight: "600", color: "#d96c9f" }}>妊娠中</p>
            <label>出産予定日：</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            />
          </div>
        )}

        {/* 育児中の入力欄 */}
        {lifeStage.includes("childcare") && (
          <div key="childcare-block" style={{ marginTop: "20px" }}>
            <p style={{ fontWeight: "600", color: "#d96c9f" }}>子育て中</p>
            <label>子どもの人数：</label>
            <input
              type="number"
              min="1"
              value={childCount}
              onChange={(e) => setChildCount(e.target.value)}
              placeholder="例：2"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            />
          </div>
        )}

        <br /><br />

        <button
          onClick={getLocation}
          style={{
            backgroundColor: "#f8c8dc",
            border: "none",
            padding: "10px 16px",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "500",
            width: "100%",
            marginBottom: "10px",
          }}
        >
          現在地を再取得
        </button>

        <button
          onClick={saveSettings}
          style={{
            backgroundColor: "#d96c9f",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "600",
            width: "100%",
            marginBottom: "10px",
          }}
        >
          保存して戻る
        </button>

        <button
          onClick={goBack}
          style={{
            backgroundColor: "#ccc",
            color: "#333",
            border: "none",
            padding: "10px 16px",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "500",
            width: "100%",
          }}
        >
          戻る
        </button>
      </div>
    </div>
  );
}
