import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function ClientLayout() {
  const navigate = useNavigate()
  const [client, setClient] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('client')
    if (!stored || localStorage.getItem('role') !== 'client') {
      navigate('/')
      return
    }
    setClient(JSON.parse(stored))
  }, [])

  function logout() {
    localStorage.clear()
    navigate('/')
  }

  const linkStyle = ({ isActive }) => ({
    textDecoration: 'none', padding: '8px 16px', borderRadius: '8px',
    fontSize: '14px', fontWeight: 500,
    color: isActive ? 'white' : '#8899bb',
    background: isActive ? '#e8281e' : 'transparent',
    transition: 'all 0.15s'
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: '#111827', borderBottom: '1px solid #2a3a55',
        padding: '12px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '24px' }}>⚽</span>
          <div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: '18px', letterSpacing: '0.05em' }}>
              QUINIELA INTERPARTS
            </div>
            {client && (
              <div style={{ fontSize: '12px', color: '#8899bb' }}>
                Hola, <span style={{ color: '#f0f4ff', fontWeight: 600 }}>{client.name}</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <NavLink to="/cliente" end style={linkStyle}>🎯 Mis picks</NavLink>
          <NavLink to="/cliente/ranking" style={linkStyle}>🏆 Ranking</NavLink>
          <button onClick={logout} className="btn btn-ghost"
            style={{ padding: '8px 12px', fontSize: '13px' }}>Salir</button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '24px 20px', maxWidth: '680px', margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>
    </div>
  )
}
