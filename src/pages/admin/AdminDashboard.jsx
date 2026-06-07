import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { getPrize, formatDate } from '../../lib/helpers.js'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ clients: 0, matches: 0, picks: 0 })
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null) // cliente seleccionado
  const [clientPicks, setClientPicks] = useState([])
  const [loadingPicks, setLoadingPicks] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(null) // pick a resetear
  const [adminPass, setAdminPass] = useState('')
  const [resetMsg, setResetMsg] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [{ count: clients }, { count: matches }, { count: picks }, { data: lb }] = await Promise.all([
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('picks').select('*', { count: 'exact', head: true }),
      supabase.from('clients').select('id, name, code, client_type, picks(is_correct)')
    ])

    const board = (lb || []).map(c => ({
      ...c,
      points: (c.picks?.filter(p => p.is_correct).length || 0) * 10,
      total: c.picks?.length || 0,
    })).sort((a, b) => b.points - a.points)

    setStats({ clients: clients || 0, matches: matches || 0, picks: picks || 0 })
    setLeaderboard(board)
    setLoading(false)
  }

  async function loadClientPicks(client) {
    setSelected(client)
    setLoadingPicks(true)
    setClientPicks([])
    setResetMsg('')

    const { data } = await supabase
      .from('picks')
      .select('*, matches(home_team, away_team, result, home_score, away_score, match_date, stage, group_name)')
      .eq('client_id', client.id)
      .order('created_at')

    setClientPicks(data || [])
    setLoadingPicks(false)
  }

  async function resetPick() {
    if (adminPass.toUpperCase() !== import.meta.env.VITE_ADMIN_PASSWORD?.toUpperCase()) {
      setResetMsg('❌ Contraseña incorrecta')
      return
    }
    const { error } = await supabase.from('picks').delete().eq('id', resetConfirm.id)
    if (error) {
      setResetMsg('❌ Error al resetear')
    } else {
      setResetMsg('✅ Pick reseteado correctamente')
      setResetConfirm(null)
      setAdminPass('')
      loadClientPicks(selected)
      loadData()
    }
  }

  const pickLabel = (pick, m) => {
    if (pick === 'home') return m.home_team
    if (pick === 'away') return m.away_team
    return 'Empate'
  }

  const typeBadge = (type) => (
    <span style={{
      padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
      background: type === 'vip' ? '#ffd70022' : '#2a3a55',
      color: type === 'vip' ? '#ffd700' : '#8899bb'
    }}>
      {type === 'vip' ? '⭐ VIP' : 'Standard'}
    </span>
  )

  const statCard = (label, value, emoji) => (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{emoji}</div>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: '40px', color: '#e8281e' }}>{value}</div>
      <div style={{ color: '#8899bb', fontSize: '13px' }}>{label}</div>
    </div>
  )

  return (
    <div>
      {/* Reset confirmation modal */}
      {resetConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
            <h3 style={{ fontSize: '22px', marginBottom: '12px' }}>⚠️ ¿Estás seguro?</h3>
            <p style={{ color: '#8899bb', fontSize: '14px', marginBottom: '8px', lineHeight: 1.5 }}>
              Vas a resetear el pick de <strong style={{ color: '#f0f4ff' }}>{selected?.name}</strong> en el partido:
            </p>
            <p style={{ color: '#ffd700', fontSize: '14px', marginBottom: '16px', fontWeight: 600 }}>
              {resetConfirm.matches?.home_team} vs {resetConfirm.matches?.away_team}
            </p>
            <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>
              El cliente podrá volver a elegir. Esta acción no se puede deshacer.
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#8899bb', marginBottom: '6px', display: 'block' }}>
                Ingresa tu contraseña de admin para confirmar:
              </label>
              <input
                type="password"
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                placeholder="Contraseña admin"
                autoFocus
              />
            </div>
            {resetMsg && <p style={{ color: resetMsg.includes('✅') ? '#22c55e' : '#ef4444', fontSize: '13px', marginBottom: '12px' }}>{resetMsg}</p>}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-ghost" onClick={() => { setResetConfirm(null); setAdminPass(''); setResetMsg('') }}
                style={{ flex: 1 }}>Cancelar</button>
              <button className="btn btn-primary" onClick={resetPick}
                style={{ flex: 1, background: '#ef4444' }}>Resetear pick</button>
            </div>
          </div>
        </div>
      )}

      <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>DASHBOARD</h1>
      <p style={{ color: '#8899bb', marginBottom: '32px' }}>Resumen general de la quiniela</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {statCard('Clientes registrados', stats.clients, '👥')}
        {statCard('Partidos cargados', stats.matches, '⚽')}
        {statCard('Picks realizados', stats.picks, '🎯')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '24px' }}>
        {/* Leaderboard */}
        <div className="card">
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>TABLA DE POSICIONES</h2>
          <p style={{ color: '#8899bb', fontSize: '12px', marginBottom: '16px' }}>
            Click en un cliente para ver sus picks
          </p>
          {loading ? (
            <p style={{ color: '#8899bb' }}>Cargando...</p>
          ) : leaderboard.length === 0 ? (
            <p style={{ color: '#8899bb' }}>Aún no hay picks registrados.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {leaderboard.map((c, i) => {
                const prize = getPrize(c.points)
                const isSelected = selected?.id === c.id
                return (
                  <div key={c.id}
                    onClick={() => loadClientPicks(c)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 14px', borderRadius: '8px', cursor: 'pointer',
                      background: isSelected ? '#e8281e22' : '#0a0f1e',
                      border: `1px solid ${isSelected ? '#e8281e' : '#2a3a55'}`,
                      transition: 'all 0.15s'
                    }}>
                    <div style={{
                      width: '28px', textAlign: 'center',
                      fontFamily: 'Bebas Neue', fontSize: '18px',
                      color: i < 3 ? '#ffd700' : '#4a5a7a'
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{c.name}</span>
                        {typeBadge(c.client_type)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#4a5a7a' }}>{c.total} picks</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Bebas Neue', fontSize: '22px', color: '#e8281e' }}>{c.points}</div>
                      {prize && <div style={{ fontSize: '10px', color: prize.color }}>{prize.emoji} {prize.label}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Client detail */}
        {selected && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '22px', marginBottom: '4px' }}>{selected.name}</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {typeBadge(selected.client_type)}
                  <span style={{ fontFamily: 'monospace', color: '#e8281e', fontSize: '12px' }}>{selected.code}</span>
                </div>
              </div>
              <button className="btn btn-ghost" onClick={() => setSelected(null)}
                style={{ padding: '4px 10px', fontSize: '12px' }}>✕</button>
            </div>

            {resetMsg && !resetConfirm && (
              <div style={{ marginBottom: '12px', padding: '10px', borderRadius: '8px',
                background: '#22c55e22', border: '1px solid #22c55e' }}>
                <p style={{ color: '#22c55e', fontSize: '13px' }}>{resetMsg}</p>
              </div>
            )}

            {loadingPicks ? (
              <p style={{ color: '#8899bb' }}>Cargando picks...</p>
            ) : clientPicks.length === 0 ? (
              <p style={{ color: '#8899bb' }}>Este cliente no ha hecho picks aún.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {clientPicks.map(p => {
                  const m = p.matches
                  const isCorrect = p.is_correct === true
                  const isWrong = p.is_correct === false
                  return (
                    <div key={p.id} style={{
                      padding: '12px', borderRadius: '8px', background: '#0a0f1e',
                      border: `1px solid ${isCorrect ? '#22c55e44' : isWrong ? '#ef444444' : '#2a3a55'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>
                            {m?.home_team} vs {m?.away_team}
                          </div>
                          <div style={{ fontSize: '11px', color: '#8899bb' }}>
                            {m?.stage} · {formatDate(m?.match_date)}
                          </div>
                          <div style={{ marginTop: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{
                              padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                              background: '#e8281e22', color: '#e8281e'
                            }}>
                              Eligió: {pickLabel(p.pick, m)}
                            </span>
                            {isCorrect && <span style={{ color: '#22c55e', fontSize: '12px' }}>✓ +10 pts</span>}
                            {isWrong && <span style={{ color: '#ef4444', fontSize: '12px' }}>✗ 0 pts</span>}
                            {p.is_correct === null && <span style={{ color: '#8899bb', fontSize: '12px' }}>⏳ Pendiente</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => { setResetConfirm(p); setResetMsg('') }}
                          className="btn btn-ghost"
                          style={{ padding: '6px 10px', fontSize: '12px', color: '#ef4444', flexShrink: 0 }}
                          title="Resetear pick">
                          🗑️
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
