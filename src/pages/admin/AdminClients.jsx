import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const part = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${part(4)}-${part(4)}`
}

const EMPTY_FORM = { name: '', phone: '', seller_id: '', contpaq_id: '', client_type: 'standard' }

export default function AdminClients() {
  const [clients, setClients] = useState([])
  const [sellers, setSellers] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [bulk, setBulk] = useState({ count: 10, seller_id: '', client_type: 'standard' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [tab, setTab] = useState('list')
  const [editing, setEditing] = useState(null)
  const [sortCol, setSortCol] = useState('name')
  const [sortDir, setSortDir] = useState('asc')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [{ data: c }, { data: s }] = await Promise.all([
      supabase.from('clients').select('*, sellers(name)').order('created_at'),
      supabase.from('sellers').select('*').order('name')
    ])
    setClients(c || [])
    setSellers(s || [])
  }

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  function sortedClients() {
    return [...clients].sort((a, b) => {
      let valA, valB
      if (sortCol === 'type') { valA = a.client_type || ''; valB = b.client_type || '' }
      else if (sortCol === 'contpaq') { valA = a.contpaq_id || ''; valB = b.contpaq_id || '' }
      else if (sortCol === 'code') { valA = a.code || ''; valB = b.code || '' }
      else if (sortCol === 'name') { valA = a.nombre_participante || a.name || ''; valB = b.nombre_participante || b.name || '' }
      else if (sortCol === 'razon') { valA = a.razon_social || ''; valB = b.razon_social || '' }
      else if (sortCol === 'phone') { valA = a.phone || ''; valB = b.phone || '' }
      else if (sortCol === 'email') { valA = a.email || ''; valB = b.email || '' }
      else if (sortCol === 'folio') { valA = a.folio_nota || ''; valB = b.folio_nota || '' }
      else if (sortCol === 'seller') { valA = a.sellers?.name || ''; valB = b.sellers?.name || '' }
      else { valA = ''; valB = '' }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }

  async function addClient(e) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    const code = generateCode()
    const { error } = await supabase.from('clients').insert({
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      seller_id: form.seller_id || null,
      contpaq_id: form.contpaq_id.trim() || null,
      client_type: form.client_type,
      code
    })
    if (error) setMsg('Error: ' + error.message)
    else { setMsg(`✅ Cliente agregado. Código: ${code}`); setForm(EMPTY_FORM); loadAll() }
    setLoading(false)
  }

  async function saveEdit(e) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    const { error } = await supabase.from('clients').update({
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      seller_id: form.seller_id || null,
      contpaq_id: form.contpaq_id.trim() || null,
      client_type: form.client_type,
      code: form.code.trim().toUpperCase(),
    }).eq('id', editing)
    if (error) setMsg('Error: ' + error.message)
    else { setMsg('✅ Cliente actualizado'); setEditing(null); setForm(EMPTY_FORM); loadAll(); setTab('list') }
    setLoading(false)
  }

  function startEdit(c) {
    setEditing(c.id)
    setForm({
      name: c.name,
      phone: c.phone || '',
      seller_id: c.seller_id || '',
      contpaq_id: c.contpaq_id || '',
      client_type: c.client_type || 'standard',
      code: c.code,
    })
    setTab('edit')
  }

  async function addBulk(e) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    const start = clients.length + 1
    const rows = Array.from({ length: parseInt(bulk.count) }, (_, i) => ({
      name: `Cliente ${start + i}`,
      code: generateCode(),
      seller_id: bulk.seller_id || null,
      client_type: bulk.client_type,
    }))
    const { error } = await supabase.from('clients').insert(rows)
    if (error) setMsg('Error: ' + error.message)
    else { setMsg(`✅ ${bulk.count} clientes generados`); loadAll() }
    setLoading(false)
  }

  async function deleteClient(id) {
    if (!confirm('¿Eliminar cliente? Se borrarán sus picks.')) return
    await supabase.from('clients').delete().eq('id', id)
    loadAll()
  }

  const tabBtn = (key, label) => (
    <button onClick={() => { setTab(key); if (key !== 'edit') { setEditing(null); setForm(EMPTY_FORM) } }}
      className="btn" style={{
        padding: '8px 20px', fontSize: '13px',
        background: tab === key ? '#e8281e' : 'transparent',
        color: tab === key ? 'white' : '#8899bb',
        border: '1px solid ' + (tab === key ? '#e8281e' : '#2a3a55'),
        borderRadius: '8px'
      }}>{label}</button>
  )

  const lbl = (text) => <label style={{ fontSize: '12px', color: '#8899bb', marginBottom: '6px', display: 'block' }}>{text}</label>

  const typeSelect = (value, onChange) => (
    <div>
      {lbl('Tipo de cliente')}
      <select value={value} onChange={onChange}>
        <option value="standard">Standard</option>
        <option value="vip">VIP ⭐</option>
      </select>
    </div>
  )

  const typeBadge = (type) => (
    <span style={{
      padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
      background: type === 'vip' ? '#ffd70022' : '#2a3a55',
      color: type === 'vip' ? '#ffd700' : '#8899bb'
    }}>
      {type === 'vip' ? '⭐ VIP' : 'Standard'}
    </span>
  )

  const thStyle = (col) => ({
    padding: '10px 12px', textAlign: 'left', cursor: 'pointer',
    color: sortCol === col ? '#f0f4ff' : '#8899bb',
    fontSize: '12px', fontWeight: 600, userSelect: 'none',
    whiteSpace: 'nowrap'
  })

  const sortIcon = (col) => sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'

  return (
    <div>
      <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>CLIENTES</h1>
      <p style={{ color: '#8899bb', marginBottom: '24px' }}>Gestiona los clientes participantes</p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {tabBtn('list', `📋 Lista (${clients.length})`)}
        {tabBtn('add', '➕ Agregar uno')}
        {tabBtn('bulk', '⚡ Generar masivo')}
        {editing && tabBtn('edit', '✏️ Editando...')}
      </div>

      {msg && (
        <div className="card" style={{ marginBottom: '16px', borderColor: msg.includes('Error') ? '#ef4444' : '#22c55e' }}>
          <p style={{ color: msg.includes('Error') ? '#ef4444' : '#22c55e', fontSize: '13px' }}>{msg}</p>
        </div>
      )}

      {/* LIST */}
      {tab === 'list' && (
        <div className="card">
          {clients.length === 0 ? (
            <p style={{ color: '#8899bb' }}>No hay clientes aún.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a3a55' }}>
                    <th style={thStyle('type')} onClick={() => handleSort('type')}>Tipo{sortIcon('type')}</th>
                    <th style={thStyle('contpaq')} onClick={() => handleSort('contpaq')}>No. CONTPAQ{sortIcon('contpaq')}</th>
                    <th style={thStyle('code')} onClick={() => handleSort('code')}>Código{sortIcon('code')}</th>
                    <th style={thStyle('name')} onClick={() => handleSort('name')}>Participante{sortIcon('name')}</th>
                    <th style={thStyle('razon')} onClick={() => handleSort('razon')}>Razón Social{sortIcon('razon')}</th>
                    <th style={thStyle('folio')} onClick={() => handleSort('folio')}>Folio{sortIcon('folio')}</th>
                    <th style={thStyle('phone')} onClick={() => handleSort('phone')}>Teléfono{sortIcon('phone')}</th>
                    <th style={thStyle('email')} onClick={() => handleSort('email')}>Email{sortIcon('email')}</th>
                    <th style={thStyle('seller')} onClick={() => handleSort('seller')}>Vendedor{sortIcon('seller')}</th>
                    <th style={{ padding: '10px 12px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedClients().map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #1a2235' }}>
                      <td style={{ padding: '12px' }}>{typeBadge(c.client_type)}</td>
                      <td style={{ padding: '12px', color: '#8899bb', fontFamily: 'monospace' }}>{c.contpaq_id || '—'}</td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', color: '#e8281e', fontWeight: 700 }}>{c.code}</td>
                      <td style={{ padding: '12px', fontWeight: 500 }}>{c.nombre_participante || c.name}</td>
                      <td style={{ padding: '12px', color: '#8899bb', fontSize: '12px' }}>{c.razon_social || '—'}</td>
                      <td style={{ padding: '12px', color: '#8899bb' }}>{c.folio_nota || '—'}</td>
                      <td style={{ padding: '12px', color: '#8899bb' }}>{c.phone || '—'}</td>
                      <td style={{ padding: '12px', color: '#8899bb', fontSize: '12px' }}>{c.email || '—'}</td>
                      <td style={{ padding: '12px', color: '#8899bb' }}>{c.sellers?.name || '—'}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-ghost" onClick={() => startEdit(c)}
                            style={{ padding: '4px 10px', fontSize: '12px' }}>✏️</button>
                          <button className="btn btn-ghost" onClick={() => deleteClient(c.id)}
                            style={{ padding: '4px 10px', fontSize: '12px', color: '#ef4444' }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADD */}
      {tab === 'add' && (
        <div className="card" style={{ maxWidth: '480px' }}>
          <form onSubmit={addClient}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>{lbl('Nombre *')}<input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Juan Pérez" required /></div>
              <div>{lbl('No. Cliente CONTPAQ')}<input value={form.contpaq_id} onChange={e => setForm(f => ({ ...f, contpaq_id: e.target.value }))} placeholder="12345" /></div>
              <div>{lbl('Teléfono')}<input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="81 1234 5678" /></div>
              <div>{lbl('Vendedor asignado')}<select value={form.seller_id} onChange={e => setForm(f => ({ ...f, seller_id: e.target.value }))}><option value="">Sin asignar</option>{sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              {typeSelect(form.client_type, e => setForm(f => ({ ...f, client_type: e.target.value })))}
              <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Agregar cliente'}</button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT */}
      {tab === 'edit' && editing && (
        <div className="card" style={{ maxWidth: '480px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '20px' }}>Editar cliente</h3>
          <form onSubmit={saveEdit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>{lbl('Nombre *')}<input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div>{lbl('No. Cliente CONTPAQ')}<input value={form.contpaq_id} onChange={e => setForm(f => ({ ...f, contpaq_id: e.target.value }))} /></div>
              <div>{lbl('Teléfono')}<input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div>{lbl('Vendedor asignado')}<select value={form.seller_id} onChange={e => setForm(f => ({ ...f, seller_id: e.target.value }))}><option value="">Sin asignar</option>{sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              {typeSelect(form.client_type, e => setForm(f => ({ ...f, client_type: e.target.value })))}
              <div>
                {lbl('Código de acceso')}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }} />
                  <button type="button" className="btn btn-ghost" onClick={() => setForm(f => ({ ...f, code: generateCode() }))} style={{ padding: '10px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}>🎲 Nuevo</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex: 1 }}>{loading ? 'Guardando...' : 'Guardar cambios'}</button>
                <button type="button" className="btn btn-ghost" onClick={() => { setEditing(null); setForm(EMPTY_FORM); setTab('list') }}>Cancelar</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* BULK */}
      {tab === 'bulk' && (
        <div className="card" style={{ maxWidth: '480px' }}>
          <p style={{ color: '#8899bb', fontSize: '13px', marginBottom: '20px' }}>Genera múltiples clientes con códigos aleatorios.</p>
          <form onSubmit={addBulk}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>{lbl('Cantidad')}<input type="number" min="1" max="100" value={bulk.count} onChange={e => setBulk(b => ({ ...b, count: e.target.value }))} /></div>
              <div>{lbl('Vendedor asignado')}<select value={bulk.seller_id} onChange={e => setBulk(b => ({ ...b, seller_id: e.target.value }))}><option value="">Sin asignar</option>{sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              {typeSelect(bulk.client_type, e => setBulk(b => ({ ...b, client_type: e.target.value })))}
              <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Generando...' : `Generar ${bulk.count} clientes`}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
