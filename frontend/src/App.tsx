import { Routes, Route } from "react-router-dom"
import LoginPage from "@/pages/LoginPage"
import PlayerPage from "@/pages/PlayerPage"
import AdminLoginPage from "@/pages/AdminLoginPage"
import AdminPage from "@/pages/AdminPage"
import TimesPage from "@/pages/TimesPage"

export default function App() {
  return (
    <div className="min-h-screen bg-bg-base">
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/jogador" element={<PlayerPage />} />
        <Route path="/times" element={<TimesPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/painel" element={<AdminPage />} />
      </Routes>
    </div>
  )
}
