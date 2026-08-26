/**
 * Punto único de lectura de las variables de entorno de Vite.
 *
 * Se centraliza aquí por tres motivos concretos:
 *  1. `import.meta.env` devuelve siempre cadenas: la cadena "false" es truthy y
 *     provocaría que el modo mock no se pudiese desactivar nunca.
 *  2. Los valores por defecto dependen del modo de build, no son constantes.
 *  3. Ningún otro archivo necesita conocer los nombres VITE_*.
 */

function leerBooleano(valor, porDefecto) {
  if (valor === undefined || valor === '') return porDefecto
  return String(valor).trim().toLowerCase() === 'true'
}

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Gym Bros'

const baseIndicada = import.meta.env.VITE_API_BASE_URL

if (import.meta.env.PROD && !baseIndicada) {
  console.error(
    '[Gym Bros] Falta VITE_API_BASE_URL en el build: la aplicación apuntará a localhost.',
  )
}

/** URL base de la API REST de Laravel 11. Sólo se usa si USE_MOCKS es false. */
export const API_BASE_URL = baseIndicada || 'http://localhost:8000/api/v1'

/**
 * En desarrollo los mocks se activan por defecto: el backend de Natan todavía no
 * existe y un entorno sin configurar debe arrancar igualmente.
 *
 * En un build de producción el valor por defecto es `false` a propósito: si
 * alguien despliega sin definir VITE_USE_MOCKS, el panel NO puede quedarse
 * autenticando contra datos simulados con credenciales públicas.
 */
export const USE_MOCKS = leerBooleano(import.meta.env.VITE_USE_MOCKS, import.meta.env.DEV)
