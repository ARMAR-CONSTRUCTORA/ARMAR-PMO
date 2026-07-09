import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://sljsruoswqqvtnpxfymr.supabase.co',
  'sb_publishable__5tM6eiZb-DQkUJyYBhjPQ_SIaUz3Wm'
)

export async function loginUsuario(nombre, password) {
  const { data, error } = await supabase.from('usuarios').select('*').eq('nombre', nombre).single()
  console.log('DB data:', data, 'error:', error)
  if (error || !data) return null
  try {
    const bcryptMod = await import('bcryptjs')
    console.log('bcryptMod keys:', Object.keys(bcryptMod))
    const bcrypt = bcryptMod.default || bcryptMod
    console.log('bcrypt.compare type:', typeof bcrypt.compare)
    const match = await bcrypt.compare(password, data.password_hash)
    console.log('match:', match)
    if (!match) return null
  } catch (e) {
    console.error('bcrypt error:', e)
    return null
  }
  return { id: data.id, nombre: data.nombre }
}

export async function loadProyectosArmar() {
  const { data } = await supabase.from('proyectos_armar').select('*').order('created_at', { ascending: false })
  return data || []
}

export async function loadChecklistItems() {
  const { data } = await supabase.from('proyecto_checklist_items').select('*').order('orden')
  return data || []
}

export async function loadProjects() {
  const { data } = await supabase.from('projects').select('*').order('id')
  return data || []
}

export async function loadPresupuestos() {
  const { data } = await supabase
    .from('presupuestos')
    .select('id, proyecto_id, proyecto_armar_id, estado_version, fecha_creacion, presupuesto_capitulos(presupuesto_items(subtotal_cliente, cantidad, precio_cliente, costo_directo_unitario))')
    .eq('es_version_vigente', true)
  return data || []
}

export async function loadPresupuestosSimple() {
  const { data } = await supabase
    .from('presupuestos')
    .select('id, proyecto_id, proyecto_armar_id, estado_version, fecha_creacion')
    .eq('es_version_vigente', true)
  return data || []
}

export async function loadCalendarioEventos() {
  const { data } = await supabase
    .from('calendario_eventos')
    .select('*')
    .order('fecha', { ascending: true })
  return data || []
}

export async function loadCronogramas() {
  const { data } = await supabase.from('cronogramas').select('id, obra_id, nombre, tareas')
  return data || []
}

export async function loadTareasPMO() {
  const { data } = await supabase
    .from('pmo_tareas')
    .select('*')
    .order('fecha_vencimiento', { ascending: true, nullsFirst: false })
  return data || []
}

export async function upsertTareaPMO(tarea) {
  const out = {
    titulo: tarea.titulo || '',
    descripcion: tarea.descripcion || '',
    proyecto_armar_id: tarea.proyecto_armar_id || null,
    tipo: tarea.tipo || 'manual',
    estado: tarea.estado || 'pendiente',
    prioridad: tarea.prioridad || 'normal',
    fecha_vencimiento: tarea.fecha_vencimiento || null,
    hora_vencimiento: tarea.hora_vencimiento || null,
    recordatorio_minutos: tarea.recordatorio_minutos ?? 60,
    origen: tarea.origen || 'manual',
    google_event_id: tarea.google_event_id || null,
    updated_at: new Date().toISOString(),
  }
  if (tarea.id) out.id = tarea.id
  const { data } = await supabase.from('pmo_tareas').upsert(out).select().single()
  return data
}

export async function deleteTareaPMO(id) {
  await supabase.from('pmo_tareas').delete().eq('id', id)
}

export async function upsertChecklistItem(item) {
  const out = {
    proyecto_armar_id: item.proyecto_armar_id,
    etapa: item.etapa || '',
    titulo: item.titulo || '',
    estado: item.estado || 'no_iniciado',
    responsable: item.responsable || '',
    fecha_objetivo: item.fecha_objetivo || null,
    observaciones: item.observaciones || '',
    obligatorio: item.obligatorio ?? false,
    aplica: item.aplica ?? true,
    peso: item.peso ?? 1,
    orden: item.orden ?? 0,
  }
  if (item.id) out.id = item.id
  const { data } = await supabase.from('proyecto_checklist_items').upsert(out).select().single()
  return data
}
