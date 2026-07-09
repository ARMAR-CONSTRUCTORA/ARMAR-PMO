import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function loginUsuario(nombre, password) {
  const bcryptMod = await import('bcryptjs')
  const bcrypt = bcryptMod.default || bcryptMod
  const { data, error } = await supabase.from('usuarios').select('*').eq('nombre', nombre).single()
  if (error || !data) return null
  const match = await bcrypt.compare(password, data.password_hash)
  if (!match) return null
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
