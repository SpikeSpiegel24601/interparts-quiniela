import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function RecoverCode() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    const { data } = await supabase
      .from('clients')
      .select('code, nombre_participante, name')
      .eq('phone', phone.trim())
      .single()

    if (data) {
      setResult(data)
    } else {
      setError('No encontramos ningún registro con ese número. Contacta a tu vendedor.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #1a0808 100%)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔑</div>
        <h1 style={{ fontSize: '36px', color: '#f0f4ff', lineHeight: 1 }}>RECUPERAR CÓDIGO</h1>
        <p style={{ color: '#8899bb', fontSize: '13px', marginTop: '8px' }}>
          Ingresa tu número de WhatsApp para encontrar tu código
        </p>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: '380px' }}>
        {!result ? (
          <form onSubmit={handleSearch}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#8899bb', marginBottom: '6px', display: 'block' }}>
                  No. Telefónico / WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="81 1234 5678"
                  required
                />
              </div>
              {error && <p style={{ color: '#ef4444', fontSize: '13px' }}>{error}</p>}
              <button className="btn btn-primary" type="submit" disabled={loading}
                style={{ fontSize: '15px', padding: '12px' }}>
                {loading ? 'Buscando...' : 'Buscar mi código →'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
            <p style={{ color: '#8899bb', fontSize: '13px', marginBottom: '8px' }}>
              Hola, <strong style={{ color: '#f0f4ff' }}>{result.nombre_participante || result.name}</strong>
            </p>
            <p style={{ color: '#8899bb', fontSize: '13px', marginBottom: '16px' }}>
              Tu código de acceso es:
            </p>
            <div style={{
              background: '#0a0f1e', borderRadius: '8px', padding: '16px',
              fontFamily: 'monospace', fontSize: '28px', letterSpacing: '0.15em',
              color: '#ffd700', fontWeight: 700, marginBottom: '16px'
            }}>
              {result.code}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(result.code)
                alert('¡Código copiado!')
              }}
              style={{
                background: '#f59e0b', color: '#0a0f1e', border: 'none',
                borderRadius: '8px', padding: '8px 20px', fontWeight: 700,
                fontSize: '13px', cursor: 'pointer', marginBottom: '16px', width: '100%'
              }}>
              📋 Copiar código
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/')}
              style={{ width: '100%', fontSize: '13px' }}>
              Ir al login →
            </button>
          </div>
        )}
      </div>

      <button onClick={() => navigate('/')}
        style={{ marginTop: '24px', background: 'none', border: 'none',
          color: '#8899bb', fontSize: '13px', cursor: 'pointer' }}>
        ← Regresar al login
      </button>
    </div>
  )
}
