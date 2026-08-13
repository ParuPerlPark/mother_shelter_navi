import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import FirstLogin from "./components/FirstLogin";
import MapView from "./MapView";
import Settings from "./components/Settings";
import EmergencyPopup from "./components/EmergencyPopup";  // ★ 追加

function App() {
  const isLoggedIn = !!localStorage.getItem("userId");

  /* ---------------------------------------------------------
     ★ 通知から自動で /emergency に遷移させたい場合（後で使う）
     ---------------------------------------------------------
     Service Worker → クライアント側へメッセージ送信
     例：event.data = { type: "EARTHQUAKE_ALERT" }

     下記コードを main.jsx に入れてもOKだし、
     App.js に入れても動く（ただし navigate が使えないので window.location を使う）
  --------------------------------------------------------- */

  /*
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        console.log("SW からのメッセージ:", event.data);

        if (event.data?.type === "EARTHQUAKE_ALERT") {
          // ★ 緊急地震速報を受信したら /emergency に遷移
          window.location.href = "/emergency";
        }
      });
    }
  }, []);
  */

  /* --------------------------------------------------------- */

  return (
    <BrowserRouter>
      <Routes>
        {/* トップページ：ログイン済みなら /home へ */}
        <Route
          path="/"
          element={
            isLoggedIn ? <Navigate to="/home" replace /> : <FirstLogin />
          }
        />

        {/* ホーム：ログイン済みならマップ、未ログインなら初回設定へ */}
        <Route
          path="/home"
          element={
            isLoggedIn ? <MapView /> : <Navigate to="/" replace />
          }
        />

        {/* 設定ページ */}
        <Route
          path="/settings"
          element={
            isLoggedIn ? <Settings key="settings-page" /> : <Navigate to="/" replace />
          }
        />

        {/* ★ 緊急地震速報ポップアップ（ログイン状態に関係なく表示可能） */}
        <Route
          path="/emergency"
          element={<EmergencyPopup />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
