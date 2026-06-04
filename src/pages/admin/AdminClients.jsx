import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const part = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${part(4)}-${part(4)}`
}

export default function AdminClients() {
  const [clients, setClients] = useState([])
  const [sellers, setSellers] = useState([])
  const [form, setForm] = useState({ name: '', phone: '', seller_id: '' })
  const [bulk, setBulk] = useState({ count: 10, seller_id: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [tab, setTab] = useState('list')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [{ data: c }, { data: s }] = await Promise.all([
      supabase.from('clients').select('*, sellers(name)').order('created_at'),
      supabase.from('sellers').select('*').order('name')
    ])
    setClients(c || [])
    setSellers(s || [])
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
      code
    })
    if (error) setMsg('Error: ' + error.message)
    else { setMsg(`✅ Cliente agregado. Código: ${code}`); setForm({ name: '', phone: '', seller_id: '' }); loadAll() }
    setLoading(false)
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
    <button onClick={() => setTab(key)} className="btn"
      style={{
        padding: '8px 20px', fontSize: '13px',
        background: tab === key ? '#e8281e' : 'transparent',
        color: tab === key ? 'white' : '#8899bb',
        border: '1px solid ' + (tab === key ? '#e8281e' : '#2a3a55'),
        borderRadius: '8px'
      }}>{label}</button>
  )

  return (
    <div>
      <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>CLIENTES</h1>
      <p style={{ color: '#8899bb', marginBottom: '24px' }}>Gestiona los clientes participantes</p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {tabBtn('list', `📋 Lista (${clients.length})`)}
        {tabBtn('add', '➕ Agregar uno')}
        {tabBtn('bulk', '⚡ Generar masivo')}
      </div>

      {msg && <div className="card" style={{ marginBottom: '16px', borderColor: msg.includes('Error') ? '#ef4444' : '#22c55e' }}>
        <p style={{ color: msg.includes('Error') ? '#ef4444' : '#22c55e', fontSize: '13px' }}>{msg}</p>
      </div>}

      {tab === 'list' && (
        <div className="card">
          {clients.length === 0 ? (
            <p style={{ color: '#8899bb' }}>No hay clientes aún.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a3a55' }}>
                    {['Código', 'Nombre', 'Teléfono', 'Vendedor', ''].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left',
                        color: '#8899bb', fontSize: '12px', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #1a2235' }}>
                      <td style={{ padding: '12px', fontFamily: 'monospace', color: '#e8281e', fontWeight: 700 }}>{c.code}</td>
                      <td style={{ padding: '12px', fontWeight: 500 }}>{c.name}</td>
                      <td style={{ padding: '12px', color: '#8899bb' }}>{c.phone || '—'}</td>
                      <td style={{ padding: '12px', color: '#8899bb' }}>{c.sellers?.name || '—'}</td>
                      <td style={{ padding: '12px' }}>
                        <button className="btn btn-ghost" onClick={() => deleteClient(c.id)}
                          style={{ padding: '4px 10px', fontSize: '12px', color: '#ef4444' }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'add' && (
        <div className="card" style={{ maxWidth: '480px' }}>
          <form onSubmit={addClient}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#8899bb', marginBottom: '6px', display: 'block' }}>Nombre *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Juan Pérez" required />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#8899bb', marginBottom: '6px', display: 'block' }}>Teléfono</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="81 1234 5678" />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#8899bb', marginBottom: '6px', display: 'block' }}>Vendedor asignado</label>
                <select value={form.seller_id} onChange={e => setForm(f => ({ ...f, seller_id: e.target.value }))}>
                  <option value="">Sin asignar</option>
                  {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Agregar cliente'}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === 'bulk' && (
        <div className="card" style={{ maxWidth: '480px' }}>
          <p style={{ color: '#8899bb', fontSize: '13px', marginBottom: '20px' }}>
            Genera múltiples clientes con códigos aleatorios listos para enviar por WhatsApp.
          </p>
          <form onSubmit={addBulk}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#8899bb', marginBottom: '6px', display: 'block' }}>Cantidad</label>
                <input type="number" min="1" max="100" value={bulk.count}
                  onChange={e => setBulk(b => ({ ...b, count: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#8899bb', marginBottom: '6px', display: 'block' }}>Vendedor asignado</label>
                <select value={bulk.seller_id} onChange={e => setBulk(b => ({ ...b, seller_id: e.target.value }))}>
                  <option value="">Sin asignar</option>
                  {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? 'Generando...' : `Generar ${bulk.count} clientes`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
