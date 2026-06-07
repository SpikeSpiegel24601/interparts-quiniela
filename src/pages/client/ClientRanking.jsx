import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'

const LEGENDS = [
  { name: 'El Kaiser', emoji: '👑' },
  { name: 'La Pulga', emoji: '⚡' },
  { name: 'El Fenómeno', emoji: '🔥' },
  { name: 'El Pibe', emoji: '🎨' },
  { name: 'La Joya', emoji: '💎' },
  { name: 'El Toro', emoji: '🐂' },
  { name: 'El Buitre', emoji: '🦅' },
  { name: 'El Matador', emoji: '⚔️' },
  { name: 'La Araña', emoji: '🕷️' },
  { name: 'El Mago', emoji: '🪄' },
  { name: 'El Escorpión', emoji: '🦂' },
  { name: 'El Halcón', emoji: '🦅' },
  { name: 'El Pistolero', emoji: '🎯' },
  { name: 'La Bestia', emoji: '💪' },
  { name: 'El Cañón', emoji: '💥' },
  { name: 'El Tigre', emoji: '🐯' },
  { name: 'La Máquina', emoji: '⚙️' },
  { name: 'El Monstruo', emoji: '👹' },
  { name: 'El Cohete', emoji: '🚀' },
  { name: 'La Cobra', emoji: '🐍' },
  { name: 'El Gladiador', emoji: '🛡️' },
  { name: 'La Pantera', emoji: '🐆' },
  { name: 'El Gigante', emoji: '🗿' },
  { name: 'La Flecha', emoji: '🏹' },
  { name: 'El Volcán', emoji: '🌋' },
  { name: 'El Trueno', emoji: '⛈️' },
  { name: 'La Leyenda', emoji: '🏆' },
  { name: 'El Coloso', emoji: '🗽' },
  { name: 'El Rayo', emoji: '⚡' },
  { name: 'El Ciclón', emoji: '🌪️' },
]

export default function ClientRanking() {
  const [client] = useState(() => JSON.parse(localStorage.getItem('client') || '{}'))
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadRanking() }, [])

  async function loadRanking() {
    const { data } = await supabase
      .from('clients')
      .select('id, name, picks(is_correct)')
    const board = (data || []).map(c => ({
      ...c,
      points: (c.picks?.filter(p => p.is_correct).length || 0) * 10,
      total: c.picks?.length || 0,
    })).sort((a, b) => b.points - a.points || b.total - a.total)
    setLeaderboard(board)
    setLoading(false)
  }

  const myPos = leaderboard.findIndex(c => c.id === client.id)
  const myData = leaderboard[myPos]

  function getLegend(index) {
    return LEGENDS[index % LEGENDS.length]
  }

  const top10 = leaderboard.slice(0, 10)
  const myInTop10 = myPos < 10

  return (
    <div>
      <h1 style={{ fontSize: '36px', marginBottom: '32px' }}>TABLA DE POSICIONES</h1>

      {myData && (
        <div className="card" style={{
          marginBottom: '24px', borderColor: '#e8281e',
          background: 'linear-gradient(135deg, #1a0808 0%, #1a2235 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#8899bb', marginBottom: '4px' }}>TU POSICIÓN</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: '56px', color: '#e8281e', lineHeight: 1 }}>
                #{myPos + 1}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px' }}>{getLegend(myPos).emoji}</div>
              <div style={{ fontSize: '13px', color: '#f0f4ff', fontWeight: 600 }}>{getLegend(myPos).name}</div>
              <div style={{ fontSize: '11px', color: '#8899bb' }}>tu apodo</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: '56px', color: '#ffd700', lineHeight: 1 }}>
                {myData.points}
              </div>
              <div style={{ color: '#8899bb', fontSize: '13px' }}>puntos</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '24px' }}>🏆 TOP RANKING</h3>
          <span style={{ fontSize: '12px', color: '#8899bb' }}>los 10 mejores</span>
        </div>
        {loading ? (
          <p style={{ color: '#8899bb' }}>Cargando...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {top10.map((c, i) => {
              const isMe = c.id === client.id
              const legend = getLegend(i)
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
              return (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', borderRadius: '8px',
                  background: isMe ? '#e8281e22' : '#0a0f1e',
                  border: `1px solid ${isMe ? '#e8281e' : '#2a3a55'}`
                }}>
                  <div style={{ width: '32px', textAlign: 'center',
                    fontFamily: 'Bebas Neue', fontSize: '20px',
                    color: i < 3 ? '#ffd700' : '#4a5a7a' }}>
                    {medal || (i + 1)}
                  </div>
                  <div style={{ fontSize: '24px' }}>{legend.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: isMe ? 700 : 500, fontSize: '14px' }}>
                      {legend.name}
                      {isMe && <span style={{ color: '#e8281e', fontSize: '11px', marginLeft: '8px' }}>← eres tú</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: '#4a5a7a' }}>{c.total} picks realizados</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: '24px', color: '#ffd700' }}>{c.points}</div>
                    <div style={{ fontSize: '11px', color: '#4a5a7a' }}>pts</div>
                  </div>
                </div>
              )
            })}

            {!myInTop10 && myData && (
              <>
                <div style={{ textAlign: 'center', color: '#4a5a7a', fontSize: '13px', padding: '4px' }}>• • •</div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', borderRadius: '8px',
                  background: '#e8281e22', border: '1px solid #e8281e'
                }}>
                  <div style={{ width: '32px', textAlign: 'center',
                    fontFamily: 'Bebas Neue', fontSize: '20px', color: '#4a5a7a' }}>
                    {myPos + 1}
                  </div>
                  <div style={{ fontSize: '24px' }}>{getLegend(myPos).emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>
                      {getLegend(myPos).name}
                      <span style={{ color: '#e8281e', fontSize: '11px', marginLeft: '8px' }}>← eres tú</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#4a5a7a' }}>{myData.total} picks realizados</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: '24px', color: '#ffd700' }}>{myData.points}</div>
                    <div style={{ fontSize: '11px', color: '#4a5a7a' }}>pts</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
