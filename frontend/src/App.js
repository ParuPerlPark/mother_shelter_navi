import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import FirstLogin from "./components/FirstLogin";
import MapView from "./MapView";
import Settings from "./components/Settings";
import EmergencyPopup from "./components/EmergencyPopup";

function AppRoutes() {
  // navigate() によるURL変更を検知して再レンダリングする
  const location = useLocation();

  // URLが変わるたびに最新のlocalStorageを確認
  const isLoggedIn = !!localStorage.getItem("userId");

  console.log("現在のURL:", location.pathname);
  console.log("userId:", localStorage.getItem("userId"));
  console.log("isLoggedIn:", isLoggedIn);

  return (
    <Routes>
      {/* トップページ */}
      <Route
        path="/"
        element={
          isLoggedIn ? (
            <Navigate to="/home" replace />
          ) : (
            <FirstLogin />
          )
        }
      />

      {/* ホーム */}
      <Route
        path="/home"
        element={
          isLoggedIn ? (
            <MapView />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* 設定 */}
      <Route
        path="/settings"
        element={
          isLoggedIn ? (
            <Settings key="settings-page" />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* 緊急地震速報 */}
      <Route
        path="/emergency"
        element={<EmergencyPopup />}
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;