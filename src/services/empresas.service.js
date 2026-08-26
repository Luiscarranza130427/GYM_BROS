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
const cargarMock = () => import('@/mocks/empresas.mock')

const CAMPOS_ERROR = {
  name: 'nombre',
  manager_name: 'gerente',
  nombre_gerente: 'gerente',
  tax_id: 'ruc',
  email: 'correo',
  phone: 'telefono',
  address: 'direccion',
  status: 'estado',
  website: 'sitioWeb',
  sitio_web: 'sitioWeb',
  logo_url: 'logoUrl',
  color_primario: 'colorPrimario',
  color_secundario: 'colorSecundario',
  primary_color: 'colorPrimario',
  secondary_color: 'colorSecundario',
}

const CAMPOS_EDITABLES = [
  'nombre',
  'gerente',
  'ruc',
  'correo',
  'telefono',
  'region',
  'direccion',
  'sitioWeb',
  'estado',
  'logoUrl',
  'colorPrimario',
  'colorSecundario',
]

function normalizarEmpresa(datos = {}) {
  return {
    id: datos.id,
    nombre: datos.nombre ?? datos.name ?? '',
    gerente: datos.gerente ?? datos.manager_name ?? datos.nombre_gerente ?? '',
    ruc: datos.ruc ?? datos.tax_id ?? '',
    correo: datos.correo ?? datos.email ?? '',
    telefono: datos.telefono ?? datos.phone ?? '',
    region: datos.region ?? '',
    direccion: datos.direccion ?? '',
    sitioWeb: datos.sitio_web ?? datos.sitioWeb ?? datos.website ?? '',
    estado: normalizarEstado(datos.estado ?? datos.status),
    usuarios: Number(datos.usuarios_count ?? datos.usuarios ?? 0),
    fechaRegistro: datos.fecha_registro ?? datos.fechaRegistro ?? datos.created_at ?? '',
    logoUrl: datos.logo_url ?? datos.logoUrl ?? '',
    colorPrimario: datos.color_primario ?? datos.colorPrimario ?? '',
    colorSecundario: datos.color_secundario ?? datos.colorSecundario ?? '',
  }
}

function prepararPayload(payload) {
  const campos = {
    nombre: payload.nombre,
    gerente: payload.gerente,
    ruc: payload.ruc,
    correo: payload.correo,
    telefono: payload.telefono,
    region: payload.region,
    direccion: payload.direccion,
    sitio_web: payload.sitioWeb,
    estado: payload.estado,
    logo_url: payload.logoUrl,
    color_primario: payload.colorPrimario,
    color_secundario: payload.colorSecundario,
  }

  return Object.fromEntries(Object.entries(campos).filter(([, valor]) => valor !== undefined))
}

function prepararParametros({ busqueda = '', estado = '', pagina = 1, porPagina = 10 } = {}) {
  return {
    search: busqueda,
    status: estado,
    page: pagina,
    per_page: porPagina,
  }
}

const normalizarError = crearNormalizadorDeError(CAMPOS_ERROR)
const ejecutarPeticion = (peticion) => ejecutar(peticion, normalizarError)
const normalizarListado = (datos) => normalizarListadoBase(datos, normalizarEmpresa)
const seleccionarCamposEditables = (payload) => seleccionarEditables(payload, CAMPOS_EDITABLES)

/** CONTRATO PROVISIONAL: GET /empresas. */
export async function obtenerEmpresas(params = {}) {
  if (USE_MOCKS) return (await cargarMock()).obtenerEmpresasMock(params)

  return ejecutarPeticion(async () => {
    const { data } = await api.get('/empresas', { params: prepararParametros(params) })
    return normalizarListado(data)
  })
}

/** CONTRATO PROVISIONAL: GET /empresas/:id. */
export async function obtenerEmpresa(id) {
  if (USE_MOCKS) return (await cargarMock()).obtenerEmpresaMock(id)

  return ejecutarPeticion(async () => {
    const { data } = await api.get(`/empresas/${id}`)
    return normalizarEmpresa(data.data ?? data)
  })
}

/** CONTRATO PROVISIONAL: POST /empresas. */
export async function crearEmpresa(payload) {
  const datosEditables = seleccionarCamposEditables(payload)
  if (USE_MOCKS) return (await cargarMock()).crearEmpresaMock(datosEditables)

  return ejecutarPeticion(async () => {
    const { data } = await api.post('/empresas', prepararPayload(datosEditables))
    return normalizarEmpresa(data.data ?? data)
  })
}

/** CONTRATO PROVISIONAL: PUT /empresas/:id. */
export async function actualizarEmpresa(id, payload) {
  const datosEditables = seleccionarCamposEditables(payload)
  if (USE_MOCKS) return (await cargarMock()).actualizarEmpresaMock(id, datosEditables)

  return ejecutarPeticion(async () => {
    const { data } = await api.put(`/empresas/${id}`, prepararPayload(datosEditables))
    return normalizarEmpresa(data.data ?? data)
  })
}

/** CONTRATO PROVISIONAL: DELETE /empresas/:id (desactivación lógica). */
export async function desactivarEmpresa(id) {
  if (USE_MOCKS) return (await cargarMock()).desactivarEmpresaMock(id)

  return ejecutarPeticion(async () => {
    const { data } = await api.delete(`/empresas/${id}`)
    const respuesta = data?.data ?? data
    const empresa =
      respuesta && typeof respuesta === 'object' ? respuesta : { id, estado: 'inactive' }
    return normalizarEmpresa(empresa)
  })
}
