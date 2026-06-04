import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { formatDate } from '../../lib/helpers.js'

const STAGES = [
  'Fase de Grupos',
  'Octavos de Final',
  'Cuartos de Final',
  'Semifinal',
  'Tercer Lugar',
  'Final',
]

const EMPTY = {
  match_number: '', home_team: '', away_team: '',
  match_date: '', group_name: '', home_score: '', away_score: '',
  stage: 'Fase de Grupos', venue: ''
}

export default function AdminMatches() {
  const [matches, setMatches] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { loadMatches() }, [])

  async function loadMatches() {
    const { data } = await supabase.from('matches').select('*').order('match_number')
    setMatches(data || [])
  }

  async function saveMatch(e) {
    e.preventDefault()
    setLoading(true)
    setMsg('')

    const payload = {
      match_number: parseInt(form.match_number),
      home_team: form.home_team.trim(),
      away_team: form.away_team.trim(),
      match_date: form.match_date || null,
      group_name: form.group_name.trim().toUpperCase() || null,
      stage: form.stage,
      venue: form.venue.trim() || null,
      home_score: form.home_score !== '' ? parseInt(form.home_score) : null,
      away_score: form.away_score !== '' ? parseInt(form.away_score) : null,
    }

    if (payload.home_score !== null && payload.away_score !== null) {
      if (payload.home_score > payload.away_score) payload.result = 'home'
      else if (payload.away_score > payload.home_score) payload.result = 'away'
      else payload.result = 'draw'
    } else {
      payload.result = null
    }

    let error
    if (editing) {
      ;({ error } = await supabase.from('matches').update(payload).eq('id', editing))
      if (!error && payload.result) {
        await supabase.from('picks').update({ is_correct: false }).eq('match_id', editing)
        await supabase.from('picks').update({ is_correct: true }).eq('match_id', editing).eq('pick', payload.result)
      }
    } else {
      ;({ error } = await supabase.from('matches').insert(payload))
    }

    if (error) setMsg('Error: ' + error.message)
    else { setMsg('✅ Guardado'); setForm(EMPTY); setEditing(null); loadMatches() }
    setLoading(false)
  }

  async function deleteMatch(id) {
    if (!confirm('¿Eliminar este partido?')) return
    await supabase.from('matches').delete().eq('id', id)
    loadMatches()
  }

  function editMatch(m) {
    setEditing(m.id)
    setForm({
      match_number: m.match_number,
      home_team: m.home_team,
      away_team: m.away_team,
      match_date: m.match_date ? m.match_date.slice(0, 16) : '',
      group_name: m.group_name || '',
      stage: m.stage || 'Fase de Grupos',
      venue: m.venue || '',
      home_score: m.home_score ?? '',
      away_score: m.away_score ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const lbl = (text) => (
    <label style={{ fontSize: '12px', color: '#8899bb', marginBottom: '6px', display: 'block' }}>{text}</label>
  )

  const inp = (label, key, type = 'text', placeholder = '') => (
    <div>
      {lbl(label)}
      <input type={type} value={form[key]} placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
    </div>
  )

  const statusBadge = (m) => {
    if (m.result !== null) return { label: 'FINALIZADO', color: '#ef4444', bg: '#ef444422' }
    if (m.match_date && new Date(m.match_date) < new Date()) return { label: 'EN CURSO', color: '#eab308', bg: '#eab30822' }
    return { label: 'PRÓXIMO', color: '#22c55e', bg: '#22c55e22' }
  }

  return (
    <div>
      <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>
        {editing ? 'EDITAR PARTIDO' : 'NUEVO PARTIDO'}
      </h1>
      <p style={{ color: '#8899bb', marginBottom: '24px' }}>Carga los partidos y actualiza resultados aquí</p>

      <div className="card" style={{ marginBottom: '32px' }}>
        <form onSubmit={saveMatch}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
            {inp('# Partido', 'match_number', 'number', '1')}
            {inp('Grupo', 'group_name', 'text', 'A')}
            {inp('Fecha y hora', 'match_date', 'datetime-local')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {inp('Equipo Local', 'home_team', 'text', 'México')}
            {inp('Equipo Visitante', 'away_team', 'text', 'Polonia')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              {lbl('Fase del torneo')}
              <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {inp('Estadio y ciudad', 'venue', 'text', 'SoFi Stadium, Los Ángeles')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {inp('Goles Local', 'home_score', 'number', '')}
            {inp('Goles Visitante', 'away_score', 'number', '')}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex: 1 }}>
                {loading ? 'Guardando...' : editing ? 'Actualizar' : 'Agregar'}
              </button>
              {editing && (
                <button className="btn btn-ghost" type="button"
                  onClick={() => { setEditing(null); setForm(EMPTY) }}>
                  Cancelar
                </button>
              )}
            </div>
          </div>
          {msg && <p style={{ color: msg.includes('Error') ? '#ef4444' : '#22c55e', fontSize: '13px' }}>{msg}</p>}
        </form>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>PARTIDOS ({matches.length})</h2>
        {matches.length === 0 ? (
          <p style={{ color: '#8899bb' }}>No hay partidos cargados aún.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a3a55' }}>
                  {['#', 'Estado', 'Fase', 'Partido', 'Sede', 'Fecha', 'Marcador', ''].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left',
                      color: '#8899bb', fontSize: '12px', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matches.map(m => {
                  const status = statusBadge(m)
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid #1a2235' }}>
                      <td style={{ padding: '12px', fontFamily: 'Bebas Neue', fontSize: '18px', color: '#8899bb' }}>{m.match_number}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ background: status.bg, color: status.color,
                          padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#8899bb', fontSize: '12px' }}>{m.stage || '—'}</td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{m.home_team} vs {m.away_team}</td>
                      <td style={{ padding: '12px', color: '#8899bb', fontSize: '12px' }}>{m.venue || '—'}</td>
                      <td style={{ padding: '12px', color: '#8899bb', fontSize: '12px' }}>{formatDate(m.match_date)}</td>
                      <td style={{ padding: '12px', fontFamily: 'Bebas Neue', fontSize: '20px' }}>
                        {m.home_score !== null ? `${m.home_score} — ${m.away_score}` : '— vs —'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-ghost" onClick={() => editMatch(m)}
                            style={{ padding: '6px 12px', fontSize: '12px' }}>✏️</button>
                          <button className="btn btn-ghost" onClick={() => deleteMatch(m.id)}
                            style={{ padding: '6px 12px', fontSize: '12px', color: '#ef4444' }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
