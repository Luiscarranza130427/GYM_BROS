import { USE_MOCKS } from '@/config/env'
import api from '@/services/api'
import {
  crearNormalizadorDeError,
  ejecutarPeticion as ejecutar,
  normalizarEstado,
  normalizarListado as normalizarListadoBase,
  seleccionarCamposEditables as seleccionarEditables,
} from '@/services/normalizacion'

/** Import dinámico: mantiene los datos simulados fuera del bundle de producción. */
const cargarMock = () => import('@/mocks/ejercicios.mock')

/**
 * Frontera de datos del catálogo de ejercicios.
 *
 * CONTRATO PROVISIONAL — pendiente de acordar con Natan. Los nombres de campo
 * del backend son una suposición; cuando se cierre, se ajusta `CAMPOS_ERROR`,
 * `prepararPayload` y `normalizarEjercicio`, y las vistas no se enteran.
 */

/** Campo del backend -> campo del dominio, para pintar los 422 bajo su input. */
const CAMPOS_ERROR = {
  name: 'nombre',
  category: 'categoria',
  categoria_id: 'categoria',
  level: 'nivel',
  difficulty: 'nivel',
  equipment: 'equipo',
  equipamiento: 'equipo',
  description: 'descripcion',
  suggested_sets: 'seriesSugeridas',
  series_sugeridas: 'seriesSugeridas',
  suggested_reps: 'repeticionesSugeridas',
  repeticiones_sugeridas: 'repeticionesSugeridas',
  status: 'estado',
}

const CAMPOS_EDITABLES = [
  'nombre',
  'categoria',
  'nivel',
  'equipo',
  'descripcion',
  'seriesSugeridas',
  'repeticionesSugeridas',
  'estado',
]

/** Su contrato: la forma que este servicio garantiza a las vistas. */
function normalizarEjercicio(datos = {}) {
  return {
    id: datos.id,
    nombre: datos.nombre ?? datos.name ?? '',
    categoria: datos.categoria ?? datos.category ?? '',
    nivel: datos.nivel ?? datos.level ?? datos.difficulty ?? '',
    equipo: datos.equipo ?? datos.equipment ?? datos.equipamiento ?? '',
    descripcion: datos.descripcion ?? datos.description ?? '',
    seriesSugeridas: Number(datos.series_sugeridas ?? datos.seriesSugeridas ?? 0),
    repeticionesSugeridas: Number(datos.repeticiones_sugeridas ?? datos.repeticionesSugeridas ?? 0),
    usos: Number(datos.usos_count ?? datos.usos ?? 0),
    estado: normalizarEstado(datos.estado ?? datos.status),
    fechaRegistro: datos.fecha_registro ?? datos.fechaRegistro ?? datos.created_at ?? '',
  }
}

function prepararPayload(payload) {
  const campos = {
    nombre: payload.nombre,
    categoria: payload.categoria,
    nivel: payload.nivel,
    equipo: payload.equipo,
    descripcion: payload.descripcion,
    series_sugeridas: payload.seriesSugeridas,
    repeticiones_sugeridas: payload.repeticionesSugeridas,
    estado: payload.estado,
  }
  return Object.fromEntries(Object.entries(campos).filter(([, valor]) => valor !== undefined))
}

function prepararParametros({
  busqueda = '',
  categoria = '',
  nivel = '',
  equipo = '',
  estado = '',
  pagina = 1,
  porPagina = 10,
} = {}) {
  return {
    search: busqueda,
    category: categoria,
    level: nivel,
    equipment: equipo,
    status: estado,
    page: pagina,
    per_page: porPagina,
  }
}

const normalizarError = crearNormalizadorDeError(CAMPOS_ERROR)
const ejecutarPeticion = (peticion) => ejecutar(peticion, normalizarError)
const normalizarListado = (datos) => normalizarListadoBase(datos, normalizarEjercicio)
const seleccionarCamposEditables = (payload) => seleccionarEditables(payload, CAMPOS_EDITABLES)

/** CONTRATO PROVISIONAL: GET /ejercicios. */
export async function obtenerEjercicios(params = {}) {
  if (USE_MOCKS) return (await cargarMock()).obtenerEjerciciosMock(params)

  return ejecutarPeticion(async () => {
    const { data } = await api.get('/ejercicios', { params: prepararParametros(params) })
    return normalizarListado(data)
  })
}

/** CONTRATO PROVISIONAL: GET /ejercicios/:id. */
export async function obtenerEjercicio(id) {
  if (USE_MOCKS) return (await cargarMock()).obtenerEjercicioMock(id)

  return ejecutarPeticion(async () => {
    const { data } = await api.get(`/ejercicios/${id}`)
    return normalizarEjercicio(data.data ?? data)
  })
}

/** CONTRATO PROVISIONAL: POST /ejercicios. */
export async function crearEjercicio(payload) {
  const datosEditables = seleccionarCamposEditables(payload)
  if (USE_MOCKS) return (await cargarMock()).crearEjercicioMock(datosEditables)

  return ejecutarPeticion(async () => {
    const { data } = await api.post('/ejercicios', prepararPayload(datosEditables))
    return normalizarEjercicio(data.data ?? data)
  })
}

/** CONTRATO PROVISIONAL: PUT /ejercicios/:id. */
export async function actualizarEjercicio(id, payload) {
  const datosEditables = seleccionarCamposEditables(payload)
  if (USE_MOCKS) return (await cargarMock()).actualizarEjercicioMock(id, datosEditables)

  return ejecutarPeticion(async () => {
    const { data } = await api.put(`/ejercicios/${id}`, prepararPayload(datosEditables))
    return normalizarEjercicio(data.data ?? data)
  })
}

/** CONTRATO PROVISIONAL: DELETE /ejercicios/:id (desactivación lógica). */
export async function desactivarEjercicio(id) {
  if (USE_MOCKS) return (await cargarMock()).desactivarEjercicioMock(id)

  return ejecutarPeticion(async () => {
    const { data } = await api.delete(`/ejercicios/${id}`)
    const respuesta = data?.data ?? data
    return normalizarEjercicio(
      respuesta && typeof respuesta === 'object' ? respuesta : { id, estado: 'inactive' },
    )
  })
}
