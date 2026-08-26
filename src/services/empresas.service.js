import { USE_MOCKS } from '@/config/env'
import {
  actualizarEmpresaMock,
  crearEmpresaMock,
  desactivarEmpresaMock,
  obtenerEmpresaMock,
  obtenerEmpresasMock,
} from '@/mocks/empresas.mock'
import api from '@/services/api'
import { HttpError } from '@/services/http-error'

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

function normalizarEstado(estado) {
  if (estado === 'activo' || estado === true || estado === 1) return 'active'
  if (estado === 'inactivo' || estado === false || estado === 0) return 'inactive'
  if (estado === 'active' || estado === 'inactive') return estado
  return 'inactive'
}

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

function normalizarListado(datos = {}) {
  const itemsCrudos = Array.isArray(datos.data) ? datos.data : (datos.items ?? [])
  const meta = datos.meta ?? datos.paginacion ?? datos
  const pagina = Number(meta.current_page ?? meta.pagina ?? 1)
  const porPagina = Number(meta.per_page ?? meta.porPagina ?? (itemsCrudos.length || 10))
  const total = Number(meta.total ?? itemsCrudos.length)

  return {
    items: itemsCrudos.map(normalizarEmpresa),
    paginacion: {
      pagina,
      ultimaPagina: Number(meta.last_page ?? meta.ultimaPagina ?? 1),
      porPagina,
      total,
      desde: Number(meta.from ?? meta.desde ?? (total ? (pagina - 1) * porPagina + 1 : 0)),
      hasta: Number(
        meta.to ?? meta.hasta ?? (total ? (pagina - 1) * porPagina + itemsCrudos.length : 0),
      ),
    },
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

function seleccionarCamposEditables(payload = {}) {
  return Object.fromEntries(
    CAMPOS_EDITABLES.filter((campo) => Object.hasOwn(payload, campo)).map((campo) => [
      campo,
      payload[campo],
    ]),
  )
}

function prepararParametros({ busqueda = '', estado = '', pagina = 1, porPagina = 10 } = {}) {
  return {
    search: busqueda,
    status: estado,
    page: pagina,
    per_page: porPagina,
  }
}

function normalizarError(error) {
  if (error?.status !== 422 || !error.errors) return error

  const errors = Object.fromEntries(
    Object.entries(error.errors).map(([campo, mensajes]) => [
      CAMPOS_ERROR[campo] ?? campo,
      mensajes,
    ]),
  )
  return new HttpError({ status: error.status, message: error.message, errors })
}

async function ejecutarPeticion(peticion) {
  try {
    return await peticion()
  } catch (error) {
    throw normalizarError(error)
  }
}

/** CONTRATO PROVISIONAL: GET /empresas. */
export async function obtenerEmpresas(params = {}) {
  if (USE_MOCKS) return obtenerEmpresasMock(params)

  return ejecutarPeticion(async () => {
    const { data } = await api.get('/empresas', { params: prepararParametros(params) })
    return normalizarListado(data)
  })
}

/** CONTRATO PROVISIONAL: GET /empresas/:id. */
export async function obtenerEmpresa(id) {
  if (USE_MOCKS) return obtenerEmpresaMock(id)

  return ejecutarPeticion(async () => {
    const { data } = await api.get(`/empresas/${id}`)
    return normalizarEmpresa(data.data ?? data)
  })
}

/** CONTRATO PROVISIONAL: POST /empresas. */
export async function crearEmpresa(payload) {
  const datosEditables = seleccionarCamposEditables(payload)
  if (USE_MOCKS) return crearEmpresaMock(datosEditables)

  return ejecutarPeticion(async () => {
    const { data } = await api.post('/empresas', prepararPayload(datosEditables))
    return normalizarEmpresa(data.data ?? data)
  })
}

/** CONTRATO PROVISIONAL: PUT /empresas/:id. */
export async function actualizarEmpresa(id, payload) {
  const datosEditables = seleccionarCamposEditables(payload)
  if (USE_MOCKS) return actualizarEmpresaMock(id, datosEditables)

  return ejecutarPeticion(async () => {
    const { data } = await api.put(`/empresas/${id}`, prepararPayload(datosEditables))
    return normalizarEmpresa(data.data ?? data)
  })
}

/** CONTRATO PROVISIONAL: DELETE /empresas/:id (desactivación lógica). */
export async function desactivarEmpresa(id) {
  if (USE_MOCKS) return desactivarEmpresaMock(id)

  return ejecutarPeticion(async () => {
    const { data } = await api.delete(`/empresas/${id}`)
    const respuesta = data?.data ?? data
    const empresa =
      respuesta && typeof respuesta === 'object' ? respuesta : { id, estado: 'inactive' }
    return normalizarEmpresa(empresa)
  })
}
