const GOOGLE_CLIENT_ID = '398968653579-rnt9geqcgov9s6r5kjcfrh5p85b2627c.apps.googleusercontent.com'
const SCOPE = 'https://www.googleapis.com/auth/calendar.events'
const TOKEN_KEY = 'pmo_google_token'
const TOKEN_EXP_KEY = 'pmo_google_token_exp'

export function getStoredToken() {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const exp = Number(sessionStorage.getItem(TOKEN_EXP_KEY) || 0)
  if (!token || Date.now() > exp) return null
  return token
}

function storeToken(token, expiresIn) {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(TOKEN_EXP_KEY, String(Date.now() + expiresIn * 1000 - 60000))
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_EXP_KEY)
}

export function connectGoogleCalendar() {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: window.location.origin,
      response_type: 'token',
      scope: SCOPE,
      prompt: 'consent',
    })

    const popup = window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      'google-oauth',
      'width=520,height=620,top=100,left=200'
    )

    if (!popup) { reject(new Error('Popup bloqueado')); return }

    const interval = setInterval(() => {
      try {
        const hash = popup.location.hash
        if (hash && hash.includes('access_token')) {
          clearInterval(interval)
          popup.close()
          const p = new URLSearchParams(hash.slice(1))
          const token = p.get('access_token')
          const expiresIn = Number(p.get('expires_in') || 3600)
          storeToken(token, expiresIn)
          resolve(token)
        }
      } catch {
        // Cross-origin mientras está en Google — ignorar
      }
      if (popup.closed) {
        clearInterval(interval)
        reject(new Error('Ventana cerrada'))
      }
    }, 400)
  })
}

export async function crearEventoCalendar(accessToken, tarea, proyectoNombre) {
  const titulo = `[PMO] ${tarea.titulo}${proyectoNombre ? ' — ' + proyectoNombre : ''}`

  let start, end
  if (tarea.fecha_vencimiento) {
    if (tarea.hora_vencimiento) {
      const [h, m] = tarea.hora_vencimiento.split(':')
      const endH = String(parseInt(h) + 1).padStart(2, '0')
      start = { dateTime: `${tarea.fecha_vencimiento}T${tarea.hora_vencimiento}:00`, timeZone: 'America/Argentina/Buenos_Aires' }
      end   = { dateTime: `${tarea.fecha_vencimiento}T${endH}:${m}:00`, timeZone: 'America/Argentina/Buenos_Aires' }
    } else {
      start = { date: tarea.fecha_vencimiento }
      end   = { date: tarea.fecha_vencimiento }
    }
  } else {
    const hoy = new Date().toISOString().slice(0, 10)
    start = { date: hoy }
    end   = { date: hoy }
  }

  const rec = Number(tarea.recordatorio_minutos)
  const event = {
    summary: titulo,
    description: [
      tarea.descripcion || '',
      `Prioridad: ${tarea.prioridad || 'normal'}`,
      'Creado desde ARMAR PMO',
    ].filter(Boolean).join('\n'),
    start,
    end,
    reminders: {
      useDefault: false,
      overrides: rec > 0 ? [{ method: 'popup', minutes: rec }] : [],
    },
  }

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Error al crear evento')
  }
  return res.json()
}
