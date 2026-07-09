import { useState, useEffect } from 'react'
import { loadTareasPMO, upsertTareaPMO, deleteTareaPMO } from '../lib/supabase'
import { getStoredToken, connectGoogleCalendar, crearEventoCalendar, eliminarEventoCalendar, clearToken } from '../lib/googleCalendar'

const orange = '#E8641A'
const dark = '#1A1A1A'

const PRIORIDAD_CFG = {
  urgente: { label: 'Urgente', bg: '#FEE2E2', color: '#991B1B' },
  alta:    { label: 'Alta',    bg: '#FEF3C7', color: '#D97706' },
  normal:  { label: 'Normal',  bg: '#F3F4F6', color: '#6B7280' },
  baja:    { label: 'Baja',    bg: '#EFF6FF', color: '#1D4ED8' },
}

const TIPO_CFG = {
  manual:       { label: 'Gestión interna', bg: '#F3F4F6', color: '#6B7280' },
  revision:     { label: 'Revisión obra',   bg: '#EDE9FE', color: '#5B21B6' },
  cliente:      { label: 'Comunicación cliente', bg: '#ECFDF5', color: '#065F46' },
  alerta_auto:  { label: 'Alerta sistema',  bg: '#FEF3C7', color: '#D97706' },
}

function diasRestantes(fecha) {
  if (!fecha) return null
  return Math.ceil((new Date(fecha + 'T00:00') - new Date()) / 86400000)
}

function fechaChip(fecha) {
  if (!fecha) return null
  const d = diasRestantes(fecha)
  if (d < 0)  return { label: `Vencida hace ${Math.abs(d)}d`, bg: '#FEE2E2', color: '#991B1B' }
  if (d === 0) return { label: 'Vence hoy', bg: '#FEF3C7', color: '#D97706' }
  if (d <= 3)  return { label: `En ${d} días`, bg: '#FEF3C7', color: '#D97706' }
  return { label: fecha, bg: '#F3F4F6', color: '#6B7280' }
}

const RECORDATORIO_OPTS = [
  { value: 0,    label: 'Sin recordatorio' },
  { value: 10,   label: '10 minutos antes' },
  { value: 30,   label: '30 minutos antes' },
  { value: 60,   label: '1 hora antes' },
  { value: 120,  label: '2 horas antes' },
  { value: 1440, label: '1 día antes' },
  { value: 2880, label: '2 días antes' },
]

function googleCalendarUrl(tarea, proyectoNombre) {
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
  const title = encodeURIComponent(`[PMO] ${tarea.titulo}${proyectoNombre ? ' — ' + proyectoNombre : ''}`)

  let dates = ''
  if (tarea.fecha_vencimiento) {
    const d = tarea.fecha_vencimiento.replace(/-/g, '')
    if (tarea.hora_vencimiento) {
      const [h, m] = tarea.hora_vencimiento.split(':')
      const start = `${d}T${h}${m}00`
      const endH = String(parseInt(h) + 1).padStart(2, '0')
      const end = `${d}T${endH}${m}00`
      dates = `&dates=${start}/${end}`
    } else {
      dates = `&dates=${d}/${d}`
    }
  }

  const rec = Number(tarea.recordatorio_minutos)
  const recLabel = RECORDATORIO_OPTS.find(o => o.value === rec)?.label || ''
  const detailLines = [
    tarea.descripcion || '',
    `Prioridad: ${tarea.prioridad || 'normal'}`,
    rec > 0 ? `⏰ Recordatorio sugerido: ${recLabel} — configurarlo en "Más opciones" > Notificaciones` : '',
    'Creado desde ARMAR PMO',
  ].filter(Boolean).join('\n')

  return `${base}&text=${title}${dates}&details=${encodeURIComponent(detailLines)}`
}

const EMPTY = { titulo: '', descripcion: '', proyecto_armar_id: '', tipo: 'manual', estado: 'pendiente', prioridad: 'normal', fecha_vencimiento: '', hora_vencimiento: '', recordatorio_minutos: 60, origen: 'manual' }

export default function TareasPage({ proyectos, usuario }) {
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [filtro, setFiltro] = useState('pendiente')
  const [prioFiltro, setPrioFiltro] = useState('todas')
  const [gToken, setGToken] = useState(() => getStoredToken())
  const [calLoading, setCalLoading] = useState(false)
  const [calMsg, setCalMsg] = useState(null)

  async function handleConnectGoogle() {
    try {
      setCalLoading(true)
      const token = await connectGoogleCalendar()
      setGToken(token)
      setCalMsg({ type: 'ok', text: 'Google Calendar conectado ✓' })
      setTimeout(() => setCalMsg(null), 3000)
    } catch (e) {
      setCalMsg({ type: 'err', text: e.message || 'No se pudo conectar' })
      setTimeout(() => setCalMsg(null), 4000)
    } finally {
      setCalLoading(false)
    }
  }

  async function enviarACalendar(tarea, proyectoNombre) {
    let token = getStoredToken()
    if (!token) {
      try {
        setCalLoading(true)
        token = await connectGoogleCalendar()
        setGToken(token)
      } catch {
        return
      } finally {
        setCalLoading(false)
      }
    }
    try {
      setCalLoading(true)
      const evento = await crearEventoCalendar(token, tarea, proyectoNombre)
      // Guardar el google_event_id en Supabase para poder eliminarlo después
      if (evento?.id && tarea.id) {
        await upsertTareaPMO({ ...tarea, google_event_id: evento.id })
        setTareas(prev => prev.map(x => x.id === tarea.id ? { ...x, google_event_id: evento.id } : x))
      }
      setCalMsg({ type: 'ok', text: 'Evento creado en Google Calendar con recordatorio ✓' })
      setTimeout(() => setCalMsg(null), 4000)
    } catch (e) {
      if (e.message?.includes('401') || e.message?.includes('Invalid')) {
        clearToken(); setGToken(null)
        setCalMsg({ type: 'err', text: 'Sesión expirada — reconectá Google Calendar' })
      } else {
        setCalMsg({ type: 'err', text: e.message || 'Error al crear evento' })
      }
      setTimeout(() => setCalMsg(null), 4000)
    } finally {
      setCalLoading(false)
    }
  }

  async function cargar() {
    setLoading(true)
    setTareas(await loadTareasPMO())
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  function abrirNueva() { setForm({ ...EMPTY }); setModal('form') }
  function abrirEditar(t) { setForm({ ...t, fecha_vencimiento: t.fecha_vencimiento || '', fecha_recordatorio: t.fecha_recordatorio || '' }); setModal('form') }

  async function guardar() {
    if (!form.titulo.trim()) return
    setSaving(true)
    await upsertTareaPMO({ ...form, creado_por: usuario?.id })
    await cargar()
    setSaving(false)
    setModal(null)
  }

  async function toggleEstado(t) {
    const nuevoEstado = t.estado === 'completado' ? 'pendiente' : 'completado'
    await upsertTareaPMO({ ...t, estado: nuevoEstado })
    setTareas(prev => prev.map(x => x.id === t.id ? { ...x, estado: nuevoEstado } : x))
  }

  async function eliminar(t) {
    if (!confirm('¿Eliminar esta tarea?')) return
    // Si tiene evento en Google Calendar, lo elimina también
    if (t.google_event_id) {
      const token = getStoredToken()
      if (token) {
        try {
          await eliminarEventoCalendar(token, t.google_event_id)
        } catch (e) {
          console.warn('No se pudo eliminar el evento de Calendar:', e.message)
        }
      }
    }
    await deleteTareaPMO(t.id)
    setTareas(prev => prev.filter(x => x.id !== t.id))
  }

  const filtered = tareas.filter(t => {
    const estadoOk = filtro === 'todas' ? true : t.estado === filtro
    const prioOk = prioFiltro === 'todas' ? true : t.prioridad === prioFiltro
    return estadoOk && prioOk
  })

  const pendientes = tareas.filter(t => t.estado !== 'completado').length
  const hoy = tareas.filter(t => t.estado !== 'completado' && diasRestantes(t.fecha_vencimiento) === 0).length
  const urgentes = tareas.filter(t => t.estado !== 'completado' && t.prioridad === 'urgente').length
  const vencidas = tareas.filter(t => t.estado !== 'completado' && diasRestantes(t.fecha_vencimiento) < 0).length

  return (
    <div style={{ padding: 32, fontFamily: "'Outfit', sans-serif", minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: dark, margin: 0 }}>Mis tareas PMO</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>{pendientes} pendientes · {vencidas > 0 ? `${vencidas} vencidas` : 'todo al día'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {calMsg && (
            <span style={{ fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, background: calMsg.type === 'ok' ? '#D1FAE5' : '#FEE2E2', color: calMsg.type === 'ok' ? '#065F46' : '#991B1B' }}>
              {calMsg.text}
            </span>
          )}
          {gToken
            ? <button onClick={() => { clearToken(); setGToken(null) }}
                style={{ padding: '7px 14px', background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                📅 Google conectado ✓
              </button>
            : <button onClick={handleConnectGoogle} disabled={calLoading}
                style={{ padding: '7px 14px', background: 'white', color: '#374151', border: '1px solid #E0DDD8', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {calLoading ? 'Conectando…' : '📅 Conectar Google Calendar'}
              </button>
          }
          <button onClick={abrirNueva}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: orange, color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Nueva tarea
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['pendiente','Pendientes'], ['en_progreso','En progreso'], ['completado','Completadas'], ['todas','Todas']].map(([k, l]) => (
          <button key={k} onClick={() => setFiltro(k)}
            style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: filtro === k ? 700 : 400, background: filtro === k ? dark : 'white', color: filtro === k ? 'white' : '#6B7280' }}>
            {l}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {['todas','urgente','alta','normal'].map(p => (
            <button key={p} onClick={() => setPrioFiltro(p)}
              style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${prioFiltro === p ? dark : '#E0DDD8'}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, background: prioFiltro === p ? dark : 'white', color: prioFiltro === p ? 'white' : '#6B7280' }}>
              {p === 'todas' ? 'Todas' : PRIORIDAD_CFG[p]?.label}
            </button>
          ))}
        </div>
      </div>

      {loading
        ? <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>Cargando tareas…</div>
        : filtered.length === 0
          ? <div style={{ background: 'white', borderRadius: 16, padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
              Sin tareas en este filtro. <button onClick={abrirNueva} style={{ color: orange, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>Crear una →</button>
            </div>
          : (
            <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #F0EDE8' }}>
              {filtered.map((t, i) => {
                const proy = proyectos.find(p => p.id === t.proyecto_armar_id)
                const fc = fechaChip(t.fecha_vencimiento)
                const pr = PRIORIDAD_CFG[t.prioridad] || PRIORIDAD_CFG.normal
                const tp = TIPO_CFG[t.tipo] || TIPO_CFG.manual
                const completado = t.estado === 'completado'
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #F0EDE8' : 'none', opacity: completado ? 0.6 : 1 }}>
                    <button onClick={() => toggleEstado(t)}
                      style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${completado ? '#10B981' : '#D1D5DB'}`, background: completado ? '#10B981' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {completado && <span style={{ color: 'white', fontSize: 12 }}>✓</span>}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: dark, textDecoration: completado ? 'line-through' : 'none' }}>{t.titulo}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                        {proy && <span style={{ fontSize: 12, color: '#6B7280' }}>{proy.nombre}</span>}
                        {proy && fc && <span style={{ color: '#D1D5DB' }}>·</span>}
                        {fc && <span style={{ fontSize: 11, fontWeight: 600, background: fc.bg, color: fc.color, padding: '1px 7px', borderRadius: 10 }}>{fc.label}</span>}
                        {t.descripcion && <span style={{ fontSize: 11, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{t.descripcion}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, background: pr.bg, color: pr.color, padding: '2px 8px', borderRadius: 10 }}>{pr.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, background: tp.bg, color: tp.color, padding: '2px 8px', borderRadius: 10 }}>{tp.label}</span>
                      <button onClick={() => gToken ? enviarACalendar(t, proy?.nombre) : window.open(googleCalendarUrl(t, proy?.nombre), '_blank')}
                          title={gToken ? 'Crear evento en Google Calendar con recordatorio' : 'Abrir en Google Calendar'}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: gToken ? '#D1FAE5' : '#EBF5FB', border: `1px solid ${gToken ? '#6EE7B7' : '#BFDBFE'}`, cursor: 'pointer', fontSize: 14 }}>
                          📅
                        </button>
                      <button onClick={() => abrirEditar(t)}
                        style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #E0DDD8', background: 'white', cursor: 'pointer', fontSize: 14 }}>
                        ✏️
                      </button>
                      <button onClick={() => eliminar(t)}
                        style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #FEE2E2', background: '#FEF2F2', cursor: 'pointer', fontSize: 13 }}>
                        🗑
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
      }

      {modal === 'form' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, fontFamily: "'Outfit', sans-serif" }}
          onClick={() => setModal(null)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: 500, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: dark }}>{form.id ? 'Editar tarea' : 'Nueva tarea PMO'}</h2>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            </div>

            <Lbl>Título *</Lbl>
            <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Ej: Confirmar fecha de ingreso a obra"
              style={inputSt} autoFocus />

            <Lbl>Descripción</Lbl>
            <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Detalle opcional…" rows={2}
              style={{ ...inputSt, resize: 'vertical' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <Lbl>Proyecto</Lbl>
                <select value={form.proyecto_armar_id} onChange={e => setForm(f => ({ ...f, proyecto_armar_id: e.target.value }))} style={inputSt}>
                  <option value="">Sin proyecto</option>
                  {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <Lbl>Categoría</Lbl>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={inputSt}>
                  <option value="manual">Gestión interna</option>
                  <option value="revision">Revisión de obra</option>
                  <option value="cliente">Comunicación con cliente</option>
                  <option value="alerta_auto">Alerta del sistema</option>
                </select>
              </div>
              <div>
                <Lbl>Prioridad</Lbl>
                <select value={form.prioridad} onChange={e => setForm(f => ({ ...f, prioridad: e.target.value }))} style={inputSt}>
                  <option value="baja">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div>
                <Lbl>Estado</Lbl>
                <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} style={inputSt}>
                  <option value="pendiente">Pendiente</option>
                  <option value="en_progreso">En progreso</option>
                  <option value="completado">Completado</option>
                </select>
              </div>
              <div>
                <Lbl>Fecha vencimiento</Lbl>
                <input type="date" value={form.fecha_vencimiento} onChange={e => setForm(f => ({ ...f, fecha_vencimiento: e.target.value }))} style={inputSt} />
              </div>
              <div>
                <Lbl>Hora</Lbl>
                <input type="time" value={form.hora_vencimiento || ''} onChange={e => setForm(f => ({ ...f, hora_vencimiento: e.target.value }))} style={inputSt} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <Lbl>Recordatorio en Google Calendar</Lbl>
                <select value={form.recordatorio_minutos ?? 60} onChange={e => setForm(f => ({ ...f, recordatorio_minutos: Number(e.target.value) }))} style={inputSt}>
                  {RECORDATORIO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={guardar} disabled={saving || !form.titulo.trim()}
                style={{ flex: 1, padding: '11px', background: orange, color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Guardando…' : form.id ? 'Guardar cambios' : 'Crear tarea'}
              </button>
              {form.fecha_vencimiento && (
                gToken
                  ? <button type="button" onClick={() => enviarACalendar(form, proyectos.find(p => p.id === form.proyecto_armar_id)?.nombre)} disabled={calLoading}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', background: '#10B981', color: 'white', borderRadius: 10, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                      {calLoading ? 'Creando…' : '📅 Crear en Google Calendar'}
                    </button>
                  : <a href={googleCalendarUrl(form, proyectos.find(p => p.id === form.proyecto_armar_id)?.nombre)} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', background: '#4285F4', color: 'white', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                      📅 Abrir en Google Calendar
                    </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputSt = { width: '100%', padding: '9px 12px', border: '1px solid #E0DDD8', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: "'Outfit', sans-serif", background: 'white', marginBottom: 0, boxSizing: 'border-box' }
function Lbl({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 5, marginTop: 0 }}>{children}</div>
}
