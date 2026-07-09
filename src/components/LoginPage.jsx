import { useState } from 'react'

const orange = '#E8641A'
const dark = '#1A1A1A'
const border = '#E0DDD8'

export default function LoginPage({ onLogin }) {
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    await onLogin(nombre, password)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '48px 40px', width: 380, boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: dark, letterSpacing: '-0.5px' }}>
            ARMAR <span style={{ color: orange }}>PMO</span>
          </div>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>Panel de gestión de proyectos</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Usuario</label>
            <input
              value={nombre} onChange={e => setNombre(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${border}`, borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
              placeholder="Tu nombre de usuario"
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${border}`, borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit" disabled={loading || !nombre || !password}
            style={{ width: '100%', padding: '12px', background: orange, color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
