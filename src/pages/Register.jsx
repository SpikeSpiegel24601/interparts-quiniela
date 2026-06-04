import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const part = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${part(4)}-${part(4)}`
}

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    razon_social: '',
    nombre_publico: '',
    nombre_participante: '',
    folio_nota: '',
    email: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [code, setCode] = useState(null) // código generado

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const newCode = generateCode()

    const { data, error: err } = await supabase.from('clients').insert({
      name: form.nombre_participante.trim(),
      razon_social: form.razon_social.trim(),
      nombre_publico: form.nombre_publico.trim() || null,
      nombre_participante: form.nombre_participante.trim(),
      folio_nota: form.folio_nota.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim(),
      code: newCode,
      client_type: 'standard',
      is_registered: true,
    }).select().single()

    if (err) {
      setError('Error al registrar. Intenta de nuevo.')
      setLoading(false)
      return
    }

    // Save to localStorage
    localStorage.setItem('role', 'client')
    localStorage.setItem('client', JSON.stringify(data))
    setCode(newCode)
    setLoading(false)
  }

  const lbl = (text, required = false) => (
    <label style={{ fontSize: '12px', color: '#8899bb', marginBottom: '6px', display: 'block' }}>
      {text} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
  )

  // Pantalla de éxito con código
  if (code) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '20px',
        background: 'linear-gradient(135deg, #0a0f1e 0%, #1a0808 100%)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎉</div>
          <h1 style={{ fontSize: '36px', color: '#f0f4ff', lineHeight: 1 }}>¡Registro exitoso!</h1>
          <p style={{ color: '#8899bb', fontSize: '13px', marginTop: '8px' }}>
            Hola, <strong style={{ color: '#f0f4ff' }}>{form.nombre_participante}</strong>
          </p>
        </div>

        {/* Código en amarillo */}
        <div style={{
          width: '100%', maxWidth: '420px',
          background: '#2a1a00', border: '2px solid #f59e0b',
          borderRadius: '12px', padding: '20px', marginBottom: '24px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#fcd34d', fontSize: '14px', marginBottom: '12px', lineHeight: 1.6 }}>
            ⚠️ <strong>¡Guarda este código!</strong> Es tu acceso a la quiniela.<br />
            Lo necesitarás cada vez que quieras entrar.
          </p>
          <div style={{
            background: '#0a0f1e', borderRadius: '8px', padding: '16px',
            fontFamily: 'monospace', fontSize: '32px', letterSpacing: '0.15em',
            color: '#ffd700', fontWeight: 700, marginBottom: '16px'
          }}>
            {code}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(code)
              alert('¡Código copiado!')
            }}
            style={{
              background: '#f59e0b', color: '#0a0f1e', border: 'none',
              borderRadius: '8px', padding: '10px 24px', fontWeight: 700,
              fontSize: '14px', cursor: 'pointer', width: '100%'
            }}>
            📋 Copiar código
          </button>
        </div>

        <div className="card" style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
          <p style={{ color: '#8899bb', fontSize: '13px', marginBottom: '16px', lineHeight: 1.5 }}>
            Tu participación está sujeta a validación por parte de Interparts Monterrey.<br />
            En breve podrás comenzar a hacer tus predicciones.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/cliente')}
            style={{ width: '100%', fontSize: '16px', padding: '14px' }}>
            Entrar a mis juegos →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #1a0808 100%)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>⚽</div>
        <h1 style={{ fontSize: '40px', color: '#f0f4ff', lineHeight: 1 }}>QUINIELA</h1>
        <h2 style={{ fontSize: '24px', color: '#e8281e', lineHeight: 1 }}>INTERPARTS 2026</h2>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: '480px' }}>
        <h3 style={{ fontSize: '22px', marginBottom: '6px' }}>Registro de participante</h3>
        <p style={{ color: '#8899bb', fontSize: '13px', marginBottom: '24px' }}>
          Llena tus datos para participar en la quiniela.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              {lbl('Nombre / Razón social que factura', true)}
              <input value={form.razon_social}
                onChange={e => setForm(f => ({ ...f, razon_social: e.target.value }))}
                placeholder="Ej: Empresa S.A. de C.V." required />
            </div>
            <div>
              {lbl('Nombre que compra a público en general')}
              <input value={form.nombre_publico}
                onChange={e => setForm(f => ({ ...f, nombre_publico: e.target.value }))}
                placeholder="Ej: Ferretería El Clavo" />
            </div>
            <div>
              {lbl('Nombre del participante', true)}
              <input value={form.nombre_participante}
                onChange={e => setForm(f => ({ ...f, nombre_participante: e.target.value }))}
                placeholder="Ej: Juan Pérez" required />
            </div>
            <div>
              {lbl('Número de folio de nota')}
              <input value={form.folio_nota}
                onChange={e => setForm(f => ({ ...f, folio_nota: e.target.value }))}
                placeholder="Ej: 12345" />
            </div>
            <div>
              {lbl('Correo electrónico')}
              <input type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="correo@empresa.com" />
            </div>
            <div>
              {lbl('No. Telefónico / WhatsApp', true)}
              <input type="tel" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="81 1234 5678" required />
            </div>

            {/* Disclaimer */}
            <div style={{
              background: '#0a0f1e', border: '1px solid #2a3a55',
              borderRadius: '8px', padding: '12px'
            }}>
              <p style={{ fontSize: '12px', color: '#8899bb', lineHeight: 1.6, margin: 0 }}>
                📋 Los datos proporcionados están sujetos a validación por parte de
                <strong style={{ color: '#f0f4ff' }}> Interparts Monterrey</strong>.
                La participación en la quiniela queda condicionada a dicha validación.
              </p>
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: '13px' }}>{error}</p>}

            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ fontSize: '16px', padding: '14px' }}>
              {loading ? 'Registrando...' : 'Registrarme →'}
            </button>
          </div>
        </form>
      </div>

      <button onClick={() => navigate('/')}
        style={{ marginTop: '24px', background: 'none', border: 'none',
          color: '#8899bb', fontSize: '13px', cursor: 'pointer' }}>
        ← Regresar al inicio
      </button>
    </div>
  )
}
