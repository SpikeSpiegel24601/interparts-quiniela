import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'

export default function AdminSellers() {
  const [sellers, setSellers] = useState([])
  const [form, setForm] = useState({ name: '', code: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { loadSellers() }, [])

  async function loadSellers() {
    const { data } = await supabase.from('sellers').select('*, clients(count)').order('name')
    setSellers(data || [])
  }

  async function addSeller(e) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    const code = form.code.trim().toUpperCase() || `VEN-${String(sellers.length + 1).padStart(2, '0')}`
    const { error } = await supabase.from('sellers').insert({
      name: form.name.trim(), code
    })
    if (error) setMsg('Error: ' + error.message)
    else { setMsg(`✅ Vendedor agregado. Código: ${code}`); setForm({ name: '', code: '' }); loadSellers() }
    setLoading(false)
  }

  async function deleteSeller(id) {
    if (!confirm('¿Eliminar vendedor?')) return
    await supabase.from('sellers').delete().eq('id', id)
    loadSellers()
  }

  return (
    <div>
      <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>VENDEDORES</h1>
      <p style={{ color: '#8899bb', marginBottom: '24px' }}>
        Cada vendedor tiene un código para ver solo sus clientes
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Form */}
        <div className="card">
          <h3 style={{ fontSize: '20px', marginBottom: '20px' }}>Agregar vendedor</h3>
          <form onSubmit={addSeller}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#8899bb', marginBottom: '6px', display: 'block' }}>Nombre *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Carlos López" required />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#8899bb', marginBottom: '6px', display: 'block' }}>
                  Código (opcional — se genera automático)
                </label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="VEN-01" maxLength={12} />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Agregar vendedor'}
              </button>
              {msg && <p style={{ color: msg.includes('Error') ? '#ef4444' : '#22c55e', fontSize: '13px' }}>{msg}</p>}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="card">
          <h3 style={{ fontSize: '20px', marginBottom: '20px' }}>
            Vendedores ({sellers.length}/4)
          </h3>
          {sellers.length === 0 ? (
            <p style={{ color: '#8899bb' }}>No hay vendedores aún.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sellers.map(s => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', background: '#0a0f1e',
                  borderRadius: '8px', border: '1px solid #2a3a55'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{s.name}</div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#8899bb' }}>
                      <span>Código: <span style={{ color: '#e8281e', fontFamily: 'monospace', fontWeight: 700 }}>{s.code}</span></span>
                      <span>{s.clients?.[0]?.count || 0} clientes</span>
                    </div>
                  </div>
                  <button className="btn btn-ghost" onClick={() => deleteSeller(s.id)}
                    style={{ padding: '6px 10px', fontSize: '12px', color: '#ef4444' }}>🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
