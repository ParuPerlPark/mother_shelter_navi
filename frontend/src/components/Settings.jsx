import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();

  // lifeStage 読み込み
  let raw = localStorage.getItem("lifeStage");
  let storedStages;
  try {
    storedStages = JSON.parse(raw);
  } catch {
    storedStages = raw ? [raw] : [];
  }

  const [lifeStage, setLifeStage] = useState(storedStages);
  const [dueDate, setDueDate] = useState(localStorage.getItem("dueDate") || "");
  const [childCount, setChildCount] = useState(localStorage.getItem("childCount") || "");

  const [location, setLocation] = useState({
    lat: localStorage.getItem("userLat"),
    lng: localStorage.getItem("userLon"),
  });

  // 保存済み避難所（安全に読み込む）
  const [savedShelters, setSavedShelters] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("savedShelters");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setSavedShelters(parsed);
      } else {
        setSavedShelters([]);
      }
    } catch {
      setSavedShelters([]);
    }
  }, []);

  const [openIndex, setOpenIndex] = useState(null);
  const [openStock, setOpenStock] = useState(false);

  // ★ 大項目（固定）＋小項目（追加可能）
  const defaultStockGroups = [
    {
      category: "食品・飲料",
      items: [
        { label: "粉ミルク", key: "milk" },
        { label: "離乳食（レトルト）", key: "babyFood" },
        { label: "ベビー用飲料水", key: "water" },
      ],
    },
    {
      category: "おむつ・衛生",
      items: [
        { label: "おむつ", key: "diaper" },
        { label: "おしりふき", key: "wipes" },
        { label: "消毒用品", key: "sanitizer" },
      ],
    },
    {
      category: "衣類・保湿",
      items: [
        { label: "肌着", key: "clothes" },
        { label: "ブランケット", key: "blanket" },
        { label: "保湿クリーム", key: "cream" },
      ],
    },
    {
      category: "医療・ケア",
      items: [
        { label: "母子手帳", key: "maternityBook" },
        { label: "乳児用解熱剤", key: "medicine" },
        { label: "綿棒", key: "cottonSwab" },
      ],
    },
    {
      category: "妊娠中の方向け",
      items: [
        { label: "マタニティ飲料", key: "maternityDrink" },
        { label: "栄養補助食品", key: "supplement" },
        { label: "防寒具", key: "warmClothes" },
      ],
    },
  ];

  const [stockGroups, setStockGroups] = useState(
    JSON.parse(localStorage.getItem("stockGroups") || "null") || defaultStockGroups
  );

  const toggleStage = (stage) => {
    if (lifeStage.includes(stage)) {
      setLifeStage(lifeStage.filter((s) => s !== stage));
    } else {
      setLifeStage([...lifeStage, stage]);
    }
  };

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
    localStorage.setItem("lifeStage", JSON.stringify(lifeStage));
    localStorage.setItem("dueDate", dueDate);
    localStorage.setItem("childCount", childCount);
    localStorage.setItem("userLat", location.lat);
    localStorage.setItem("userLon", location.lng);
    localStorage.setItem("stockGroups", JSON.stringify(stockGroups));

    alert("設定を保存しました");
    navigate("/home");
  };

  const deleteSavedShelter = (index) => {
    const updated = savedShelters.filter((_, i) => i !== index);
    setSavedShelters(updated);
    localStorage.setItem("savedShelters", JSON.stringify(updated));
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

        {/* ライフステージ */}
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

        {/* 妊娠中 */}
        {lifeStage.includes("pregnant") && (
          <div style={{ marginTop: "20px" }}>
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

        {/* 育児中 */}
        {lifeStage.includes("childcare") && (
          <div style={{ marginTop: "20px" }}>
            <p style={{ fontWeight: "600", color: "#d96c9f" }}>子育て中</p>
            <label>子どもの人数：</label>
            <input
              type="number"
              min="1"
              value={childCount}
              onChange={(e) => setChildCount(e.target.value)}
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

        {/* 保存済み避難所 */}
        <h3 style={{ marginTop: "30px", color: "#d96c9f" }}>保存済み避難所</h3>

        {savedShelters.length === 0 && (
          <p style={{ color: "#666" }}>まだ保存された避難所はありません</p>
        )}

        {savedShelters.map((item, idx) => (
          <div
            key={idx}
            style={{
              border: "1px solid #eee",
              borderRadius: "8px",
              marginBottom: "10px",
              padding: "10px",
            }}
          >
            <strong>{item.name}</strong>
            <p style={{ margin: "6px 0" }}>
              緯度: {item.lat}
              <br />
              経度: {item.lon}
            </p>

            {/* ★ Top3避難所名＋案内開始ボタン */}
            {item.topShelters && item.topShelters.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <p style={{ fontWeight: "600", color: "#d96c9f" }}>おすすめ避難所Top3</p>
                <ul style={{ margin: "4px 0 0 16px", color: "#333" }}>
                  {item.topShelters.map((s, i) => (
                    <li key={i} style={{ marginBottom: "6px" }}>
                      {s}
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${item.lat},${item.lon}&destination=${encodeURIComponent(
                          s
                        )}&travelmode=walking`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          marginLeft: "10px",
                          backgroundColor: "#f48fb1",
                          color: "white",
                          borderRadius: "6px",
                          padding: "4px 8px",
                          textDecoration: "none",
                          fontSize: "12px",
                        }}
                      >
                        🚶‍♀️ 案内開始
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => deleteSavedShelter(idx)}
              style={{
                backgroundColor: "#f48fb1",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: "8px",
                cursor: "pointer",
                marginTop: "10px",
              }}
            >
              削除
            </button>
          </div>
        ))}
        <br />

        {/* 備蓄状況 */}
        <h3 style={{ marginTop: "30px", color: "#d96c9f" }}>備蓄状況</h3>

        <div
          style={{
            border: "1px solid #eee",
            borderRadius: "8px",
            marginBottom: "10px",
            padding: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <strong>備蓄状況</strong>
            <button
              onClick={() => setOpenStock(!openStock)}
              style={{
                backgroundColor: "#f8c8dc",
                border: "none",
                borderRadius: "8px",
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              {openStock ? "閉じる" : "開く"}
            </button>
          </div>

          {openStock && (
            <div style={{ marginTop: "10px" }}>
              {stockGroups.map((group, idx) => (
                <div
                  key={idx}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: "8px",
                    marginBottom: "10px",
                    padding: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <strong>{group.category}</strong>
                    <button
                      onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                      style={{
                        backgroundColor: "#f8c8dc",
                        border: "none",
                        borderRadius: "8px",
                        padding: "6px 12px",
                        cursor: "pointer",
                      }}
                    >
                      {openIndex === idx ? "閉じる" : "開く"}
                    </button>
                  </div>

                  {openIndex === idx && (
                    <div style={{ marginTop: "10px" }}>
                      {group.items.map((item) => (
                        <div
                          key={item.key}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                            gap: "8px",
                          }}
                        >
                          <label style={{ flex: "1" }}>
                            <input
                              type="checkbox"
                              checked={localStorage.getItem(item.key) === "true"}
                              onChange={(e) =>
                                localStorage.setItem(item.key, e.target.checked ? "true" : "false")
                              }
                            />{" "}
                            {item.label}
                          </label>

                          <input
                            type="number"
                            min="0"
                            placeholder="個数"
                            defaultValue={localStorage.getItem(`${item.key}_count`) || ""}
                            onChange={(e) =>
                              localStorage.setItem(`${item.key}_count`, e.target.value)
                            }
                            style={{
                              width: "60px",
                              borderRadius: "6px",
                              border: "1px solid #ccc",
                              padding: "4px",
                              textAlign: "center",
                            }}
                          />

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                            }}
                          >
                            <span style={{ fontSize: "12px", color: "#666" }}>賞味期限</span>
                            <input
                              type="date"
                              defaultValue={localStorage.getItem(`${item.key}_date`) || ""}
                              onChange={(e) =>
                                localStorage.setItem(`${item.key}_date`, e.target.value)
                              }
                              style={{
                                borderRadius: "6px",
                                border: "1px solid #ccc",
                                padding: "4px",
                              }}
                            />
                          </div>

                          <button
                            onClick={() => {
                              const updatedItems = group.items.filter((x) => x.key !== item.key);
                              const updatedGroups = stockGroups.map((g, i) =>
                                i === idx ? { ...g, items: updatedItems } : g
                              );

                              setStockGroups(updatedGroups);
                              localStorage.setItem("stockGroups", JSON.stringify(updatedGroups));

                              localStorage.removeItem(item.key);
                              localStorage.removeItem(`${item.key}_count`);
                              localStorage.removeItem(`${item.key}_date`);
                            }}
                            style={{
                              backgroundColor: "#ccc",
                              color: "#333",
                              border: "none",
                              borderRadius: "6px",
                              padding: "4px 8px",
                              cursor: "pointer",
                            }}
                          >
                            削除
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          const name = prompt("追加する項目名を入力してください");
                          if (!name) return;

                          const newKey = `${group.category}_${Date.now()}`;

                          const updatedItems = [...group.items, { label: name, key: newKey }];
                          const updatedGroups = stockGroups.map((g, i) =>
                            i === idx ? { ...g, items: updatedItems } : g
                          );

                          setStockGroups(updatedGroups);
                          localStorage.setItem("stockGroups", JSON.stringify(updatedGroups));
                        }}
                        style={{
                          marginTop: "10px",
                          backgroundColor: "#f48fb1",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          padding: "6px 12px",
                          cursor: "pointer",
                          width: "100%",
                        }}
                      >
                        ＋ 項目を追加
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

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
