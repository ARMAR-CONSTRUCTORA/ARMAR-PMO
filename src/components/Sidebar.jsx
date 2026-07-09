const orange = '#E8641A'
const dark = '#1A1A1A'

const NAV = [
  { key: 'dashboard',  label: 'Dashboard',    icon: '◈' },
  { key: 'proyectos',  label: 'Proyectos',    icon: '⬡' },
  { key: 'alertas',   label: 'Alertas',      icon: '⚠' },
  { key: 'calendario',label: 'Calendario',   icon: '⊞' },
]

export default function Sidebar({ page, setPage, usuario, onLogout }) {
  return (
    <div style={{ width: 220, minHeight: '100vh', background: dark, display: 'flex', flexDirection: 'column', padding: '24px 0', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ padding: '0 24px 28px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
          ARMAR <span style={{ color: orange }}>PMO</span>
        </div>
      </div>
      <nav style={{ flex: 1 }}>
        {NAV.map(n => {
          const active = page === n.key
          return (
            <button key={n.key} onClick={() => setPage(n.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '11px 24px', border: 'none', cursor: 'pointer',
                background: active ? 'rgba(232,100,26,0.15)' : 'transparent',
                borderLeft: active ? `3px solid ${orange}` : '3px solid transparent',
                color: active ? orange : '#9CA3AF',
                fontSize: 14, fontWeight: active ? 600 : 400, fontFamily: 'inherit',
                textAlign: 'left', transition: 'all 0.15s',
              }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              {n.label}
            </button>
          )
        })}
      </nav>
      <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>{usuario?.nombre}</div>
        <button onClick={onLogout}
          style={{ fontSize: 12, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
          Cerrar sesión →
        </button>
      </div>
    </div>
  )
}
