import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function Login() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const input = code.trim().toUpperCase()

    // Admin
    if (input === import.meta.env.VITE_ADMIN_PASSWORD?.toUpperCase()) {
      localStorage.setItem('role', 'admin')
      setLoading(false)
      navigate('/admin')
      return
    }

    // Vendedor
    const { data: seller } = await supabase
      .from('sellers').select('*').eq('code', input).single()
    if (seller) {
      localStorage.setItem('role', 'seller')
      localStorage.setItem('seller', JSON.stringify(seller))
      setLoading(false)
      navigate('/vendedor')
      return
    }

    // Cliente
    const { data: client } = await supabase
      .from('clients').select('*').eq('code', input).single()
    if (client) {
      localStorage.setItem('role', 'client')
      localStorage.setItem('client', JSON.stringify(client))
      setLoading(false)
      navigate('/cliente')
      return
    }

    setError('Código no válido. Verifica con tu vendedor.')
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #1a0808 100%)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '64px', marginBottom: '8px' }}>⚽</div>
        <h1 style={{ fontSize: '52px', color: '#f0f4ff', lineHeight: 1 }}>QUINIELA</h1>
        <h2 style={{ fontSize: '30px', color: '#e8281e', lineHeight: 1, marginBottom: '8px' }}>
          INTERPARTS 2026
        </h2>
        <p style={{ color: '#8899bb', fontSize: '13px' }}>
          FIFA World Cup · México · USA · Canadá
        </p>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: '380px' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '6px' }}>Ingresa tu código</h3>
        <p style={{ color: '#8899bb', fontSize: '13px', marginBottom: '24px' }}>
          Tu código único fue enviado por WhatsApp
        </p>
        <form onSubmit={handleLogin}>
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Ej: CLI-001"
            style={{ marginBottom: '16px', fontSize: '18px',
              textAlign: 'center', letterSpacing: '0.1em', textTransform: 'uppercase' }}
            autoFocus
          />
          {error && (
            <p style={{ color: '#ef4444', fontSize: '13px',
              marginBottom: '16px', textAlign: 'center' }}>{error}</p>
          )}
          <button className="btn btn-primary" type="submit"
            disabled={loading || !code.trim()}
            style={{ width: '100%', fontSize: '16px', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Verificando...' : 'Entrar →'}
          </button>
        </form>
      </div>

      <p style={{ color: '#3a4a6a', fontSize: '12px', marginTop: '32px' }}>
        Interparts Monterrey · interpartsmty.com.mx
      </p>
    </div>
  )
}
