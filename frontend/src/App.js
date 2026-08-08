import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import FirstLogin from "./components/FirstLogin";
import MapView from "./MapView";
import Settings from "./components/Settings";

function App() {
  const isLoggedIn = !!localStorage.getItem("userId");

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
