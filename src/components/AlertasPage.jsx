import { useState } from 'react'

const dark = '#1A1A1A'
const orange = '#E8641A'

function diasRestantes(fecha) {
  if (!fecha) return null
  const d = Math.ceil((new Date(fecha) - new Date()) / 86400000)
  return d
}

function Chip({ label, color, bg }) {
  return <span style={{ fontSize: 11, fontWeight: 600, color, background: bg, padding: '2px 8px', borderRadius: 20 }}>{label}</span>
}

export default function AlertasPage({ checklist, proyectos }) {
  const [filtro, setFiltro] = useState('todas')

  const hoy = new Date()

  const alertas = checklist
    .filter(c => c.estado !== 'completado' && c.fecha_objetivo)
    .map(c => {
      const dias = diasRestantes(c.fecha_objetivo)
      const proyecto = proyectos.find(p => p.id === c.proyecto_armar_id)
      return { ...c, dias, proyecto }
    })
    .sort((a, b) => a.dias - b.dias)

  const vencidas = alertas.filter(a => a.dias < 0)
  const hoy7 = alertas.filter(a => a.dias >= 0 && a.dias <= 7)
  const proximas = alertas.filter(a => a.dias > 7)

  const grupos = { vencidas, hoy7, proximas }
  const lista = filtro === 'todas' ? alertas : (grupos[filtro] || [])

  function chipAlerta(dias) {
    if (dias < 0) return <Chip label={`Vencida hace ${Math.abs(dias)} días`} color="#991B1B" bg="#FEE2E2" />
    if (dias === 0) return <Chip label="Vence hoy" color="#D97706" bg="#FEF3C7" />
    if (dias <= 7) return <Chip label={`En ${dias} días`} color="#D97706" bg="#FEF3C7" />
    return <Chip label={`En ${dias} días`} color="#065F46" bg="#D1FAE5" />
  }

  return (
    <div style={{ padding: 32, fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: dark, margin: 0 }}>Alertas</h1>
        <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>Tareas pendientes con fecha límite</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          ['todas', `Todas (${alertas.length})`],
          ['vencidas', `Vencidas (${vencidas.length})`],
          ['hoy7', `Próx. 7 días (${hoy7.length})`],
          ['proximas', `Más adelante (${proximas.length})`],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setFiltro(key)}
            style={{ padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: filtro === key ? 700 : 400, background: filtro === key ? dark : 'white', color: filtro === key ? 'white' : '#6B7280' }}>
            {label}
          </button>
        ))}
      </div>

      {lista.length === 0
        ? <div style={{ background: 'white', borderRadius: 16, padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Sin alertas en este filtro ✓</div>
        : (
          <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F9F9F7' }}>
                  {['Proyecto', 'Tarea', 'Etapa', 'Responsable', 'Fecha límite', 'Estado'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', borderBottom: '1px solid #F0EDE8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #F0EDE8' }}>
                    <td style={{ padding: '10px 16px', color: '#6B7280' }}>{a.proyecto?.nombre || '—'}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 500, color: dark }}>{a.titulo}</td>
                    <td style={{ padding: '10px 16px', color: '#6B7280' }}>{a.etapa || '—'}</td>
                    <td style={{ padding: '10px 16px', color: '#6B7280' }}>{a.responsable || '—'}</td>
                    <td style={{ padding: '10px 16px' }}>{a.fecha_objetivo}</td>
                    <td style={{ padding: '10px 16px' }}>{chipAlerta(a.dias)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  )
}
