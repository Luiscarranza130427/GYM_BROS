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

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
const CAMPOS_HORARIO = DIAS.flatMap((dia) => [`horario_inicio_${dia}`, `horario_fin_${dia}`])

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
  enlace_web: 'sitioWeb',
  logo_url: 'logoUrl',
  logo: 'logoUrl',
  color_primario: 'colorPrimario',
  color_secundario: 'colorSecundario',
  primary_color: 'colorPrimario',
  secondary_color: 'colorSecundario',
  color_1: 'colorPrimario',
  color_2: 'colorSecundario',
  ...Object.fromEntries(CAMPOS_HORARIO.map((campo) => [campo, campo])),
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
  ...CAMPOS_HORARIO,
]

function normalizarHora(valor) {
  if (valor === null || valor === undefined || valor === '') return ''
  const [hora = '', minutos = '00'] = String(valor).trim().replace('.', ':').split(':')
  if (!/^\d{1,2}$/.test(hora) || !/^\d{1,2}$/.test(minutos)) return ''
  return `${hora.padStart(2, '0')}:${minutos.padEnd(2, '0').slice(0, 2)}`
}

const normalizarHorarios = (datos) =>
  Object.fromEntries(CAMPOS_HORARIO.map((campo) => [campo, normalizarHora(datos[campo])]))

function normalizarEmpresa(datos = {}) {
  const usuarios = datos.usuarios_count ?? datos.usuarios ?? null

  return {
    id: datos.id,
    nombre: datos.nombre ?? datos.name ?? '',
    gerente: datos.gerente ?? datos.manager_name ?? datos.nombre_gerente ?? '',
    ruc: datos.ruc ?? datos.tax_id ?? '',
    correo: datos.correo ?? datos.email ?? '',
    telefono: datos.telefono ?? datos.phone ?? '',
    region: datos.region ?? '',
    direccion: datos.direccion ?? '',
    sitioWeb: datos.enlace_web ?? datos.sitio_web ?? datos.sitioWeb ?? datos.website ?? '',
    estado: normalizarEstado(datos.estado ?? datos.status),
    usuarios: usuarios === null ? null : Number(usuarios),
    fechaRegistro: datos.fecha_registro ?? datos.fechaRegistro ?? datos.created_at ?? '',
    logoUrl: resolverUrlStorage(datos.logo_url ?? datos.logoUrl ?? datos.logo ?? ''),
    colorPrimario:
      datos.color_primario ?? datos.colorPrimario ?? datos.color_1 ?? datos.color_fondo ?? '',
    colorSecundario:
      datos.color_secundario ?? datos.colorSecundario ?? datos.color_2 ?? datos.color_texto ?? '',
    ...normalizarHorarios(datos),
  }
}

function prepararPayload(payload) {
  const campos = {
    nombre: payload.nombre,
    nombre_gerente: payload.gerente,
    ruc: payload.ruc,
    correo: payload.correo,
    telefono: payload.telefono,
    region: payload.region,
    direccion: payload.direccion,
    enlace_web: payload.sitioWeb,
    estado: payload.estado === 'active' ? 1 : payload.estado === 'inactive' ? 0 : payload.estado,
    logo: payload.logoUrl,
    color_1: payload.colorPrimario,
    color_2: payload.colorSecundario,
    ...Object.fromEntries(
      CAMPOS_HORARIO.map((campo) => [
        campo,
        typeof payload[campo] === 'string' ? payload[campo].replace(':', '.') : payload[campo],
      ]),
    ),
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

/**
 * Los tres banners que la app móvil muestra para la empresa.
 *
 * Son columnas de `empresas` (`banner_1..3` y `link_boton_1..3`), no una tabla
 * aparte, aunque el endpoint viva en su propia ruta.
 */
function normalizarBanners(datos = {}) {
  return [1, 2, 3].map((n) => ({
    numero: n,
    imagen: datos[`banner_${n}`] ?? '',
    imagenUrl: resolverUrlStorage(datos[`banner_${n}`] ?? ''),
    enlace: datos[`link_boton_${n}`] ?? '',
  }))
}

/** CONTRATO REAL: GET /empresa/banners/:id */
export async function obtenerBannersEmpresa(id) {
  if (USE_MOCKS) return (await cargarMock()).obtenerBannersEmpresaMock(id)

  return ejecutarPeticion(async () => {
    const { data } = await api.get(`/empresa/banners/${id}`)
    return normalizarBanners(data?.data ?? data ?? {})
  })
}

/**
 * CONTRATO REAL: PUT /empresa/banners/:id
 *
 * Manda SIEMPRE los seis campos, aunque sólo cambie uno.
 *
 * El controlador de Laravel asigna `$request->banner_1` y sus cinco hermanos sin
 * comprobar si vinieron: lo que no se envía se guarda como `null`. Un envío
 * parcial no actualiza un banner, borra los otros dos y sus tres enlaces.
 */
export async function guardarBannersEmpresa(id, banners) {
  // Un hueco sin usar viaja como `null`, no como cadena vacía: es lo que guarda
  // la base de datos para «no hay banner», y así ambos campos se comportan
  // igual en lugar de que la imagen quede en '' y el enlace en null.
  const oNulo = (valor) => (typeof valor === 'string' && valor.trim() ? valor.trim() : null)

  const payload = {}
  for (let n = 1; n <= 3; n += 1) {
    const banner = banners.find((actual) => actual.numero === n) ?? {}
    payload[`banner_${n}`] = oNulo(banner.imagen)
    payload[`link_boton_${n}`] = oNulo(banner.enlace)
  }

  if (USE_MOCKS) return (await cargarMock()).guardarBannersEmpresaMock(id, payload)

  return ejecutarPeticion(async () => {
    const { data } = await api.put(`/empresa/banners/${id}`, payload)
    return normalizarBanners(data?.data ?? data ?? payload)
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
