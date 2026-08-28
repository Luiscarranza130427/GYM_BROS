import { USE_MOCKS } from '@/config/env'
import api from '@/services/api'
import {
  crearNormalizadorDeError,
  ejecutarPeticion as ejecutar,
  normalizarListado as normalizarListadoBase,
  seleccionarCamposEditables as seleccionarEditables,
} from '@/services/normalizacion'

/** Import dinámico: mantiene los datos simulados fuera del bundle de producción. */
const cargarMock = () => import('@/mocks/alimentacion.mock')

/**
 * Frontera de datos de alimentación.
 *
 * CONTRATO PROVISIONAL — pendiente de acordar con Natan. Los nombres de los
 * endpoints y de los campos del backend son una suposición; cuando se cierre, se
 * ajustan `CAMPOS_ERROR`, `prepararPayload` y los `normalizarXxx`, y las vistas
 * no se enteran.
 *
 * El módulo cubre dos recursos que el esquema encadena:
 *
 *   planes_alimentacion → comidas → comida_alimentos → alimentos
 *
 * `alimentos` es un catálogo GLOBAL (no cuelga de `empresas`, al revés que
 * `ejercicios`), y `planes_alimentacion` cuelga del USUARIO. La empresa se
 * arrastra desde el usuario sólo para poder filtrar.
 */

const CAMPOS_ERROR_ALIMENTO = {
  name: 'nombre',
  type: 'tipo',
  calories: 'calorias',
  protein: 'proteinas',
  proteina: 'proteinas',
  carbs: 'carbohidratos',
  carbohydrates: 'carbohidratos',
  fat: 'grasas',
  fats: 'grasas',
  fiber: 'fibra',
}

const CAMPOS_ERROR_COMIDA = {
  meal_type: 'tipoComida',
  tipo_comida: 'tipoComida',
  suggested_time: 'horaSugerida',
  hora_sugerida: 'horaSugerida',
  order: 'orden',
  foods: 'alimentos',
  comida_alimentos: 'alimentos',
}

const CAMPOS_EDITABLES_ALIMENTO = [
  'nombre',
  'tipo',
  'calorias',
  'proteinas',
  'carbohidratos',
  'grasas',
  'fibra',
]

const numero = (valor) => {
  const convertido = Number(valor)
  return Number.isFinite(convertido) ? convertido : 0
}

function normalizarMacros(datos = {}) {
  return {
    calorias: numero(datos.calorias ?? datos.calories),
    proteinas: numero(datos.proteinas ?? datos.protein),
    carbohidratos: numero(datos.carbohidratos ?? datos.carbs ?? datos.carbohydrates),
    grasas: numero(datos.grasas ?? datos.fat ?? datos.fats),
    fibra: numero(datos.fibra ?? datos.fiber),
  }
}

function normalizarRelacion(datos) {
  if (!datos) return null
  return {
    id: Number(datos.id) || null,
    nombre: datos.nombre ?? datos.name ?? '',
  }
}

/** Su contrato: la forma que este servicio garantiza a las vistas. */
function normalizarAlimento(datos = {}) {
  return {
    id: datos.id,
    nombre: datos.nombre ?? datos.name ?? '',
    tipo: datos.tipo ?? datos.type ?? '',
    ...normalizarMacros(datos),
    // Sale del tipo cuando el backend no lo manda: es la unidad en que se mide,
    // no una preferencia. Sin ella una cantidad no significa nada.
    unidadBase: datos.unidadBase ?? datos.unidad_base ?? 'gramos',
    // En cuántas comidas se usa. Decide si se puede retirar del catálogo, así
    // que hace falta antes de ofrecer el botón. Viaja tanto en el listado como
    // en la ficha.
    usos: numero(datos.usos ?? datos.usos_count),
  }
}

/** Una porción dentro de una comida: qué alimento, cuánto y qué aporta. */
function normalizarPorcion(datos = {}) {
  return {
    id: datos.id,
    alimento: {
      ...normalizarRelacion(datos.alimento ?? datos.food ?? {}),
      tipo: datos.alimento?.tipo ?? datos.food?.type ?? '',
    },
    cantidad: numero(datos.cantidad ?? datos.quantity ?? datos.amount),
    unidad: datos.unidad ?? datos.unit ?? 'gramos',
    macros: normalizarMacros(datos.macros ?? datos),
  }
}

function normalizarComida(datos = {}) {
  const alimentos = (datos.alimentos ?? datos.foods ?? []).map(normalizarPorcion)
  return {
    id: datos.id,
    tipoComida: datos.tipoComida ?? datos.tipo_comida ?? datos.meal_type ?? '',
    horaSugerida: datos.horaSugerida ?? datos.hora_sugerida ?? datos.suggested_time ?? '',
    orden: numero(datos.orden ?? datos.order),
    alimentos,
    macros: normalizarMacros(datos.macros ?? {}),
  }
}

function normalizarPlan(datos = {}) {
  return {
    id: datos.id,
    usuario: normalizarRelacion(datos.usuario ?? datos.user),
    empresa: normalizarRelacion(datos.empresa ?? datos.company),
    objetivo: datos.objetivo ?? datos.goal ?? '',
    fechaInicio: datos.fechaInicio ?? datos.fecha_inicio ?? datos.start_date ?? '',
    fechaFin: datos.fechaFin ?? datos.fecha_fin ?? datos.end_date ?? '',
    activo: Boolean(datos.activo ?? datos.active ?? false),
    objetivos: {
      calorias: numero(datos.caloriasObjetivo ?? datos.calorias_objetivo),
      proteinas: numero(datos.proteinasObjetivo ?? datos.proteinas_objetivo),
      carbohidratos: numero(datos.carbohidratosObjetivo ?? datos.carbohidratos_objetivo),
      grasas: numero(datos.grasasObjetivo ?? datos.grasas_objetivo),
    },
    totalComidas: numero(datos.totalComidas ?? datos.comidas_count),
    macros: normalizarMacros(datos.macros ?? {}),
  }
}

/** La ficha añade las comidas, que el listado no trae. */
function normalizarPlanCompleto(datos = {}) {
  const comidas = (datos.comidas ?? datos.meals ?? []).map(normalizarComida)
  return { ...normalizarPlan(datos), comidas, totalComidas: comidas.length }
}

function prepararParametrosAlimento({ busqueda = '', tipo = '', pagina = 1, porPagina = 12 } = {}) {
  return { search: busqueda, type: tipo, page: pagina, per_page: porPagina }
}

function prepararParametrosPlan({
  busqueda = '',
  situacion = '',
  empresaId = '',
  pagina = 1,
  porPagina = 10,
} = {}) {
  return {
    search: busqueda,
    // El backend recibe el booleano de `planes_alimentacion.activo`; la interfaz
    // razona en 'activo'/'inactivo' porque un <select> con true/false no se lee.
    activo: situacion === '' ? undefined : situacion === 'activo',
    id_empresas: empresaId,
    page: pagina,
    per_page: porPagina,
  }
}

function prepararPayloadAlimento(payload) {
  return {
    nombre: payload.nombre,
    tipo: payload.tipo,
    calorias: payload.calorias,
    proteinas: payload.proteinas,
    carbohidratos: payload.carbohidratos,
    grasas: payload.grasas,
    fibra: payload.fibra,
  }
}

function prepararPayloadComida(payload) {
  return {
    tipo_comida: payload.tipoComida,
    hora_sugerida: payload.horaSugerida,
    alimentos: (payload.alimentos ?? []).map((porcion) => ({
      id_alimentos: porcion.alimentoId,
      cantidad: porcion.cantidad,
      unidad: porcion.unidad,
    })),
  }
}

const errorDeAlimento = crearNormalizadorDeError(CAMPOS_ERROR_ALIMENTO)
const errorDeComida = crearNormalizadorDeError(CAMPOS_ERROR_COMIDA)
const peticionDeAlimento = (peticion) => ejecutar(peticion, errorDeAlimento)
const peticionDeComida = (peticion) => ejecutar(peticion, errorDeComida)
const camposEditablesDeAlimento = (payload) =>
  seleccionarEditables(payload, CAMPOS_EDITABLES_ALIMENTO)

// ------------------------------------------------------------------ alimentos

/** CONTRATO PROVISIONAL: GET /alimentos */
export async function obtenerAlimentos(params = {}) {
  if (USE_MOCKS) return (await cargarMock()).obtenerAlimentosMock(params)

  return peticionDeAlimento(async () => {
    const { data } = await api.get('/alimentos', { params: prepararParametrosAlimento(params) })
    return normalizarListadoBase(data, normalizarAlimento)
  })
}

/** CONTRATO PROVISIONAL: GET /alimentos/:id */
export async function obtenerAlimento(id) {
  if (USE_MOCKS) return (await cargarMock()).obtenerAlimentoMock(id)

  return peticionDeAlimento(async () => {
    const { data } = await api.get(`/alimentos/${id}`)
    return normalizarAlimento(data.data ?? data)
  })
}

/** CONTRATO PROVISIONAL: POST /alimentos */
export async function crearAlimento(payload) {
  const datosEditables = camposEditablesDeAlimento(payload)
  if (USE_MOCKS) return (await cargarMock()).crearAlimentoMock(datosEditables)

  return peticionDeAlimento(async () => {
    const { data } = await api.post('/alimentos', prepararPayloadAlimento(datosEditables))
    return normalizarAlimento(data.data ?? data)
  })
}

/** CONTRATO PROVISIONAL: PUT /alimentos/:id */
export async function actualizarAlimento(id, payload) {
  const datosEditables = camposEditablesDeAlimento(payload)
  if (USE_MOCKS) return (await cargarMock()).actualizarAlimentoMock(id, datosEditables)

  return peticionDeAlimento(async () => {
    const { data } = await api.put(`/alimentos/${id}`, prepararPayloadAlimento(datosEditables))
    return normalizarAlimento(data.data ?? data)
  })
}

/**
 * CONTRATO PROVISIONAL: DELETE /alimentos/:id
 *
 * Puede fallar con un 422 SIN `errors` si el alimento ya forma parte de alguna
 * comida: no es un campo mal rellenado, es que retirarlo dejaría esas comidas
 * apuntando a nada y sus macros dejarían de cuadrar.
 */
export async function eliminarAlimento(id) {
  if (USE_MOCKS) return (await cargarMock()).eliminarAlimentoMock(id)

  return peticionDeAlimento(async () => {
    const { data } = await api.delete(`/alimentos/${id}`)
    return normalizarAlimento(data?.data ?? data ?? { id })
  })
}

// -------------------------------------------------------------------- planes

/** CONTRATO PROVISIONAL: GET /planes-alimentacion */
export async function obtenerPlanes(params = {}) {
  if (USE_MOCKS) return (await cargarMock()).obtenerPlanesMock(params)

  return peticionDeAlimento(async () => {
    const { data } = await api.get('/planes-alimentacion', {
      params: prepararParametrosPlan(params),
    })
    return normalizarListadoBase(data, normalizarPlan)
  })
}

/** CONTRATO PROVISIONAL: GET /planes-alimentacion/:id */
export async function obtenerPlan(id) {
  if (USE_MOCKS) return (await cargarMock()).obtenerPlanMock(id)

  return peticionDeAlimento(async () => {
    const { data } = await api.get(`/planes-alimentacion/${id}`)
    return normalizarPlanCompleto(data.data ?? data)
  })
}

/** CONTRATO PROVISIONAL: POST /planes-alimentacion/:id/comidas */
export async function crearComida(idPlan, payload) {
  if (USE_MOCKS) return (await cargarMock()).crearComidaMock(idPlan, payload)

  return peticionDeComida(async () => {
    const { data } = await api.post(
      `/planes-alimentacion/${idPlan}/comidas`,
      prepararPayloadComida(payload),
    )
    return normalizarComida(data.data ?? data)
  })
}

/** CONTRATO PROVISIONAL: PUT /planes-alimentacion/:idPlan/comidas/:idComida */
export async function actualizarComida(idPlan, idComida, payload) {
  if (USE_MOCKS) return (await cargarMock()).actualizarComidaMock(idPlan, idComida, payload)

  return peticionDeComida(async () => {
    const { data } = await api.put(
      `/planes-alimentacion/${idPlan}/comidas/${idComida}`,
      prepararPayloadComida(payload),
    )
    return normalizarComida(data.data ?? data)
  })
}

/**
 * CONTRATO PROVISIONAL: DELETE /planes-alimentacion/:idPlan/comidas/:idComida
 *
 * Puede fallar con un 422 SIN `errors` si es la última comida del plan: un plan
 * vacío daría una ficha que no dice nada.
 */
export async function eliminarComida(idPlan, idComida) {
  if (USE_MOCKS) return (await cargarMock()).eliminarComidaMock(idPlan, idComida)

  return peticionDeComida(async () => {
    const { data } = await api.delete(`/planes-alimentacion/${idPlan}/comidas/${idComida}`)
    return normalizarComida(data?.data ?? data ?? { id: idComida })
  })
}

/**
 * CONTRATO PROVISIONAL: GET /alimentos/para-elegir
 *
 * El catálogo entero y sin paginar, para el selector de una comida. Es una lista
 * corta y elegir un alimento no puede obligar a paginar.
 */
export async function obtenerAlimentosParaElegir() {
  if (USE_MOCKS) return (await cargarMock()).obtenerAlimentosParaElegirMock()

  const { data } = await api.get('/alimentos/para-elegir')
  const lista = data.data ?? data
  return Array.isArray(lista) ? lista.map(normalizarAlimento) : []
}

/** CONTRATO PROVISIONAL: GET /planes-alimentacion/empresas */
export async function obtenerEmpresasConPlanes() {
  if (USE_MOCKS) return (await cargarMock()).obtenerEmpresasConPlanesMock()

  const { data } = await api.get('/planes-alimentacion/empresas')
  const lista = data.data ?? data
  return Array.isArray(lista) ? lista.map(normalizarRelacion) : []
}
