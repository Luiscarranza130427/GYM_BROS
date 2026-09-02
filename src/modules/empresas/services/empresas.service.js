import api from '@/core/api/api'
import {
  crearNormalizadorDeError,
  ejecutarPeticion as ejecutar,
  normalizarEstado,
  normalizarListado as normalizarListadoBase,
  seleccionarCamposEditables as seleccionarEditables,
} from '@/core/api/normalizacion'
import { USE_MOCKS } from '@/core/config/env'
import { HttpError } from '@/core/api/http-error'
import { resolverUrlStorage } from '@/shared/utils/storage'

const cargarMock = () => import('@/modules/empresas/mocks/empresas.mock')

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
    logoUrl: resolverUrlStorage(datos.logo_url ?? datos.logoUrl ?? datos.logo ?? ''),
    colorPrimario:
      datos.color_primario ?? datos.colorPrimario ?? datos.color_1 ?? datos.color_fondo ?? '',
    colorSecundario:
      datos.color_secundario ?? datos.colorSecundario ?? datos.color_2 ?? datos.color_texto ?? '',
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

export async function obtenerEmpresas(params = {}) {
  if (USE_MOCKS) return (await cargarMock()).obtenerEmpresasMock(params)

  return ejecutarPeticion(async () => {
    const { data } = await api.get('/empresas', { params: prepararParametros(params) })
    return normalizarListado(data)
  })
}

export async function obtenerEmpresa(id) {
  if (USE_MOCKS) return (await cargarMock()).obtenerEmpresaMock(id)

  return ejecutarPeticion(async () => {
    try {
      const { data } = await api.get(`/empresas/${id}`)
      const respuesta = normalizarEmpresa(data.data ?? data)
      // Laravel responde 200 con un objeto vacío (campos null) para este endpoint.
      // En ese caso el listado es la fuente real de datos.
      if (respuesta.id !== null && respuesta.id !== undefined && respuesta.nombre) {
        return respuesta
      }
    } catch (error) {
      const status = error?.status ?? error?.response?.status
      if (status !== 404 && status !== 405) throw error
    }

    const { items } = await obtenerEmpresas({ pagina: 1, porPagina: 10000 })
    const empresa = items.find((item) => Number(item.id) === Number(id))
    if (!empresa) throw new HttpError(404, 'La empresa solicitada no existe.')
    return empresa
  })
}

export async function crearEmpresa(payload) {
  const datosEditables = seleccionarCamposEditables(payload)
  if (USE_MOCKS) return (await cargarMock()).crearEmpresaMock(datosEditables)

  return ejecutarPeticion(async () => {
    const { data } = await api.post('/empresas', prepararPayload(datosEditables))
    return normalizarEmpresa(data.data ?? data)
  })
}

export async function actualizarEmpresa(id, payload) {
  const datosEditables = seleccionarCamposEditables(payload)
  if (USE_MOCKS) return (await cargarMock()).actualizarEmpresaMock(id, datosEditables)

  return ejecutarPeticion(async () => {
    const { data } = await api.put(`/empresas/${id}`, prepararPayload(datosEditables))
    return normalizarEmpresa(data.data ?? data)
  })
}

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
