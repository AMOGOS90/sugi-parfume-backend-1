import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Navbar from "./components/Navbar"
import FragranceBuilder from "./pages/FragranceBuilder"
import AdminDashboard from "./pages/AdminDashboard"
import Recommendations from "./pages/Recommendations"
import Subscription from "./pages/Subscription"

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/builder" element={<FragranceBuilder />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/subscription" element={<Subscription />} />
        {/* Tambahkan halaman lain seperti Detail Produk, Keranjang, dll */}
      </Routes>
    </Router>
  )
}

export default App
