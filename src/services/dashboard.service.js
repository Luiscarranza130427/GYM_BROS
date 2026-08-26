import { USE_MOCKS } from '@/config/env'
import { obtenerDashboardMock } from '@/mocks/dashboard.mock'
import api from '@/services/api'

const RESUMEN_VACIO = {
  banner: { titulo: '', descripcion: '', accion: { texto: '' } },
  metricas: [],
  progreso: {
    titulo: '',
    descripcion: '',
    unidad: 'usuarios activos',
    etiquetas: [],
    valores: [],
    resumen: { etiqueta: '', valor: 0, detalle: '' },
  },
  ejerciciosPopulares: [],
  actividadReciente: [],
}

const copiarLista = (lista) =>
  Array.isArray(lista) ? lista.map((elemento) => ({ ...elemento })) : []

function normalizarMetricas(metricas) {
  return copiarLista(metricas).map((metrica) => ({
    ...metrica,
    tendencia: {
      valor: 0,
      prefijo: '',
      sufijo: '',
      detalle: '',
      tono: 'neutro',
      ...metrica.tendencia,
    },
  }))
}

function normalizarProgreso(progreso) {
  const serie = progreso ?? {}

  return {
    ...RESUMEN_VACIO.progreso,
    ...serie,
    etiquetas: Array.isArray(serie.etiquetas) ? [...serie.etiquetas] : [],
    valores: Array.isArray(serie.valores) ? [...serie.valores] : [],
    resumen: { ...RESUMEN_VACIO.progreso.resumen, ...serie.resumen },
  }
}

/**
 * Adapta la respuesta a la forma estable que consume el Dashboard.
 * Se aceptan tanto el resumen en la raíz como un envoltorio `{ dashboard }`
 * sin asumir un contrato más complejo antes de que el backend esté definido.
 */
function normalizarDashboard(datos) {
  const resumen = datos?.dashboard ?? datos ?? {}

  return {
    banner: {
      ...RESUMEN_VACIO.banner,
      ...resumen.banner,
      accion: { texto: resumen.banner?.accion?.texto ?? '' },
    },
    metricas: normalizarMetricas(resumen.metricas),
    progreso: normalizarProgreso(resumen.progreso),
    ejerciciosPopulares: copiarLista(resumen.ejerciciosPopulares),
    actividadReciente: copiarLista(resumen.actividadReciente),
  }
}

/**
 * Frontera de datos del Dashboard.
 *
 * CONTRATO PROVISIONAL — pendiente de acordar con Natan:
 *   GET /dashboard -> resumen administrativo del gimnasio.
 *
 * Al cerrar el contrato de Laravel, cualquier diferencia de forma se adapta en
 * `normalizarDashboard()` sin trasladar detalles HTTP a la vista.
 */
export async function obtenerDashboard() {
  if (USE_MOCKS) {
    return normalizarDashboard(await obtenerDashboardMock())
  }

  const { data } = await api.get('/dashboard')
  return normalizarDashboard(data)
}
