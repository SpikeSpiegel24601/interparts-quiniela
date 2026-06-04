import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { getPrize, PRIZES } from '../../lib/helpers.js'

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
      points: c.picks?.filter(p => p.is_correct).length || 0,
      total: c.picks?.length || 0,
    })).sort((a, b) => b.points - a.points || b.total - a.total)

    setLeaderboard(board)
    setLoading(false)
  }

  const myPos = leaderboard.findIndex(c => c.id === client.id) + 1
  const myData = leaderboard.find(c => c.id === client.id)

  return (
    <div>
      <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>TABLA DE POSICIONES</h1>
      <p style={{ color: '#8899bb', marginBottom: '24px' }}>
        {leaderboard.length} participantes · Actualizado en tiempo real
      </p>

      {/* My position */}
      {myData && (
        <div className="card" style={{
          marginBottom: '24px', borderColor: '#e8281e',
          background: 'linear-gradient(135deg, #1a0808 0%, #1a2235 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#8899bb', marginBottom: '4px' }}>TU POSICIÓN</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: '48px', color: '#e8281e', lineHeight: 1 }}>
                #{myPos}
              </div>
              <div style={{ color: '#8899bb', fontSize: '13px' }}>de {leaderboard.length} participantes</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: '48px', color: '#ffd700', lineHeight: 1 }}>
                {myData.points}
              </div>
              <div style={{ color: '#8899bb', fontSize: '13px' }}>puntos</div>
            </div>
          </div>
        </div>
      )}

      {/* Prize tiers */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>PREMIOS</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {PRIZES.map(p => {
            const myPoints = myData?.points || 0
            const achieved = myPoints >= p.min
            return (
              <div key={p.min} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: '8px',
                background: achieved ? p.color + '22' : '#0a0f1e',
                border: `1px solid ${achieved ? p.color : '#2a3a55'}`
              }}>
                <span style={{ fontSize: '15px' }}>{p.emoji} {p.label}</span>
                <span style={{
                  fontSize: '13px', fontWeight: 700,
                  color: achieved ? p.color : '#4a5a7a'
                }}>
                  {p.max === 999 ? `${p.min}+` : `${p.min}–${p.max}`} pts
                  {achieved && ' ✓'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card">
        {loading ? (
          <p style={{ color: '#8899bb' }}>Cargando ranking...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {leaderboard.map((c, i) => {
              const isMe = c.id === client.id
              const prize = getPrize(c.points)
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null

              return (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', borderRadius: '8px',
                  background: isMe ? '#e8281e22' : '#0a0f1e',
                  border: `1px solid ${isMe ? '#e8281e' : '#2a3a55'}`
                }}>
                  <div style={{
                    width: '32px', textAlign: 'center',
                    fontFamily: 'Bebas Neue', fontSize: '20px',
                    color: i < 3 ? '#ffd700' : '#4a5a7a'
                  }}>
                    {medal || (i + 1)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: isMe ? 700 : 500, fontSize: '14px' }}>
                      {c.name} {isMe && <span style={{ color: '#e8281e', fontSize: '11px' }}>(tú)</span>}
                    </div>
                    {prize && <div style={{ fontSize: '11px', color: prize.color }}>{prize.emoji} {prize.label}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: '24px', color: '#ffd700' }}>{c.points}</div>
                    <div style={{ fontSize: '11px', color: '#4a5a7a' }}>{c.total} picks</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
