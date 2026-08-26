import axios from 'axios'

import { API_BASE_URL } from '@/config/env'
import { HttpError } from '@/services/http-error'

/**
 * Cliente HTTP único de la aplicación.
 *
 * Regla del proyecto: ningún componente ni vista llama a axios directamente.
 * El flujo siempre es  Vista -> Servicio -> api.js -> API REST de Laravel.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
})

/**
 * Dependencias que la aplicación inyecta desde `main.js`.
 *
 * Se registran desde fuera en lugar de importar aquí el store o el router: así
 * `api.js` no depende de Pinia ni de vue-router y se evita el ciclo de imports
 * api.js -> auth.store.js -> auth.service.js -> api.js.
 */
let obtenerToken = () => null
let alPerderSesion = null

/**
 * El token lo provee el store, que es la única fuente de verdad en tiempo de
 * ejecución. Leerlo del almacenamiento local haría que una sesión iniciada con
 * `localStorage` no disponible (modo privado, cuota agotada) enviase peticiones
 * sin cabecera `Authorization` mientras la aplicación se cree autenticada.
 */
export function registrarProveedorDeToken(proveedor) {
  obtenerToken = proveedor
}

export function registrarManejadorNoAutorizado(manejador) {
  alPerderSesion = manejador
}

api.interceptors.request.use((config) => {
  // Preparado para Bearer Token (Laravel Sanctum o similar).
  const token = obtenerToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** Mensajes por defecto cuando la respuesta no trae uno propio. */
const MENSAJES_POR_ESTADO = {
  0: 'No se pudo conectar con el servidor. Revisa tu conexión.',
  401: 'Tu sesión no es válida o ha caducado.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  422: 'Revisa los datos introducidos.',
  500: 'Error interno del servidor. Inténtalo de nuevo más tarde.',
}

/**
 * Convierte cualquier fallo de axios en un HttpError con forma estable.
 * Laravel responde `{ message }` y, en un 422, `{ message, errors }`.
 */
function normalizarError(error) {
  const status = error.response?.status ?? 0
  const datos = error.response?.data ?? {}

  return new HttpError({
    status,
    message: datos.message || MENSAJES_POR_ESTADO[status] || 'Ha ocurrido un error inesperado.',
    errors: datos.errors ?? null,
  })
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const fallo = normalizarError(error)

    if (fallo.status === 401 && alPerderSesion) {
      alPerderSesion()
    }

    return Promise.reject(fallo)
  },
)

export default api
