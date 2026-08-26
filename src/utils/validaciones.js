/**
 * Reglas de validación compartidas por los formularios del panel.
 *
 * Estaban escritas dos veces, carácter a carácter, en `EmpresaForm` y
 * `UsuarioForm`. Duplicar una regla de validación es peor que duplicar código
 * normal: cuando se afina una (aceptar un prefijo, ampliar una longitud), es
 * fácil arreglar sólo uno de los dos formularios y que el otro siga rechazando
 * datos válidos.
 *
 * Son validaciones de FORMA, para dar aviso inmediato al usuario. La validación
 * que manda es la del backend, que llega como 422 y se muestra por campo.
 */

/**
 * Correo con forma razonable.
 *
 * Deliberadamente permisiva: no intenta implementar RFC 5322, que es
 * inabarcable con una expresión regular y rechaza direcciones legítimas. Sólo
 * descarta lo evidente (sin arroba, sin dominio, con espacios).
 */
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function esCorreoValido(valor) {
  return CORREO.test(String(valor ?? '').trim())
}

/** Caracteres admitidos en un teléfono: dígitos, espacios, guiones y prefijo `+`. */
const TELEFONO = /^\+?[0-9\s-]+$/

/**
 * Teléfono de 7 a 15 dígitos, ignorando separadores.
 *
 * El máximo de 15 es el que fija la norma E.164 para un número internacional;
 * el mínimo de 7 deja pasar los fijos locales sin prefijo.
 */
export function esTelefonoValido(valor) {
  const telefono = String(valor ?? '').trim()
  const digitos = telefono.replace(/\D/g, '')
  return TELEFONO.test(telefono) && digitos.length >= 7 && digitos.length <= 15
}

/** Color hexadecimal de seis dígitos, con almohadilla. */
const COLOR_HEX = /^#[0-9a-f]{6}$/i

export function esColorValido(valor) {
  return COLOR_HEX.test(String(valor ?? ''))
}

/**
 * URL absoluta con esquema http o https.
 *
 * Se apoya en el constructor `URL` del navegador en vez de en una expresión
 * regular, y se exige el esquema explícitamente para no aceptar `javascript:`
 * ni `data:`, que en un enlace serían un vector de ejecución.
 */
export function esUrlValida(valor) {
  try {
    return ['http:', 'https:'].includes(new URL(String(valor)).protocol)
  } catch {
    return false
  }
}

/** Fecha en formato `AAAA-MM-DD` que exista y no esté en el futuro. */
export function esFechaPasada(valor, ahora = new Date()) {
  const instante = new Date(`${valor}T00:00:00`)
  return !Number.isNaN(instante.getTime()) && instante <= ahora
}
