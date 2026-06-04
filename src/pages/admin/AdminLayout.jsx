import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function AdminLayout() {
  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('role') !== 'admin') navigate('/')
  }, [])

  function logout() {
    localStorage.clear()
    navigate('/')
  }

  const linkStyle = ({ isActive }) => ({
    display: 'block', padding: '10px 16px', borderRadius: '8px',
    textDecoration: 'none', fontSize: '14px', fontWeight: 500,
    color: isActive ? '#f0f4ff' : '#8899bb',
    background: isActive ? '#e8281e22' : 'transparent',
    borderLeft: isActive ? '3px solid #e8281e' : '3px solid transparent',
    transition: 'all 0.15s'
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px', background: '#111827', borderRight: '1px solid #2a3a55',
        display: 'flex', flexDirection: 'column', padding: '24px 16px', flexShrink: 0
      }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '10px', color: '#e8281e', fontWeight: 700,
            letterSpacing: '0.15em', marginBottom: '4px' }}>INTERPARTS</div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: '22px', letterSpacing: '0.05em' }}>
            QUINIELA ADMIN
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <NavLink to="/admin" end style={linkStyle}>📊 Dashboard</NavLink>
          <NavLink to="/admin/partidos" style={linkStyle}>⚽ Partidos</NavLink>
          <NavLink to="/admin/clientes" style={linkStyle}>👥 Clientes</NavLink>
          <NavLink to="/admin/vendedores" style={linkStyle}>🤝 Vendedores</NavLink>
        </nav>

        <button onClick={logout} className="btn btn-ghost"
          style={{ width: '100%', fontSize: '13px' }}>
          Cerrar sesión
        </button>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
