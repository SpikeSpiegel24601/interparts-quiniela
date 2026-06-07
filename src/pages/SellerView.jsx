import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function SellerView() {
  const navigate = useNavigate()
  const [seller] = useState(() => JSON.parse(localStorage.getItem('seller') || '{}'))
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (localStorage.getItem('role') !== 'seller') { navigate('/'); return }
    loadClients()
  }, [])

  async function loadClients() {
    const { data } = await supabase
      .from('clients')
      .select('id, name, code, client_type, picks(is_correct)')
      .eq('seller_id', seller.id)

    const sorted = (data || []).map(c => ({
      ...c,
      points: (c.picks?.filter(p => p.is_correct).length || 0) * 10,
      total: c.picks?.length || 0,
    })).sort((a, b) => b.points - a.points)

    setClients(sorted)
    setLoading(false)
  }

  function logout() { localStorage.clear(); navigate('/') }

  const typeBadge = (type) => (
    <span style={{
      padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
      background: type === 'vip' ? '#ffd70022' : '#2a3a55',
      color: type === 'vip' ? '#ffd700' : '#8899bb'
    }}>
      {type === 'vip' ? '⭐ VIP' : 'Standard'}
    </span>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e' }}>
      <header style={{
        background: '#111827', borderBottom: '1px solid #2a3a55',
        padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: '22px' }}>QUINIELA INTERPARTS</div>
          <div style={{ fontSize: '13px', color: '#8899bb' }}>
            Vista Vendedor — <span style={{ color: '#f0f4ff', fontWeight: 600 }}>{seller.name}</span>
          </div>
        </div>
        <button onClick={logout} className="btn btn-ghost" style={{ fontSize: '13px' }}>Salir</button>
      </header>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>MIS CLIENTES</h1>
        <p style={{ color: '#8899bb', marginBottom: '24px' }}>
          {clients.length} clientes asignados
        </p>

        {loading ? (
          <p style={{ color: '#8899bb' }}>Cargando...</p>
        ) : clients.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
            <p style={{ color: '#8899bb' }}>No tienes clientes asignados aún.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {clients.map((c, i) => (
              <div key={c.id} className="card" style={{
                display: 'flex', alignItems: 'center', gap: '16px', padding: '16px'
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: '#e8281e22', border: '1px solid #e8281e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Bebas Neue', fontSize: '16px', color: '#e8281e', flexShrink: 0
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                    {typeBadge(c.client_type)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8899bb' }}>
                    Código: <span style={{ fontFamily: 'monospace', color: '#e8281e' }}>{c.code}</span>
                    {' · '}{c.total} picks
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: '32px', color: '#ffd700', lineHeight: 1 }}>
                    {c.points}
                  </div>
                  <div style={{ fontSize: '11px', color: '#4a5a7a' }}>puntos</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
