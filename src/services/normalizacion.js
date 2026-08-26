import { HttpError } from '@/services/http-error'

/**
 * Piezas compartidas por los servicios de recurso (Empresas, Usuarios y los
 * módulos CRUD que vengan).
 *
 * Se extraen aquí porque `empresas.service` y `usuarios.service` tenían la misma
 * lógica duplicada carácter a carácter: la forma de paginación de Laravel, el
 * filtrado de campos editables, la traducción de los 422 y el envoltorio de
 * errores. Con un módulo CRUD más, serían tres copias.
 *
 * Lo que NO vive aquí es la normalización de cada recurso (`normalizarEmpresa`,
 * `normalizarUsuario`): eso es el contrato propio de cada uno y debe quedarse en
 * su servicio.
 */

/**
 * Estado del backend -> 'active' | 'inactive'.
 *
 * Se aceptan las formas que Laravel podría enviar mientras el contrato no está
 * cerrado: castellano, booleano o 0/1.
 *
 * OJO: cualquier estado que no reconozca se convierte en 'inactive'. Si el día
 * de mañana el backend introduce 'suspended' o 'pending', aquí se perderá en
 * silencio y habrá que ampliar esta función a la vez.
 */
export function normalizarEstado(estado) {
  if (estado === 'activo' || estado === true || estado === 1) return 'active'
  if (estado === 'inactivo' || estado === false || estado === 0) return 'inactive'
  return estado === 'active' ? 'active' : 'inactive'
}

/**
 * Respuesta paginada -> `{ items, paginacion }`.
 *
 * Tolera las tres formas que puede tomar el cuerpo mientras el contrato sigue
 * abierto: el array en `data`, un envoltorio `{ data: { items, meta } }` o el
 * listado en la raíz. Cuando Laravel se cierre, esto se puede simplificar.
 *
 * @param {object} datos Cuerpo de la respuesta.
 * @param {(crudo: object) => object} normalizarItem Normalizador del recurso.
 */
export function normalizarListado(datos = {}, normalizarItem) {
  const cuerpo = datos.data && !Array.isArray(datos.data) ? datos.data : datos
  const itemsCrudos = Array.isArray(datos.data)
    ? datos.data
    : Array.isArray(cuerpo.items)
      ? cuerpo.items
      : []
  const meta = datos.meta ?? cuerpo.meta ?? cuerpo.paginacion ?? cuerpo
  const pagina = Number(meta.current_page ?? meta.pagina ?? 1)
  const porPagina = Number(meta.per_page ?? meta.porPagina ?? (itemsCrudos.length || 10))
  const total = Number(meta.total ?? itemsCrudos.length)

  return {
    items: itemsCrudos.map(normalizarItem),
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

/**
 * Se queda sólo con los campos que el formulario puede modificar.
 *
 * Evita que una vista envíe al backend campos calculados (`fechaRegistro`,
 * `actividad`, contadores) simplemente por haberlos recibido en el objeto.
 */
export function seleccionarCamposEditables(payload = {}, campos) {
  return Object.fromEntries(
    campos.filter((campo) => Object.hasOwn(payload, campo)).map((campo) => [campo, payload[campo]]),
  )
}

/**
 * Construye el traductor de errores 422 de un recurso.
 *
 * Laravel responde con los nombres de campo de su propia base de datos
 * (`first_name`, `id_empresas`). El formulario conoce los del dominio
 * (`nombre`, `empresaId`). Sin esta traducción, el mensaje de error existe pero
 * no se pinta bajo ningún campo.
 *
 * Sólo se ocupa de los 422: cualquier otro fallo se deja intacto.
 *
 * @param {Record<string, string>} diccionario campo del backend -> campo del dominio.
 */
export function crearNormalizadorDeError(diccionario) {
  return function normalizarError(error) {
    // `api.js` garantiza que todo fallo llega ya como HttpError, así que no hay
    // que contemplar la forma cruda de axios.
    if (error?.status !== 422 || !error.errors) return error

    const errors = Object.fromEntries(
      Object.entries(error.errors).map(([campo, mensajes]) => [
        diccionario[campo] ?? campo,
        Array.isArray(mensajes) ? mensajes : [mensajes],
      ]),
    )
    return new HttpError({ status: error.status, message: error.message, errors })
  }
}

/**
 * Ejecuta una petición traduciendo sus errores con el normalizador del recurso.
 */
export async function ejecutarPeticion(peticion, normalizarError) {
  try {
    return await peticion()
  } catch (error) {
    throw normalizarError(error)
  }
}
