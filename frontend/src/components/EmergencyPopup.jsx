import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

function EmergencyPopup() {
  const navigate = useNavigate();

  const openApp = () => {
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
      <img
        src={logo}
        alt="Boshevi ロゴ"
        style={{
          display: "block",
          margin: "0 auto 20px",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          objectFit: "contain",
        }}
      />

      <h2 style={{ color: "#d96c9f", marginBottom: "16px", fontWeight: "600" }}>
        Boshevi 緊急地震速報
      </h2>

      <p style={{ color: "#444", lineHeight: "1.6", marginBottom: "24px" }}>
        東京都で<strong>強い揺れが予想されています。</strong>
        <br />
        落ち着いて安全を確保してください。
        <br /><br />
        Boshevi は現在地に基づき
        <strong>母子向け避難所を案内します。</strong>
      </p>

      <button
        onClick={openApp}
        style={{
          backgroundColor: "#f48fb1",
          color: "white",
          border: "none",
          padding: "12px 20px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "600",
          width: "100%",
          marginBottom: "10px",
        }}
      >
        アプリを開く
      </button>

      <button
        onClick={() => navigate("/")}
        style={{
          backgroundColor: "#f8c8dc",
          color: "#333",
          border: "none",
          padding: "10px 18px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "500",
          width: "100%",
        }}
      >
        閉じる
      </button>
    </div>
  );
}

export default EmergencyPopup;
