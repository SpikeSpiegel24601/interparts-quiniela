import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { getPrize } from '../../lib/helpers.js'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ clients: 0, matches: 0, picks: 0, pending: 0 })
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [{ count: clients }, { count: matches }, { count: picks }, { data: lb }] = await Promise.all([
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('picks').select('*', { count: 'exact', head: true }),
      supabase.from('clients').select(`
        id, name, code,
        picks(is_correct)
      `)
    ])

    const board = (lb || []).map(c => ({
      ...c,
      points: c.picks?.filter(p => p.is_correct).length || 0,
      total: c.picks?.length || 0,
    })).sort((a, b) => b.points - a.points)

    setStats({ clients: clients || 0, matches: matches || 0, picks: picks || 0 })
    setLeaderboard(board)
    setLoading(false)
  }

  const statCard = (label, value, emoji) => (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{emoji}</div>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: '40px', color: '#e8281e' }}>{value}</div>
      <div style={{ color: '#8899bb', fontSize: '13px' }}>{label}</div>
    </div>
  )

  return (
    <div>
      <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>DASHBOARD</h1>
      <p style={{ color: '#8899bb', marginBottom: '32px' }}>Resumen general de la quiniela</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {statCard('Clientes registrados', stats.clients, '👥')}
        {statCard('Partidos cargados', stats.matches, '⚽')}
        {statCard('Picks realizados', stats.picks, '🎯')}
      </div>

      <div className="card">
        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>TABLA DE POSICIONES</h2>
        {loading ? (
          <p style={{ color: '#8899bb' }}>Cargando...</p>
        ) : leaderboard.length === 0 ? (
          <p style={{ color: '#8899bb' }}>Aún no hay picks registrados.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a3a55' }}>
                {['#', 'Cliente', 'Código', 'Puntos', 'Picks', 'Premio'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left',
                    color: '#8899bb', fontSize: '12px', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((c, i) => {
                const prize = getPrize(c.points)
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #1a2235' }}>
                    <td style={{ padding: '12px', fontFamily: 'Bebas Neue',
                      fontSize: '20px', color: i < 3 ? '#ffd700' : '#8899bb' }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '12px', color: '#8899bb', fontFamily: 'monospace' }}>{c.code}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontFamily: 'Bebas Neue', fontSize: '22px', color: '#e8281e' }}>
                        {c.points}
                      </span>
                      <span style={{ color: '#8899bb', fontSize: '12px' }}> / {c.total}</span>
                    </td>
                    <td style={{ padding: '12px', color: '#8899bb' }}>{c.total}</td>
                    <td style={{ padding: '12px' }}>
                      {prize ? (
                        <span style={{ fontSize: '13px' }}>{prize.emoji} {prize.label}</span>
                      ) : (
                        <span style={{ color: '#4a5a7a', fontSize: '13px' }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
