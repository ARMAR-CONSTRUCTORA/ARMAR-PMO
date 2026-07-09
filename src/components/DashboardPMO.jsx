const orange = '#E8641A'
const dark = '#1A1A1A'

const PRIORIDAD_CFG = {
  urgente: { bg: '#FEE2E2', color: '#991B1B' },
  alta:    { bg: '#FEF3C7', color: '#D97706' },
  normal:  { bg: '#F3F4F6', color: '#6B7280' },
  baja:    { bg: '#EFF6FF', color: '#1D4ED8' },
}

function Card({ title, value, sub, color }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: '24px', flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 500, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 36, fontWeight: 800, color: color || dark }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function estadoColor(estado) {
  const m = { 'En curso': '#10B981', 'Pausado': '#F59E0B', 'Finalizado': '#6B7280' }
  return m[estado] || '#D1D5DB'
}

function diasRestantes(fecha) {
  if (!fecha) return null
  return Math.ceil((new Date(fecha + 'T00:00') - new Date()) / 86400000)
}

export default function DashboardPMO({ proyectos, checklist, obras, eventos, tareas = [] }) {
  const activos = proyectos.filter(p => p.estado_general === 'En curso')
  const totalChecklist = checklist.length
  const completados = checklist.filter(c => c.estado === 'completado').length
  const pctGlobal = totalChecklist ? Math.round((completados / totalChecklist) * 100) : 0

  const hoy = new Date()
  const proxEventos = eventos.filter(e => new Date(e.fecha) >= hoy).slice(0, 4)

  const alertasChecklist = checklist.filter(c => {
    if (!c.fecha_objetivo || c.estado === 'completado') return false
    return new Date(c.fecha_objetivo) < hoy
  })

  const tareasPendientes = tareas.filter(t => t.estado !== 'completado')
  const tareasHoy = tareasPendientes.filter(t => diasRestantes(t.fecha_vencimiento) === 0)
  const tareasVencidas = tareasPendientes.filter(t => {
    const d = diasRestantes(t.fecha_vencimiento)
    return d !== null && d < 0
  })
  const tareasProximas = tareasPendientes.filter(t => {
    const d = diasRestantes(t.fecha_vencimiento)
    return d !== null && d > 0 && d <= 7
  }).slice(0, 5)

  return (
    <div style={{ padding: 32, fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: dark, margin: 0 }}>Dashboard PMO</h1>
        <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>Resumen ejecutivo de proyectos</p>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <Card title="Proyectos activos" value={activos.length} sub={`de ${proyectos.length} total`} color={orange} />
        <Card title="Mis tareas pendientes" value={tareasPendientes.length} sub={tareasVencidas.length > 0 ? `${tareasVencidas.length} vencidas` : 'al día'} color={tareasVencidas.length > 0 ? '#EF4444' : dark} />
        <Card title="Avance checklist global" value={`${pctGlobal}%`} sub={`${completados}/${totalChecklist} ítems`} color="#10B981" />
        <Card title="Próximos eventos" value={proxEventos.length} sub="en agenda" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        <div style={{ background: 'white', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: dark, margin: 0 }}>Mis tareas PMO</h3>
            {tareasVencidas.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: 10 }}>
                {tareasVencidas.length} vencida{tareasVencidas.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {tareasVencidas.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#991B1B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vencidas</div>
              {tareasVencidas.slice(0, 3).map(t => {
                const d = Math.abs(diasRestantes(t.fecha_vencimiento))
                const pr = PRIORIDAD_CFG[t.prioridad] || PRIORIDAD_CFG.normal
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #FEE2E2' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: dark, flex: 1 }}>{t.titulo}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>hace {d}d</span>
                    <span style={{ fontSize: 10, fontWeight: 600, background: pr.bg, color: pr.color, padding: '1px 6px', borderRadius: 8 }}>{t.prioridad}</span>
                  </div>
                )
              })}
            </div>
          )}

          {tareasHoy.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#D97706', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Para hoy</div>
              {tareasHoy.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #FEF3C7' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: dark, flex: 1 }}>{t.titulo}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, background: '#FEF3C7', color: '#D97706', padding: '1px 6px', borderRadius: 8 }}>hoy</span>
                </div>
              ))}
            </div>
          )}

          {tareasProximas.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Próximos 7 días</div>
              {tareasProximas.map(t => {
                const d = diasRestantes(t.fecha_vencimiento)
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #F3F4F6' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D1D5DB', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: dark, flex: 1 }}>{t.titulo}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>en {d}d</span>
                  </div>
                )
              })}
            </div>
          )}

          {tareasPendientes.length === 0 && (
            <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>Sin tareas pendientes ✓</p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: dark, marginBottom: 16, marginTop: 0 }}>Estado de proyectos</h3>
            {proyectos.length === 0
              ? <p style={{ color: '#9CA3AF', fontSize: 13 }}>Sin proyectos cargados</p>
              : proyectos.slice(0, 5).map(p => (
                <div key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: dark, fontWeight: 500 }}>{p.nombre}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'white', background: estadoColor(p.estado_general), padding: '2px 8px', borderRadius: 20 }}>
                      {p.estado_general || 'sin estado'}
                    </span>
                  </div>
                  {p.avance_total != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: '#F0EDE8', borderRadius: 2 }}>
                        <div style={{ height: 4, borderRadius: 2, background: p.avance_total >= 100 ? '#10B981' : orange, width: `${p.avance_total}%` }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#6B7280', minWidth: 28 }}>{p.avance_total}%</span>
                    </div>
                  )}
                </div>
              ))
            }
          </div>

          <div style={{ background: 'white', borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: dark, marginBottom: 16, marginTop: 0 }}>Próximos eventos</h3>
            {proxEventos.length === 0
              ? <p style={{ color: '#9CA3AF', fontSize: 13 }}>Sin eventos próximos</p>
              : proxEventos.map(ev => (
                <div key={ev.id} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #F3F4F6', alignItems: 'center' }}>
                  <div style={{ minWidth: 40, textAlign: 'center', background: '#FEF3C7', borderRadius: 8, padding: '4px 6px' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#D97706', lineHeight: 1 }}>{new Date(ev.fecha).getDate()}</div>
                    <div style={{ fontSize: 9, color: '#D97706', fontWeight: 600 }}>{new Date(ev.fecha).toLocaleString('es', { month: 'short' }).toUpperCase()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: dark }}>{ev.titulo}</div>
                    {ev.descripcion && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{ev.descripcion}</div>}
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {alertasChecklist.length > 0 && (
          <div style={{ background: '#FEF2F2', borderRadius: 16, padding: 24, gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#991B1B', marginBottom: 16, marginTop: 0 }}>⚠ Checklist vencido en proyectos ({alertasChecklist.length})</h3>
            {alertasChecklist.slice(0, 5).map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #FCA5A5', fontSize: 13 }}>
                <span style={{ color: dark }}>{a.titulo}</span>
                <span style={{ color: '#EF4444', fontWeight: 600 }}>{a.fecha_objetivo}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
