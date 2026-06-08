import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { getPrize, formatDate } from '../../lib/helpers.js'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ clients: 0, matches: 0, picks: 0 })
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [clientPicks, setClientPicks] = useState([])
  const [loadingPicks, setLoadingPicks] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(null)
  const [adminPass, setAdminPass] = useState('')
  const [resetMsg, setResetMsg] = useState('')
  const [detailTab, setDetailTab] = useState('picks') // picks | info

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
    setDetailTab('picks')

    // Cargar datos completos del cliente
    const { data: fullClient } = await supabase
      .from('clients')
      .select('*, sellers(name)')
      .eq('id', client.id)
      .single()

    if (fullClient) setSelected(fullClient)

    const { data } = await supabase
      .from('picks')
      .select('*, matches(id, home_team, away_team, result, home_score, away_score, match_date, stage, group_name)')
      .eq('client_id', client.id)
      .order('created_at')

    setClientPicks(data || [])
    setLoadingPicks(false)
  }

  function getMatchStatus(m) {
    if (!m) return 'proximo'
    if (m.result !== null) return 'finalizado'
    if (m.match_date && new Date(m.match_date) < new Date()) return 'en_curso'
    return 'proximo'
  }

  async function resetPick() {
    if (adminPass.toUpperCase() !== import.meta.env.VITE_ADMIN_PASSWORD?.toUpperCase() &&
        adminPass.toUpperCase() !== import.meta.env.VITE_ADMIN_PASSWORD_2?.toUpperCase()) {
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
    if (pick === 'home') return m?.home_team
    if (pick === 'away') return m?.away_team
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

  const infoRow = (label, value) => (
    <div style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid #1a2235' }}>
      <span style={{ fontSize: '12px', color: '#8899bb', minWidth: '140px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '13px', color: value ? '#f0f4ff' : '#4a5a7a' }}>{value || '—'}</span>
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
              Vas a resetear el pick de <strong style={{ color: '#f0f4ff' }}>{selected?.name}</strong> en:
            </p>
            <p style={{ color: '#ffd700', fontSize: '14px', marginBottom: '16px', fontWeight: 600 }}>
              {resetConfirm.matches?.home_team} vs {resetConfirm.matches?.away_team}
            </p>
            <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>
              El cliente podrá volver a elegir. Esta acción no se puede deshacer.
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#8899bb', marginBottom: '6px', display: 'block' }}>
                Ingresa tu contraseña de admin:
              </label>
              <input type="password" value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                placeholder="Contraseña admin" autoFocus />
            </div>
            {resetMsg && <p style={{ color: resetMsg.includes('✅') ? '#22c55e' : '#ef4444',
              fontSize: '13px', marginBottom: '12px' }}>{resetMsg}</p>}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-ghost"
                onClick={() => { setResetConfirm(null); setAdminPass(''); setResetMsg('') }}
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
            Click en un cliente para ver sus detalles
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
                  <div key={c.id} onClick={() => loadClientPicks(c)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 14px', borderRadius: '8px', cursor: 'pointer',
                      background: isSelected ? '#e8281e22' : '#0a0f1e',
                      border: `1px solid ${isSelected ? '#e8281e' : '#2a3a55'}`,
                      transition: 'all 0.15s'
                    }}>
                    <div style={{ width: '28px', textAlign: 'center',
                      fontFamily: 'Bebas Neue', fontSize: '18px',
                      color: i < 3 ? '#ffd700' : '#4a5a7a' }}>
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
                <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>{selected.nombre_participante || selected.name}</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {typeBadge(selected.client_type)}
                  <span style={{ fontFamily: 'monospace', color: '#e8281e', fontSize: '12px' }}>{selected.code}</span>
                </div>
              </div>
              <button className="btn btn-ghost" onClick={() => setSelected(null)}
                style={{ padding: '4px 10px', fontSize: '12px' }}>✕</button>
            </div>

            {/* Sub tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {['picks', 'info'].map(t => (
                <button key={t} onClick={() => setDetailTab(t)}
                  style={{
                    padding: '6px 16px', borderRadius: '8px', fontSize: '13px',
                    fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: detailTab === t ? '#e8281e' : '#1a2235',
                    color: detailTab === t ? 'white' : '#8899bb'
                  }}>
                  {t === 'picks' ? '🎯 Sus picks' : '📋 Datos'}
                </button>
              ))}
            </div>

            {/* Picks tab */}
            {detailTab === 'picks' && (
              <>
                <div style={{
                  background: '#1a1a2a', border: '1px solid #2a3a55',
                  borderRadius: '8px', padding: '10px 12px', marginBottom: '12px'
                }}>
                  <p style={{ fontSize: '11px', color: '#8899bb', margin: 0 }}>
                    🗑️ Solo se pueden resetear picks de partidos <strong style={{ color: '#22c55e' }}>Próximos</strong>.
                  </p>
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
                      const matchStatus = getMatchStatus(m)
                      const isCorrect = p.is_correct === true
                      const isWrong = p.is_correct === false
                      const canReset = matchStatus === 'proximo'
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
                              <div style={{ fontSize: '11px', color: '#8899bb', marginBottom: '6px' }}>
                                {m?.stage} · {formatDate(m?.match_date)}
                                {' · '}
                                <span style={{
                                  color: matchStatus === 'proximo' ? '#22c55e' : matchStatus === 'en_curso' ? '#eab308' : '#ef4444',
                                  fontWeight: 600
                                }}>
                                  {matchStatus === 'proximo' ? '🟢' : matchStatus === 'en_curso' ? '🟡' : '🔴'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{
                                  padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                                  background: '#e8281e22', color: '#e8281e'
                                }}>
                                  {pickLabel(p.pick, m)}
                                </span>
                                {isCorrect && <span style={{ color: '#22c55e', fontSize: '12px' }}>✓ +10 pts</span>}
                                {isWrong && <span style={{ color: '#ef4444', fontSize: '12px' }}>✗ 0 pts</span>}
                                {p.is_correct === null && <span style={{ color: '#8899bb', fontSize: '12px' }}>⏳</span>}
                              </div>
                            </div>
                            {canReset ? (
                              <button onClick={() => { setResetConfirm(p); setResetMsg('') }}
                                className="btn btn-ghost"
                                style={{ padding: '6px 10px', fontSize: '12px', color: '#ef4444', flexShrink: 0 }}>
                                🗑️
                              </button>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#4a5a7a', flexShrink: 0, paddingLeft: '8px' }}>🔒</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* Info tab */}
            {detailTab === 'info' && (
              <div>
                {infoRow('Nombre participante', selected.nombre_participante)}
                {infoRow('Razón social', selected.razon_social)}
                {infoRow('Nombre público', selected.nombre_publico)}
                {infoRow('No. CONTPAQ', selected.contpaq_id)}
                {infoRow('Folio de nota', selected.folio_nota)}
                {infoRow('Teléfono', selected.phone)}
                {infoRow('Email', selected.email)}
                {infoRow('Vendedor', selected.sellers?.name)}
                {infoRow('Código de acceso', selected.code)}
                {infoRow('Registrado', selected.is_registered ? '✅ Sí' : '❌ No')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
