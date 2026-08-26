import { USE_MOCKS } from '@/config/env'
import api from '@/services/api'
import { obtenerEmpresas } from '@/services/empresas.service'
import {
  crearNormalizadorDeError,
  ejecutarPeticion as ejecutar,
  normalizarEstado,
  normalizarListado as normalizarListadoBase,
  seleccionarCamposEditables as seleccionarEditables,
} from '@/services/normalizacion'

/** Import dinámico: mantiene los datos simulados fuera del bundle de producción. */
const cargarMock = () => import('@/mocks/usuarios.mock')

const CAMPOS_ERROR = {
  first_name: 'nombre',
  last_name: 'apellido',
  email: 'correo',
  document_type: 'tipoDocumento',
  tipo_documento: 'tipoDocumento',
  document_number: 'numeroDocumento',
  numero_documento: 'numeroDocumento',
  phone: 'telefono',
  address: 'direccion',
  profile_photo: 'fotoPerfil',
  foto_perfil: 'fotoPerfil',
  birth_date: 'fechaNacimiento',
  fecha_nacimiento: 'fechaNacimiento',
  role: 'rol',
  tipo_usuario: 'rol',
  status: 'estado',
  company_id: 'empresaId',
  id_empresas: 'empresaId',
  'suscripcion.fecha_inicio': 'suscripcion.fechaInicio',
  'suscripcion.fecha_vencimiento': 'suscripcion.fechaVencimiento',
}

const CAMPOS_EDITABLES = [
  'nombre',
  'apellido',
  'correo',
  'tipoDocumento',
  'numeroDocumento',
  'telefono',
  'direccion',
  'fotoPerfil',
  'fechaNacimiento',
  'rol',
  'estado',
  'empresaId',
  'suscripcion',
]

const SUSCRIPCION_VACIA = {
  estado: 'none',
  fechaInicio: '',
  fechaVencimiento: '',
  diasRestantes: 0,
  nombrePlan: '',
}

const ACTIVIDAD_VACIA = { rutinas: 0, asistenciasMes: 0, ultimaActividad: '' }

function normalizarEmpresa(datos = {}, empresaId) {
  if (typeof datos === 'string') return { id: Number(empresaId) || null, nombre: datos }
  return {
    id: Number(datos.id ?? datos.empresa_id ?? datos.id_empresas ?? empresaId) || null,
    nombre: datos.nombre ?? datos.name ?? datos.razon_social ?? '',
  }
}

function normalizarSuscripcion(datos) {
  if (!datos) return { ...SUSCRIPCION_VACIA }
  return {
    estado: datos.estado ?? datos.status ?? 'none',
    fechaInicio: datos.fecha_inicio ?? datos.fechaInicio ?? datos.started_at ?? '',
    fechaVencimiento: datos.fecha_vencimiento ?? datos.fechaVencimiento ?? datos.ends_at ?? '',
    diasRestantes: Number(datos.dias_restantes ?? datos.diasRestantes ?? datos.days_remaining ?? 0),
    nombrePlan:
      datos.nombre_plan ?? datos.nombrePlan ?? datos.plan_name ?? datos.plan?.nombre ?? '',
  }
}

function normalizarActividad(datos) {
  if (!datos) return { ...ACTIVIDAD_VACIA }
  return {
    rutinas: Number(datos.rutinas_count ?? datos.rutinas ?? 0),
    asistenciasMes: Number(datos.asistencias_mes ?? datos.asistenciasMes ?? 0),
    ultimaActividad:
      datos.ultima_actividad ?? datos.ultimaActividad ?? datos.last_activity_at ?? '',
  }
}

function normalizarUsuario(datos = {}) {
  const empresaId = datos.id_empresas ?? datos.company_id ?? datos.empresa_id
  return {
    id: datos.id,
    nombre: datos.nombre ?? datos.first_name ?? '',
    apellido: datos.apellido ?? datos.last_name ?? '',
    correo: datos.correo ?? datos.email ?? '',
    tipoDocumento: datos.tipo_documento ?? datos.tipoDocumento ?? datos.document_type ?? '',
    numeroDocumento: datos.numero_documento ?? datos.numeroDocumento ?? datos.document_number ?? '',
    telefono: datos.telefono ?? datos.phone ?? '',
    direccion: datos.direccion ?? datos.address ?? '',
    fotoPerfil: datos.foto_perfil ?? datos.fotoPerfil ?? datos.profile_photo ?? '',
    fechaNacimiento: datos.fecha_nacimiento ?? datos.fechaNacimiento ?? datos.birth_date ?? '',
    fechaRegistro: datos.fecha_registro ?? datos.fechaRegistro ?? datos.created_at ?? '',
    rol: datos.tipo_usuario ?? datos.rol ?? datos.role ?? 'member',
    estado: normalizarEstado(datos.estado ?? datos.status),
    empresa: normalizarEmpresa(datos.empresa ?? datos.company, empresaId),
    suscripcion: normalizarSuscripcion(datos.suscripcion ?? datos.subscription),
    actividad: normalizarActividad(datos.actividad ?? datos.activity),
  }
}

function normalizarEventoHistorial(datos = {}) {
  return {
    id: datos.id,
    fecha: datos.fecha ?? datos.created_at ?? '',
    accion: datos.accion ?? datos.action ?? 'updated',
    descripcion: datos.descripcion ?? datos.description ?? '',
    autor: datos.autor?.nombre ?? datos.autor?.name ?? datos.autor ?? datos.author?.name ?? '',
  }
}

function prepararSuscripcion(suscripcion) {
  if (!suscripcion) return undefined
  return {
    estado: suscripcion.estado,
    fecha_inicio: suscripcion.fechaInicio,
    fecha_vencimiento: suscripcion.fechaVencimiento,
    nombre_plan: suscripcion.nombrePlan,
  }
}

function prepararPayload(payload) {
  const campos = {
    nombre: payload.nombre,
    apellido: payload.apellido,
    correo: payload.correo,
    tipo_documento: payload.tipoDocumento,
    numero_documento: payload.numeroDocumento,
    telefono: payload.telefono,
    direccion: payload.direccion,
    foto_perfil: payload.fotoPerfil,
    fecha_nacimiento: payload.fechaNacimiento,
    tipo_usuario: payload.rol,
    estado: payload.estado,
    id_empresas: payload.empresaId,
    suscripcion: prepararSuscripcion(payload.suscripcion),
  }
  return Object.fromEntries(Object.entries(campos).filter(([, valor]) => valor !== undefined))
}

function prepararParametros({
  busqueda = '',
  empresaId = '',
  estado = '',
  rol = '',
  suscripcion = '',
  pagina = 1,
  porPagina = 10,
} = {}) {
  return {
    search: busqueda,
    id_empresas: empresaId,
    estado,
    tipo_usuario: rol,
    estado_suscripcion: suscripcion,
    page: pagina,
    per_page: porPagina,
  }
}

const normalizarError = crearNormalizadorDeError(CAMPOS_ERROR)
const ejecutarPeticion = (peticion) => ejecutar(peticion, normalizarError)
const normalizarListado = (datos) => normalizarListadoBase(datos, normalizarUsuario)
const seleccionarCamposEditables = (payload) => seleccionarEditables(payload, CAMPOS_EDITABLES)

/** CONTRATO PROVISIONAL: GET /usuarios. */
export async function obtenerUsuarios(params = {}) {
  if (USE_MOCKS) return (await cargarMock()).obtenerUsuariosMock(params)

  return ejecutarPeticion(async () => {
    const { data } = await api.get('/usuarios', { params: prepararParametros(params) })
    return normalizarListado(data)
  })
}

/** CONTRATO PROVISIONAL: GET /usuarios/:id. */
export async function obtenerUsuario(id) {
  if (USE_MOCKS) return (await cargarMock()).obtenerUsuarioMock(id)

  return ejecutarPeticion(async () => {
    const { data } = await api.get(`/usuarios/${id}`)
    return normalizarUsuario(data.data ?? data)
  })
}

/** CONTRATO PROVISIONAL: POST /usuarios. */
export async function crearUsuario(payload) {
  const datosEditables = seleccionarCamposEditables(payload)
  if (USE_MOCKS) return (await cargarMock()).crearUsuarioMock(datosEditables)

  return ejecutarPeticion(async () => {
    const { data } = await api.post('/usuarios', prepararPayload(datosEditables))
    return normalizarUsuario(data.data ?? data)
  })
}

/** CONTRATO PROVISIONAL: PUT /usuarios/:id. */
export async function actualizarUsuario(id, payload) {
  const datosEditables = seleccionarCamposEditables(payload)
  if (USE_MOCKS) return (await cargarMock()).actualizarUsuarioMock(id, datosEditables)

  return ejecutarPeticion(async () => {
    const { data } = await api.put(`/usuarios/${id}`, prepararPayload(datosEditables))
    return normalizarUsuario(data.data ?? data)
  })
}

/** CONTRATO PROVISIONAL: DELETE /usuarios/:id (desactivación lógica). */
export async function desactivarUsuario(id) {
  if (USE_MOCKS) return (await cargarMock()).desactivarUsuarioMock(id)

  return ejecutarPeticion(async () => {
    const { data } = await api.delete(`/usuarios/${id}`)
    const respuesta = data?.data ?? data
    return normalizarUsuario(
      respuesta && typeof respuesta === 'object' ? respuesta : { id, estado: 'inactive' },
    )
  })
}

/** CONTRATO PROVISIONAL: GET /usuarios/:id/historial. */
export async function obtenerHistorialUsuario(id) {
  if (USE_MOCKS) return (await cargarMock()).obtenerHistorialUsuarioMock(id)

  return ejecutarPeticion(async () => {
    const { data } = await api.get(`/usuarios/${id}/historial`)
    const eventos = data.data ?? data
    return Array.isArray(eventos) ? eventos.map(normalizarEventoHistorial) : []
  })
}

/** Opciones ligeras para selects; la fuente sigue siendo el módulo Empresas. */
export async function obtenerOpcionesEmpresas() {
  const { items } = await obtenerEmpresas({ pagina: 1, porPagina: 100 })
  return items.map(({ id, nombre, estado }) => ({ id, nombre, estado }))
}
