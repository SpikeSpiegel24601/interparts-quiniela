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

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const clientType = client.client_type || 'standard'

    const { data: assignData } = await supabase
      .from('match_assignments')
      .select('match_id')
      .in('client_type', [clientType, 'all'])

    const assignedIds = (assignData || []).map(a => a.match_id)

    let matchData = []
    if (assignedIds.length > 0) {
      const { data } = await supabase
        .from('matches')
        .select('*')
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

  const now = new Date()
  const availableMatches = matches.filter(m => {
    if (!m.match_date) return true
    return new Date(m.match_date) <= new Date(now.getTime() + 24 * 60 * 60 * 1000)
  })
  const upcomingMatches = matches.filter(m => {
    if (!m.match_date) return false
    return new Date(m.match_date) > new Date(now.getTime() + 24 * 60 * 60 * 1000)
  })

  if (loading) return <div style={{ color: '#8899bb', padding: '40px', textAlign: 'center' }}>Cargando...</div>

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
        marginBottom: '24px', textAlign: 'center',
        background: 'linear-gradient(135deg, #1a2235 0%, #1a0808 100%)'
      }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: '72px', color: '#e8281e', lineHeight: 1 }}>{points}</div>
        <div style={{ color: '#8899bb', fontSize: '15px' }}>
          puntos acumulados · {totalPicks} partidos jugados
        </div>
      </div>

      {availableMatches.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', marginBottom: '12px', color: '#f0f4ff' }}>MIS JUEGOS</h2>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            background: '#2a1a00', border: '1px solid #f59e0b',
            borderRadius: '10px', padding: '12px 16px', marginBottom: '16px'
          }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
            <p style={{ fontSize: '13px', color: '#fcd34d', lineHeight: 1.5, margin: 0 }}>
              <strong>Elige muy bien tu resultado.</strong> Una vez que selecciones tu predicción, no podrás editarla ni cambiarla. ¡Piénsalo bien antes de confirmar!
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {availableMatches.map(m => (
              <MatchCard key={m.id} match={m} pick={picks[m.id]}
                saving={saving === m.id} onPick={requestPick}
                status={getStatus(m)} />
            ))}
          </div>
        </div>
      )}

      {upcomingMatches.length > 0 && (
        <div>
          <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#8899bb' }}>PRÓXIMOS PARTIDOS</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcomingMatches.slice(0, 5).map(m => (
              <div key={m.id} className="card" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                opacity: 0.6, padding: '14px 16px'
              }}>
                <span style={{ fontWeight: 500 }}>{m.home_team} vs {m.away_team}</span>
                <span style={{ fontSize: '12px', color: '#8899bb' }}>{formatDate(m.match_date)}</span>
              </div>
            ))}
          </div>
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
