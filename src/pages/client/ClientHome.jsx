import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { formatDate, getPrize, getNextPrize } from '../../lib/helpers.js'

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
    const { data: matchData } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: true, nullsFirst: false })
      .order('match_number')
    const { data: pickData } = await supabase
      .from('picks').select('*').eq('client_id', client.id)
    const picksMap = {}
    let pts = 0, total = 0
    ;(pickData || []).forEach(p => {
      picksMap[p.match_id] = p
      if (p.is_correct) pts++
      total++
    })
    setMatches(matchData || [])
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

  const now = new Date()
  const todayMatches = matches.filter(m => {
    if (!m.match_date) return true
    return new Date(m.match_date) <= new Date(now.getTime() + 24 * 60 * 60 * 1000)
  })
  const upcomingMatches = matches.filter(m => {
    if (!m.match_date) return false
    return new Date(m.match_date) > new Date(now.getTime() + 24 * 60 * 60 * 1000)
  })

  const prize = getPrize(points)
  const nextPrize = getNextPrize(points)

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
        background: 'linear-gradient(135deg, #1a2235 0%, #1a0808 100%)',
        borderColor: prize ? prize.color : '#2a3a55'
      }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: '64px', color: '#e8281e', lineHeight: 1 }}>{points}</div>
        <div style={{ color: '#8899bb', fontSize: '14px', marginBottom: '8px' }}>puntos de {totalPicks} partidos jugados</div>
        {prize ? (
          <div style={{ fontSize: '18px', fontWeight: 600 }}>{prize.emoji} ¡Vas por el <span style={{ color: prize.color }}>{prize.label}</span>!</div>
        ) : nextPrize ? (
          <div style={{ color: '#8899bb', fontSize: '14px' }}>Te faltan <span style={{ color: '#ffd700', fontWeight: 700 }}>{nextPrize.needed} puntos</span> para ganar {nextPrize.prize.emoji} {nextPrize.prize.label}</div>
        ) : (
          <div style={{ color: '#8899bb', fontSize: '14px' }}>Haz tus picks para acumular puntos</div>
        )}
      </div>

      {todayMatches.length > 0 && (
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
            {todayMatches.map(m => (
              <MatchCard key={m.id} match={m} pick={picks[m.id]} saving={saving === m.id} onPick={requestPick} />
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

function MatchCard({ match: m, pick, saving, onPick }) {
  const hasPick = !!pick
  const isPast = m.result !== null
  const choiceLabel = (value) => value === 'home' ? m.home_team : value === 'away' ? m.away_team : 'Empate'

  const optionBtn = (value, label) => {
    const selected = pick?.pick === value
    const isCorrect = isPast && selected && pick?.is_correct
    const isWrong = isPast && selected && pick?.is_correct === false
    const isResult = isPast && m.result === value && !selected
    let bg = '#0a0f1e', border = '#2a3a55', color = '#8899bb'
    if (selected && !isPast) { bg = '#e8281e22'; border = '#e8281e'; color = '#f0f4ff' }
    if (isCorrect) { bg = '#22c55e22'; border = '#22c55e'; color = '#22c55e' }
    if (isWrong) { bg = '#ef444422'; border = '#ef4444'; color = '#ef4444' }
    if (isResult) { bg = '#22c55e11'; border = '#22c55e44'; color = '#22c55e88' }
    return (
      <button key={value} disabled={hasPick || saving}
        onClick={() => !hasPick && !saving && onPick(m.id, value, choiceLabel(value))}
        style={{ flex: 1, padding: '12px 8px', borderRadius: '8px', fontSize: '13px',
          fontWeight: 600, background: bg, border: `1.5px solid ${border}`, color,
          transition: 'all 0.15s', cursor: hasPick ? 'default' : 'pointer' }}>
        {label}{isCorrect && ' ✓'}{isWrong && ' ✗'}
      </button>
    )
  }

  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span className="badge" style={{ background: '#2a3a55', color: '#8899bb', fontSize: '11px' }}>
          Grupo {m.group_name || '?'} · Partido #{m.match_number}
        </span>
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
      {hasPick && !isPast && <p style={{ fontSize: '12px', color: '#8899bb', marginTop: '8px', textAlign: 'center' }}>🔒 Selección confirmada y bloqueada</p>}
    </div>
  )
}
