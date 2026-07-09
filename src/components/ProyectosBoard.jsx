import { useState } from 'react'

const orange = '#E8641A'
const dark = '#1A1A1A'

const ESTADOS = ['En curso', 'Pausado', 'Finalizado', 'Sin estado']
const ESTADO_LABELS = { 'En curso': 'En curso', 'Pausado': 'Pausado', 'Finalizado': 'Finalizado', 'Sin estado': 'Sin estado' }
const ESTADO_COLORS = { 'En curso': '#10B981', 'Pausado': '#F59E0B', 'Finalizado': '#6B7280', 'Sin estado': '#D1D5DB' }

function pctChecklist(checklist, proyectoId) {
  const items = checklist.filter(c => c.proyecto_armar_id === proyectoId && c.aplica !== false)
  if (!items.length) return null
  const totalPeso = items.reduce((s, c) => s + (c.peso || 1), 0)
  const donePeso = items.filter(c => c.estado === 'completado').reduce((s, c) => s + (c.peso || 1), 0)
  return totalPeso ? Math.round((donePeso / totalPeso) * 100) : 0
}

export default function ProyectosBoard({ proyectos, checklist }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = proyectos.filter(p =>
    !search || p.nombre?.toLowerCase().includes(search.toLowerCase()) || p.cliente?.toLowerCase().includes(search.toLowerCase())
  )

  const byEstado = {}
  ESTADOS.forEach(e => { byEstado[e] = [] })
  filtered.forEach(p => {
    const e = p.estado_general || 'Sin estado'
    const key = ESTADOS.includes(e) ? e : 'Sin estado'
    byEstado[key].push(p)
  })

  return (
    <div style={{ padding: 32, fontFamily: "'Outfit', sans-serif", height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: dark, margin: 0 }}>Proyectos</h1>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar proyecto o cliente…"
          style={{ padding: '8px 14px', border: '1px solid #E0DDD8', borderRadius: 10, fontSize: 13, width: 240, fontFamily: 'inherit', outline: 'none' }}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 16 }}>
        {ESTADOS.map(estado => (
          <div key={estado} style={{ minWidth: 240, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: ESTADO_COLORS[estado], display: 'inline-block' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: dark }}>{ESTADO_LABELS[estado]}</span>
              <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 'auto' }}>{byEstado[estado]?.length || 0}</span>
            </div>
            {(byEstado[estado] || []).map(p => {
              const avance = p.avance_total ?? null
              const pct = pctChecklist(checklist, p.id)
              return (
                <div key={p.id} onClick={() => setSelected(p)}
                  style={{ background: 'white', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F0EDE8', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: dark, marginBottom: 2 }}>{p.nombre}</div>
                  {p.comitente && <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8 }}>{p.comitente}</div>}
                  {avance !== null && (
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>Avance obra: {avance}%</div>
                      <div style={{ height: 4, background: '#F0EDE8', borderRadius: 2 }}>
                        <div style={{ height: 4, background: avance >= 100 ? '#10B981' : orange, borderRadius: 2, width: `${avance}%` }} />
                      </div>
                    </div>
                  )}
                  {pct !== null && (
                    <div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>Checklist: {pct}%</div>
                      <div style={{ height: 4, background: '#F0EDE8', borderRadius: 2 }}>
                        <div style={{ height: 4, background: pct >= 100 ? '#10B981' : '#8B5CF6', borderRadius: 2, width: `${pct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setSelected(null)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 32, width: 480, maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: dark }}>{selected.nombre}</h2>
                {selected.cliente && <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{selected.cliente}</div>}
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
              {[['Estado', selected.estado], ['Dirección', selected.direccion], ['Responsable', selected.responsable], ['Fecha inicio', selected.fecha_inicio]].map(([k, v]) =>
                v ? <div key={k}><span style={{ color: '#6B7280' }}>{k}: </span><strong>{v}</strong></div> : null
              )}
            </div>
            {selected.descripcion && <p style={{ fontSize: 13, color: '#4B5563', marginTop: 16, lineHeight: 1.6 }}>{selected.descripcion}</p>}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: dark, marginBottom: 10 }}>Checklist</div>
              {checklist.filter(c => c.proyecto_armar_id === selected.id).slice(0, 10).map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #F3F4F6', fontSize: 12 }}>
                  <span style={{ fontSize: 16 }}>{c.estado === 'completado' ? '✅' : c.estado === 'en_progreso' ? '🔄' : '⬜'}</span>
                  <span style={{ color: dark }}>{c.titulo}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
