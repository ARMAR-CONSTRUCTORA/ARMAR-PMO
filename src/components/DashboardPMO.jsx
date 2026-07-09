const orange = '#E8641A'
const dark = '#1A1A1A'

function Card({ title, value, sub, color }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: '24px', flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 500, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 36, fontWeight: 800, color: color || dark }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function estadoColor(estado) {
  const m = { activo: '#10B981', pausado: '#F59E0B', completado: '#6B7280', en_ejecucion: '#3B82F6', planificacion: '#8B5CF6' }
  return m[estado] || '#D1D5DB'
}

export default function DashboardPMO({ proyectos, checklist, obras, eventos }) {
  const activos = proyectos.filter(p => p.estado_general === 'En curso')
  const totalChecklist = checklist.length
  const completados = checklist.filter(c => c.estado === 'completado').length
  const pctGlobal = totalChecklist ? Math.round((completados / totalChecklist) * 100) : 0

  const hoy = new Date()
  const proxEventos = eventos.filter(e => new Date(e.fecha) >= hoy).slice(0, 5)

  const alertas = checklist.filter(c => {
    if (!c.fecha_objetivo || c.estado === 'completado') return false
    return new Date(c.fecha_objetivo) < hoy
  })

  return (
    <div style={{ padding: 32, fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: dark, margin: 0 }}>Dashboard PMO</h1>
        <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>Resumen ejecutivo de proyectos</p>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <Card title="Proyectos activos" value={activos.length} sub={`de ${proyectos.length} total`} color={orange} />
        <Card title="Avance global checklist" value={`${pctGlobal}%`} sub={`${completados}/${totalChecklist} tareas`} color="#10B981" />
        <Card title="Items vencidos" value={alertas.length} sub="sin completar" color={alertas.length > 0 ? '#EF4444' : '#10B981'} />
        <Card title="Próximos eventos" value={proxEventos.length} sub="en agenda" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: dark, marginBottom: 16, marginTop: 0 }}>Estado de proyectos</h3>
          {proyectos.length === 0
            ? <p style={{ color: '#9CA3AF', fontSize: 13 }}>Sin proyectos cargados</p>
            : proyectos.slice(0, 8).map(p => (
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
                <div style={{ minWidth: 42, textAlign: 'center', background: '#FEF3C7', borderRadius: 8, padding: '4px 6px' }}>
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

        {alertas.length > 0 && (
          <div style={{ background: '#FEF2F2', borderRadius: 16, padding: 24, gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#991B1B', marginBottom: 16, marginTop: 0 }}>⚠ Tareas vencidas ({alertas.length})</h3>
            {alertas.slice(0, 6).map(a => (
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
