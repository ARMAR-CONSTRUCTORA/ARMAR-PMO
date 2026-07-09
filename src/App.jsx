import { useState, useEffect } from 'react'
import { loginUsuario, loadProyectosArmar, loadChecklistItems, loadProjects, loadPresupuestosSimple, loadCalendarioEventos } from './lib/supabase'
import Sidebar from './components/Sidebar'
import DashboardPMO from './components/DashboardPMO'
import ProyectosBoard from './components/ProyectosBoard'
import AlertasPage from './components/AlertasPage'
import CalendarioMaestro from './components/CalendarioMaestro'
import LoginPage from './components/LoginPage'

export default function App() {
  const [usuario, setUsuario] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('pmo_user')) } catch { return null }
  })
  const [page, setPage] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  const [proyectos,    setProyectos]    = useState([])
  const [checklist,    setChecklist]    = useState([])
  const [obras,        setObras]        = useState([])
  const [presupuestos, setPresupuestos] = useState([])
  const [eventos,      setEventos]      = useState([])
  const [dataLoaded,   setDataLoaded]   = useState(false)

  async function cargar() {
    setLoading(true)
    const [p, c, o, pres, ev] = await Promise.all([
      loadProyectosArmar(),
      loadChecklistItems(),
      loadProjects(),
      loadPresupuestosSimple(),
      loadCalendarioEventos(),
    ])
    setProyectos(p); setChecklist(c); setObras(o)
    setPresupuestos(pres); setEventos(ev)
    setDataLoaded(true); setLoading(false)
  }

  useEffect(() => { if (usuario) cargar() }, [usuario])

  async function handleLogin(nombre, password) {
    const u = await loginUsuario(nombre, password)
    if (u) { sessionStorage.setItem('pmo_user', JSON.stringify(u)); setUsuario(u) }
    else alert('Usuario o contraseña incorrectos')
  }

  function handleLogout() {
    sessionStorage.removeItem('pmo_user'); setUsuario(null); setDataLoaded(false)
  }

  if (!usuario) return <LoginPage onLogin={handleLogin} />

  const props = { proyectos, checklist, obras, presupuestos, eventos, onRefresh: cargar }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F7F5' }}>
      <Sidebar page={page} setPage={setPage} usuario={usuario} onLogout={handleLogout} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {loading && !dataLoaded
          ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9CA3AF', fontSize: 14 }}>Cargando datos…</div>
          : <>
              {page === 'dashboard'  && <DashboardPMO    {...props} />}
              {page === 'proyectos'  && <ProyectosBoard  {...props} />}
              {page === 'alertas'    && <AlertasPage     {...props} />}
              {page === 'calendario' && <CalendarioMaestro {...props} />}
            </>
        }
      </div>
    </div>
  )
}
