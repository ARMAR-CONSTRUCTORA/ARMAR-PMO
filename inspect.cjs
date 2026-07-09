const { createClient } = require('@supabase/supabase-js')
const sb = createClient('https://sljsruoswqqvtnpxfymr.supabase.co', 'sb_publishable__5tM6eiZb-DQkUJyYBhjPQ_SIaUz3Wm')

async function run() {
  // Full projects table
  const { data: p } = await sb.from('projects').select('*').limit(2)
  console.log('projects columns:', Object.keys(p[0] || {}))
  console.log('projects sample:', JSON.stringify(p[0], null, 2))

  // Full proyectos_armar
  const { data: pa } = await sb.from('proyectos_armar').select('*').limit(1)
  console.log('\nproyectos_armar columns:', Object.keys(pa[0] || {}))
  console.log('sample:', JSON.stringify(pa[0], null, 2))

  // cronogramas
  const { data: cr, error: cre } = await sb.from('cronogramas').select('*').limit(2)
  console.log('\ncronogramas:', cre ? 'ERROR: '+cre.message : JSON.stringify(cr?.map(c => ({id:c.id, obra_id:c.obra_id, nombre:c.nombre, keys:Object.keys(c)}))))
}
run()
