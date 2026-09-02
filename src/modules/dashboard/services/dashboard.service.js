import api from '@/core/api/api'
import { USE_MOCKS } from '@/core/config/env'

const cargarMock = () => import('@/modules/dashboard/mocks/dashboard.mock')

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

export async function obtenerDashboard() {
  if (USE_MOCKS) {
    const { obtenerDashboardMock } = await cargarMock()
    return normalizarDashboard(await obtenerDashboardMock())
  }

  const { data } = await api.get('/dashboard')
  return normalizarDashboard(data)
}
