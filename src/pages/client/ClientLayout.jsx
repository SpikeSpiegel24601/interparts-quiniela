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
    textDecoration: 'none', padding: '6px 12px', borderRadius: '8px',
    fontSize: '13px', fontWeight: 600,
    color: isActive ? 'white' : '#8899bb',
    background: isActive ? '#e8281e' : 'transparent',
    transition: 'all 0.15s', whiteSpace: 'nowrap'
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: '#111827', borderBottom: '1px solid #2a3a55',
        padding: '10px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10
      }}>
        {/* Left: logo + nombre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>⚽</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: '15px', letterSpacing: '0.05em', lineHeight: 1 }}>
              QUINIELA INTERPARTS
            </div>
            {client && (
              <div style={{ fontSize: '11px', color: '#8899bb', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                {client.nombre_participante || client.name}
              </div>
            )}
          </div>
        </div>

        {/* Right: nav + salir */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <NavLink to="/cliente" end style={linkStyle}>⚽ Juegos</NavLink>
          <NavLink to="/cliente/ranking" style={linkStyle}>🏆 Ranking</NavLink>
          <button onClick={logout} style={{
            background: 'none', border: '1px solid #2a3a55', color: '#8899bb',
            borderRadius: '8px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer'
          }}>Salir</button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '16px', maxWidth: '680px', margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>
    </div>
  )
}
