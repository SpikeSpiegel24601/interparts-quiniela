import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { formatDate } from '../../lib/helpers.js'

export default function ClientHome() {
  const [client] = useState(() => JSON.parse(localStorage.getItem('client') || '{}'))
  const [matches, setMatches] = useState([])
  const [picks, setPicks] = useState({})
  const [points, setPoints] = useState(0)
  const [totalPicks, setTotalPicks] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [tab, setTab] = useState('votar')
  const [diasVisibles, setDiasVisibles] = useState(7)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const clientType = client.client_type || 'standard'

    // Cargar config de días visibles
    const { data: configData } = await supabase
      .from('config').select('value').eq('key', 'dias_visibles').single()
    const dias = parseInt(configData?.value || '7')
    setDiasVisibles(dias)

    const { data: assignData } = await supabase
      .from('match_assignments').select('match_id')
      .in('client_type', [clientType, 'all'])
    const assignedIds = (assignData || []).map(a => a.match_id)

    let matchData = []
    if (assignedIds.length > 0) {
      const { data } = await supabase
        .from('matches').select('*')
        .in('id', assignedIds)
        .order('match_date', { ascending: true, nullsFirst: false })
        .order('match_number')
      matchData = data || []
    }

    const { data: pickData } = await supabase
      .from('picks').select('*').eq('client_id', client.id)

    const picksMap = {}
    let pts = 0, total = 0
    ;(pickData || []).forEach(p => {
      picksMap[p.match_id] = p
      if (p.is_correct) pts += 10
      total++
    })

    setMatches(matchData)
    setPicks(picksMap)
    setPoints(pts)
    setTotalPicks(total)
    setLoading(false)
  }

  function requestPick(matchId, choice, matchLabel) {
    setConfirm({ matchId, choice, matchLabel })
  }

  async function confirmPick() {
    const { matchId, choice } = confirm
    setConfirm(null)
    setSaving(matchId)
    const { error } = await supabase.from('picks').insert({
      client_id: client.id, match_id: matchId, pick: choice, is_correct: null
    })
    if (!error) {
      setPicks(p => ({ ...p, [matchId]: { pick: choice, is_correct: null } }))
      setTotalPicks(t => t + 1)
    }
    setSaving(null)
  }

  function getStatus(m) {
    if (m.result !== null) return 'finalizado'
    if (m.match_date && new Date(m.match_date) < new Date()) return 'en_curso'
    return 'proximo'
  }

  function getDayLabel(dateStr) {
    if (!dateStr) return 'Sin fecha'
    const d = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const mty = (date) => date.toLocaleDateString('es-MX', { timeZone: 'America/Monterrey' })
    if (mty(d) === mty(today)) return '🗓️ Hoy'
    if (mty(d) === mty(tomorrow)) return '🗓️ Mañana'
    return '🗓️ ' + d.toLocaleDateString('es-MX', {
      weekday: 'short', day: 'numeric', month: 'short', timeZone: 'America/Monterrey'
    })
  }

  const now = new Date()
  const limitDate = new Date(now.getTime() + diasVisibles * 24 * 60 * 60 * 1000)

  const votarMatches = matches.filter(m => {
    const status = getStatus(m)
    if (status === 'finalizado') return false
    if (status === 'en_curso') return true
    if (!m.match_date) return true
    return new Date(m.match_date) <= limitDate
  })

  const historialMatches = matches.filter(m => getStatus(m) === 'finalizado').reverse()

  const groupedByDay = {}
  votarMatches.forEach(m => {
    const label = getDayLabel(m.match_date)
    if (!groupedByDay[label]) groupedByDay[label] = []
    groupedByDay[label].push(m)
  })

  const pendientesCount = votarMatches.filter(m => !picks[m.id] && getStatus(m) === 'proximo').length

  if (loading) return <div style={{ color: '#8899bb', padding: '40px', textAlign: 'center' }}>Cargando...</div>

  const tabBtn = (key, label, count) => (
    <button onClick={() => setTab(key)} style={{
      flex: 1, padding: '10px 8px', borderRadius: '8px', fontSize: '13px',
      fontWeight: 600, cursor: 'pointer', border: 'none',
      background: tab === key ? '#e8281e' : '#1a2235',
      color: tab === key ? 'white' : '#8899bb',
      transition: 'all 0.15s'
    }}>
      {label}
      {count > 0 && (
        <span style={{
          marginLeft: '6px', background: tab === key ? 'rgba(255,255,255,0.3)' : '#2a3a55',
          borderRadius: '20px', padding: '1px 7px', fontSize: '11px'
        }}>{count}</span>
      )}
    </button>
  )

  return (
    <div>
      {confirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '380px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ fontSize: '22px', marginBottom: '12px' }}>¿Estás seguro?</h3>
            <p style={{ color: '#8899bb', fontSize: '14px', marginBottom: '8px', lineHeight: 1.5 }}>
              Vas a elegir: <strong style={{ color: '#f0f4ff' }}>{confirm.matchLabel}</strong>
            </p>
            <p style={{ color: '#fcd34d', fontSize: '13px', marginBottom: '24px', lineHeight: 1.5 }}>
              Una vez que confirmes tu elección, <strong>no podrás editarla ni cambiarla.</strong>
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}
                style={{ flex: 1, fontSize: '15px', padding: '12px' }}>No, cancelar</button>
              <button className="btn btn-primary" onClick={confirmPick}
                style={{ flex: 1, fontSize: '15px', padding: '12px' }}>Sí, confirmar</button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{
        marginBottom: '20px', textAlign: 'center',
        background: 'linear-gradient(135deg, #1a2235 0%, #1a0808 100%)'
      }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: '64px', color: '#e8281e', lineHeight: 1 }}>{points}</div>
        <div style={{ color: '#8899bb', fontSize: '14px' }}>
          puntos acumulados · {totalPicks} partidos jugados
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {tabBtn('votar', '⚽ Mis juegos', pendientesCount)}
        {tabBtn('historial', '📋 Historial', historialMatches.length)}
      </div>

      {tab === 'votar' && (
        <div>
          {votarMatches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8899bb' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
              <p>No hay partidos disponibles por ahora.</p>
            </div>
          ) : (
            <>
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                background: '#2a1a00', border: '1px solid #f59e0b',
                borderRadius: '10px', padding: '12px 16px', marginBottom: '16px'
              }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
                <p style={{ fontSize: '13px', color: '#fcd34d', lineHeight: 1.5, margin: 0 }}>
                  <strong>Elige muy bien tu resultado.</strong> Una vez que confirmes, no podrás cambiarlo.
                </p>
              </div>

              {Object.entries(groupedByDay).map(([dayLabel, dayMatches]) => (
                <div key={dayLabel} style={{ marginBottom: '24px' }}>
                  <div style={{
                    fontSize: '13px', fontWeight: 700, color: '#8899bb',
                    marginBottom: '10px', padding: '6px 12px',
                    background: '#1a2235', borderRadius: '8px',
                    display: 'inline-block'
                  }}>
                    {dayLabel}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {dayMatches.map(m => (
                      <MatchCard key={m.id} match={m} pick={picks[m.id]}
                        saving={saving === m.id} onPick={requestPick} status={getStatus(m)} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {tab === 'historial' && (
        <div>
          {historialMatches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8899bb' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
              <p>Aún no hay partidos finalizados.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {historialMatches.map(m => {
                const pick = picks[m.id]
                const isCorrect = pick?.is_correct === true
                const isWrong = pick?.is_correct === false
                const pickLabel = pick?.pick === 'home' ? m.home_team
                  : pick?.pick === 'away' ? m.away_team
                  : pick?.pick === 'draw' ? 'Empate' : null
                return (
                  <div key={m.id} className="card" style={{
                    padding: '16px',
                    borderColor: isCorrect ? '#22c55e44' : isWrong ? '#ef444444' : '#2a3a55'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="badge" style={{ background: '#2a3a55', color: '#8899bb', fontSize: '11px' }}>
                        {m.stage}{m.group_name ? ` · Grupo ${m.group_name}` : ''}
                      </span>
                      <span style={{ fontSize: '12px', color: '#8899bb' }}>{formatDate(m.match_date)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 700, fontSize: '16px' }}>{m.home_team}</span>
                      <span style={{ fontFamily: 'Bebas Neue', fontSize: '24px', color: '#ffd700', padding: '0 12px' }}>
                        {m.home_score} — {m.away_score}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '16px' }}>{m.away_team}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {pickLabel ? (
                        <>
                          <span style={{
                            padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                            background: isCorrect ? '#22c55e22' : isWrong ? '#ef444422' : '#2a3a55',
                            color: isCorrect ? '#22c55e' : isWrong ? '#ef4444' : '#8899bb'
                          }}>
                            Elegiste: {pickLabel}
                          </span>
                          {isCorrect && <span style={{ color: '#22c55e', fontSize: '13px', fontWeight: 700 }}>✓ +10 pts</span>}
                          {isWrong && <span style={{ color: '#ef4444', fontSize: '13px' }}>✗ 0 pts</span>}
                        </>
                      ) : (
                        <span style={{ color: '#4a5a7a', fontSize: '12px' }}>No participaste en este partido</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {matches.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8899bb' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p>Los partidos aparecerán aquí cuando el admin los cargue.</p>
        </div>
      )}
    </div>
  )
}

function MatchCard({ match: m, pick, saving, onPick, status }) {
  const hasPick = !!pick
  const isPast = status === 'finalizado'
  const isLive = status === 'en_curso'
  const isBlocked = hasPick || isPast || isLive
  const choiceLabel = (value) => value === 'home' ? m.home_team : value === 'away' ? m.away_team : 'Empate'

  const statusBadge = {
    finalizado: { label: '🔴 PARTIDO FINALIZADO', color: '#ef4444', bg: '#ef444422' },
    en_curso:   { label: '🟡 EN CURSO',           color: '#eab308', bg: '#eab30822' },
    proximo:    { label: '🟢 PRÓXIMO PARTIDO',     color: '#22c55e', bg: '#22c55e22' },
  }[status]

  const optionBtn = (value, label) => {
    const selected = pick?.pick === value
    const isCorrect = isPast && selected && pick?.is_correct
    const isWrong = isPast && selected && pick?.is_correct === false
    const isResult = isPast && m.result === value && !selected
    let bg = '#0a0f1e', border = '#2a3a55', color = '#8899bb'
    if (selected && !isPast && !isLive) { bg = '#e8281e22'; border = '#e8281e'; color = '#f0f4ff' }
    if (selected && isLive) { bg = '#eab30822'; border = '#eab308'; color = '#eab308' }
    if (isCorrect) { bg = '#22c55e22'; border = '#22c55e'; color = '#22c55e' }
    if (isWrong) { bg = '#ef444422'; border = '#ef4444'; color = '#ef4444' }
    if (isResult) { bg = '#22c55e11'; border = '#22c55e44'; color = '#22c55e88' }
    return (
      <button key={value} disabled={isBlocked || saving}
        onClick={() => !isBlocked && !saving && onPick(m.id, value, choiceLabel(value))}
        style={{ flex: 1, padding: '12px 8px', borderRadius: '8px', fontSize: '13px',
          fontWeight: 600, background: bg, border: `1.5px solid ${border}`, color,
          transition: 'all 0.15s', cursor: isBlocked ? 'default' : 'pointer',
          opacity: (isPast || isLive) && !selected ? 0.5 : 1 }}>
        {label}{isCorrect && ' ✓'}{isWrong && ' ✗'}
      </button>
    )
  }

  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{
        display: 'inline-block', padding: '4px 10px', borderRadius: '20px',
        fontSize: '11px', fontWeight: 700, marginBottom: '10px',
        background: statusBadge.bg, color: statusBadge.color
      }}>
        {statusBadge.label}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="badge" style={{ background: '#2a3a55', color: '#8899bb', fontSize: '11px' }}>
            {m.stage || 'Fase de Grupos'}{m.group_name ? ` · Grupo ${m.group_name}` : ''}
          </span>
          {m.venue && <span style={{ fontSize: '11px', color: '#8899bb' }}>📍 {m.venue}</span>}
        </div>
        <span style={{ fontSize: '12px', color: '#8899bb' }}>{formatDate(m.match_date)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0' }}>
        <span style={{ fontSize: '18px', fontWeight: 700, flex: 1 }}>{m.home_team}</span>
        {isPast
          ? <span style={{ fontFamily: 'Bebas Neue', fontSize: '28px', padding: '0 16px', color: '#ffd700' }}>{m.home_score} — {m.away_score}</span>
          : <span style={{ color: '#4a5a7a', fontSize: '14px', padding: '0 12px' }}>VS</span>
        }
        <span style={{ fontSize: '18px', fontWeight: 700, flex: 1, textAlign: 'right' }}>{m.away_team}</span>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {optionBtn('home', m.home_team)}
        {optionBtn('draw', 'Empate')}
        {optionBtn('away', m.away_team)}
      </div>
      {saving && <p style={{ fontSize: '12px', color: '#8899bb', marginTop: '8px', textAlign: 'center' }}>Guardando...</p>}
      {hasPick && !isPast && !isLive && <p style={{ fontSize: '12px', color: '#8899bb', marginTop: '8px', textAlign: 'center' }}>🔒 Selección confirmada y bloqueada</p>}
      {(isPast || isLive) && !hasPick && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px', textAlign: 'center' }}>⛔ Ya no es posible hacer una predicción</p>}
    </div>
  )
}
