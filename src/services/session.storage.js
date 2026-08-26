/**
 * Persistencia de la sesión durante el desarrollo.
 *
 * ⚠ AVISO DE SEGURIDAD: `localStorage` NO es un mecanismo de seguridad. Cualquier
 * script inyectado en la página (XSS) puede leerlo. Se usa aquí únicamente para
 * no perder la sesión simulada al recargar mientras desarrollamos sin backend.
 *
 * El mecanismo definitivo depende de cómo implemente Natan la autenticación en
 * Laravel 11:
 *   - Sanctum con cookies httpOnly + SPA  -> este archivo desaparece y el token
 *     deja de tocarse desde JavaScript.
 *   - Tokens Bearer                       -> se mantiene la forma, pero hay que
 *     decidir conscientemente dónde se guardan.
 * En cualquiera de los dos casos, éste es el único archivo que hay que cambiar.
 *
 * Sólo se usa para REHIDRATAR la sesión al arrancar. En tiempo de ejecución la
 * fuente de verdad del token es el store, no este almacenamiento.
 */

export const CLAVE_SESION = 'gymbros.sesion'

/** @returns {{token: string, usuario: object}|null} */
export function leerSesion() {
  try {
    const crudo = localStorage.getItem(CLAVE_SESION)
    if (!crudo) return null

    const sesion = JSON.parse(crudo)
    if (!sesion?.token || !sesion?.usuario) return null

    return sesion
  } catch {
    // JSON corrupto o almacenamiento no disponible: se trata como "sin sesión".
    return null
  }
}

export function guardarSesion(sesion) {
  try {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
  } catch {
    // Modo privado o cuota agotada: la sesión seguirá viva en memoria.
  }
}

export function limpiarSesion() {
  try {
    localStorage.removeItem(CLAVE_SESION)
  } catch {
    // Nada que hacer: el estado en memoria ya se ha limpiado.
  }
}
