import { useState } from 'react'

const dark = '#1A1A1A'
const orange = '#E8641A'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function CalendarioMaestro({ eventos, checklist, proyectos }) {
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth())
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [diaSelec, setDiaSelec] = useState(null)

  const primerDia = new Date(anio, mes, 1)
  const totalDias = new Date(anio, mes + 1, 0).getDate()
  const startDow = primerDia.getDay()

  function prevMes() { if (mes === 0) { setMes(11); setAnio(anio - 1) } else setMes(mes - 1) }
  function nextMes() { if (mes === 11) { setMes(0); setAnio(anio + 1) } else setMes(mes + 1) }

  function eventosDelDia(fecha) {
    const ev = eventos.filter(e => sameDay(new Date(e.fecha + 'T00:00'), fecha))
    const tareas = checklist.filter(c => c.fecha_objetivo && sameDay(new Date(c.fecha_objetivo + 'T00:00'), fecha) && c.estado !== 'completado')
    return { ev, tareas }
  }

  const diasContenido = []
  for (let i = 0; i < startDow; i++) diasContenido.push(null)
  for (let d = 1; d <= totalDias; d++) diasContenido.push(new Date(anio, mes, d))

  const selData = diaSelec ? eventosDelDia(diaSelec) : null

  return (
    <div style={{ padding: 32, fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: dark, margin: 0 }}>Calendario maestro</h1>
      </div>

      <div style={{ background: 'white', borderRadius: 20, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={prevMes} style={{ background: 'none', border: '1px solid #E0DDD8', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 14 }}>‹</button>
          <span style={{ fontSize: 16, fontWeight: 700, color: dark }}>{MESES[mes]} {anio}</span>
          <button onClick={nextMes} style={{ background: 'none', border: '1px solid #E0DDD8', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 14 }}>›</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
          {DIAS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9CA3AF', paddingBottom: 8 }}>{d}</div>)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {diasContenido.map((fecha, i) => {
            if (!fecha) return <div key={i} />
            const { ev, tareas } = eventosDelDia(fecha)
            const esHoy = sameDay(fecha, hoy)
            const selec = diaSelec && sameDay(fecha, diaSelec)
            const tieneAlgo = ev.length > 0 || tareas.length > 0
            return (
              <div key={i} onClick={() => setDiaSelec(selec ? null : fecha)}
                style={{
                  minHeight: 72, borderRadius: 10, padding: 8, cursor: 'pointer', position: 'relative',
                  background: selec ? '#FEF3C7' : esHoy ? '#FFF7F3' : '#F9F9F7',
                  border: `1px solid ${selec ? orange : esHoy ? '#FECACA' : '#F0EDE8'}`,
                  transition: 'all 0.15s',
                }}>
                <div style={{ fontSize: 13, fontWeight: esHoy ? 800 : 500, color: esHoy ? orange : dark }}>{fecha.getDate()}</div>
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {ev.slice(0, 2).map(e => (
                    <div key={e.id} style={{ fontSize: 9, background: '#DBEAFE', color: '#1D4ED8', borderRadius: 4, padding: '1px 4px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{e.titulo}</div>
                  ))}
                  {tareas.slice(0, 1).map(t => (
                    <div key={t.id} style={{ fontSize: 9, background: '#FEE2E2', color: '#991B1B', borderRadius: 4, padding: '1px 4px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{t.titulo}</div>
                  ))}
                  {(ev.length + tareas.length > 3) && <div style={{ fontSize: 9, color: '#9CA3AF' }}>+{ev.length + tareas.length - 3} más</div>}
                </div>
              </div>
            )
          })}
        </div>

        {diaSelec && selData && (
          <div style={{ marginTop: 24, borderTop: '1px solid #F0EDE8', paddingTop: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: dark }}>
              {diaSelec.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            {selData.ev.length === 0 && selData.tareas.length === 0 && (
              <p style={{ color: '#9CA3AF', fontSize: 13 }}>Sin eventos ni tareas este día.</p>
            )}
            {selData.ev.map(e => (
              <div key={e.id} style={{ background: '#DBEAFE', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1D4ED8' }}>{e.titulo}</div>
                {e.descripcion && <div style={{ fontSize: 12, color: '#3B82F6', marginTop: 2 }}>{e.descripcion}</div>}
              </div>
            ))}
            {selData.tareas.map(t => {
              const proy = proyectos.find(p => p.id === t.proyecto_armar_id)
              return (
                <div key={t.id} style={{ background: '#FEE2E2', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#991B1B' }}>{t.titulo}</div>
                  <div style={{ fontSize: 12, color: '#EF4444', marginTop: 2 }}>{proy?.nombre} · {t.etapa || 'Sin etapa'}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 12, color: '#6B7280' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#DBEAFE', borderRadius: 2, marginRight: 4 }} />Eventos</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#FEE2E2', borderRadius: 2, marginRight: 4 }} />Tareas vencidas</span>
      </div>
    </div>
  )
}
