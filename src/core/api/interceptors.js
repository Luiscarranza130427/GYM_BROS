import { HttpError } from '@/core/api/http-error'
import { leerSesion } from '@/core/storage/session.storage'

let obtenerToken = () => {
  const sesion = leerSesion()
  return sesion?.token || null
}

let alDetectarNoAutorizado = () => {}

export function registrarProveedorDeToken(proveedor) {
  obtenerToken = proveedor
}

export function registrarManejadorNoAutorizado(manejador) {
  alDetectarNoAutorizado = manejador
}

export function configurarInterceptores(axiosInstance) {
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = obtenerToken?.()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error),
  )

  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        alDetectarNoAutorizado?.()
      }
      const status = error.response?.status ?? 500
      const data = error.response?.data ?? {}
      const message = data.message ?? error.message ?? 'Ha ocurrido un error inesperado.'
      const errors = data.errors ?? null

      return Promise.reject(new HttpError({ status, message, errors }))
    },
  )
}
