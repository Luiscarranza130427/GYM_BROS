/**
 * Error normalizado de la capa de datos.
 *
 * Lo lanzan tanto el cliente HTTP real como los mocks, de forma que las vistas
 * tratan los fallos igual ahora y cuando exista Laravel: leen `message` y, si
 * necesitan detalle por campo, `errors`.
 */
export class HttpError extends Error {
  /**
   * @param {object} opciones
   * @param {number} opciones.status  Código HTTP (0 si no hubo respuesta).
   * @param {string} opciones.message Mensaje presentable al usuario.
   * @param {object|null} [opciones.errors] Errores por campo (formato 422 de Laravel).
   */
  constructor({ status, message, errors = null }) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.errors = errors
  }
}
