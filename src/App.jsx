import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminMatches from './pages/admin/AdminMatches.jsx'
import AdminClients from './pages/admin/AdminClients.jsx'
import AdminSellers from './pages/admin/AdminSellers.jsx'
import ClientLayout from './pages/client/ClientLayout.jsx'
import ClientHome from './pages/client/ClientHome.jsx'
import ClientRanking from './pages/client/ClientRanking.jsx'
import SellerView from './pages/SellerView.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="partidos" element={<AdminMatches />} />
        <Route path="clientes" element={<AdminClients />} />
        <Route path="vendedores" element={<AdminSellers />} />
      </Route>
      <Route path="/cliente" element={<ClientLayout />}>
        <Route index element={<ClientHome />} />
        <Route path="ranking" element={<ClientRanking />} />
      </Route>
      <Route path="/vendedor" element={<SellerView />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
