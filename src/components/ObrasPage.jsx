import { useState } from 'react'

const orange = '#E8641A'
const dark = '#1A1A1A'

function statusColor(s) {
  if (s === 'activa') return { bg: '#D1FAE5', color: '#065F46' }
  if (s === 'pausada') return { bg: '#FEF3C7', color: '#D97706' }
  if (s === 'finalizada') return { bg: '#F3F4F6', color: '#6B7280' }
  return { bg: '#F3F4F6', color: '#6B7280' }
}

function diasRestantes(fecha) {
  if (!fecha) return null
  return Math.ceil((new Date(fecha) - new Date()) / 86400000)
}

export default function ObrasPage({ obras, proyectos }) {
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = obras.filter(o =>
    !search || o.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.responsible?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedProy = selected
    ? proyectos.find(p => p.id === selected.proyecto_armar_id)
    : null

  return (
    <div style={{ padding: 32, fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: dark, margin: 0 }}>Obras</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>{obras.length} obras registradas</p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar obra o responsable…"
          style={{ padding: '8px 14px', border: '1px solid #E0DDD8', borderRadius: 10, fontSize: 13, width: 240, fontFamily: 'inherit', outline: 'none' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filtered.map(o => {
          const dias = diasRestantes(o.end_date)
          const sc = statusColor(o.status)
          const proy = proyectos.find(p => p.id === o.proyecto_armar_id)
          return (
            <div key={o.id} onClick={() => setSelected(o)}
              style={{ background: 'white', borderRadius: 16, padding: '20px', cursor: 'pointer', border: '1px solid #F0EDE8', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1, paddingRight: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: dark }}>{o.name}</div>
                  {o.location && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{o.location}</div>}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  {o.status || 'sin estado'}
                </span>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                  <span>Avance</span>
                  <span style={{ fontWeight: 700, color: dark }}>{o.progress ?? 0}%</span>
                </div>
                <div style={{ height: 6, background: '#F0EDE8', borderRadius: 3 }}>
                  <div style={{ height: 6, borderRadius: 3, background: (o.progress ?? 0) >= 100 ? '#10B981' : orange, width: `${o.progress ?? 0}%`, transition: 'width 0.3s' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                {o.responsible && (
                  <div><span style={{ color: '#9CA3AF' }}>Responsable: </span><span style={{ color: dark, fontWeight: 500 }}>{o.responsible}</span></div>
                )}
                {o.contratista && (
                  <div><span style={{ color: '#9CA3AF' }}>Contratista: </span><span style={{ color: dark, fontWeight: 500 }}>{o.contratista}</span></div>
                )}
                {o.start_date && (
                  <div><span style={{ color: '#9CA3AF' }}>Inicio: </span><span style={{ color: dark }}>{o.start_date}</span></div>
                )}
                {o.end_date && (
                  <div>
                    <span style={{ color: '#9CA3AF' }}>Fin: </span>
                    <span style={{ color: dias !== null && dias < 30 ? '#EF4444' : dark, fontWeight: dias !== null && dias < 30 ? 700 : 400 }}>
                      {o.end_date} {dias !== null && dias >= 0 ? `(${dias}d)` : dias !== null ? '(vencida)' : ''}
                    </span>
                  </div>
                )}
              </div>

              {proy && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #F0EDE8', fontSize: 11, color: '#9CA3AF' }}>
                  Proyecto: <span style={{ color: '#6B7280', fontWeight: 500 }}>{proy.nombre}</span>
                  {proy.avance_total != null && <span style={{ marginLeft: 8 }}>· Avance global: <strong style={{ color: dark }}>{proy.avance_total}%</strong></span>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setSelected(null)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 32, width: 520, maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: dark }}>{selected.name}</h2>
                {selected.location && <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{selected.location}</div>}
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B7280', marginBottom: 6 }}>
                <span>Avance de obra</span><strong style={{ color: dark }}>{selected.progress ?? 0}%</strong>
              </div>
              <div style={{ height: 8, background: '#F0EDE8', borderRadius: 4 }}>
                <div style={{ height: 8, borderRadius: 4, background: orange, width: `${selected.progress ?? 0}%` }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, marginBottom: 20 }}>
              {[
                ['Estado', selected.status],
                ['Responsable', selected.responsible],
                ['Contratista', selected.contratista],
                ['Inicio', selected.start_date],
                ['Fin previsto', selected.end_date],
                ['Tipo de obra', selected.tipo_obra],
              ].map(([k, v]) => v ? (
                <div key={k}><span style={{ color: '#6B7280' }}>{k}: </span><strong>{v}</strong></div>
              ) : null)}
            </div>

            {selectedProy && (
              <div style={{ background: '#F9F9F7', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', marginBottom: 8 }}>PROYECTO ARMAR</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: dark }}>{selectedProy.nombre}</div>
                {selectedProy.comitente && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Comitente: {selectedProy.comitente}</div>}
                {selectedProy.responsable_armar && <div style={{ fontSize: 12, color: '#6B7280' }}>Responsable ARMAR: {selectedProy.responsable_armar}</div>}
                {selectedProy.avance_total != null && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Avance global: {selectedProy.avance_total}%</div>
                    <div style={{ height: 4, background: '#E0DDD8', borderRadius: 2 }}>
                      <div style={{ height: 4, borderRadius: 2, background: '#8B5CF6', width: `${selectedProy.avance_total}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {selected.link_documentacion && (
              <a href={selected.link_documentacion} target="_blank" rel="noreferrer"
                style={{ display: 'inline-block', fontSize: 13, color: orange, fontWeight: 600, textDecoration: 'none' }}>
                Ver documentación →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
