import { BrowserRouter, Routes, Route } from "react-router-dom";
import FirstLogin from "./components/FirstLogin";
import MapView from "./MapView";
import Settings from "./components/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FirstLogin />} />
        <Route path="/home" element={<MapView />} />
        {/* ★ keyを付けて再マウントを強制 */}
        <Route path="/settings" element={<Settings key="settings-page" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
