const FORMATEADOR_NUMEROS = new Intl.NumberFormat('es-PE')
const FORMATEADOR_FECHAS = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})
const FORMATEADOR_FECHA_HORA = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** Formato numérico único para los datos del panel. */
export function formatearNumero(valor) {
  return FORMATEADOR_NUMEROS.format(Number(valor) || 0)
}

/**
 * Muestra fechas de API de forma localizada y tolerante a valores inválidos.
 *
 * Se fija UTC porque estos valores son fechas de calendario ('2024-01-15',
 * un alta, un vencimiento). Interpretarlas en la zona local haría que en Perú
 * (UTC-5) se mostrase el día anterior.
 */
export function formatearFecha(fecha) {
  const instante = new Date(fecha)
  return Number.isNaN(instante.getTime())
    ? 'Fecha no disponible'
    : FORMATEADOR_FECHAS.format(instante)
}

/**
 * Fecha y hora de un instante concreto (un evento del historial).
 *
 * Aquí NO se fija UTC, al contrario que en `formatearFecha`: un evento ocurrió
 * en un momento del tiempo y quien lo consulta espera verlo en su propia hora.
 * La diferencia entre ambas funciones es deliberada, no un descuido.
 */
export function formatearFechaHora(fecha) {
  const instante = new Date(fecha)
  return !fecha || Number.isNaN(instante.getTime())
    ? 'Fecha no disponible'
    : FORMATEADOR_FECHA_HORA.format(instante)
}

/**
 * Convierte una fecha ISO en una etiqueta breve sin añadir una dependencia.
 * Para eventos antiguos deja de fingir precisión y muestra la fecha local.
 */
export function formatearTiempoRelativo(fecha, ahora = new Date()) {
  const instante = new Date(fecha)
  if (Number.isNaN(instante.getTime())) return 'Fecha no disponible'

  const diferencia = Math.max(0, ahora.getTime() - instante.getTime())
  const minutos = Math.floor(diferencia / 60_000)

  if (minutos < 1) return 'Ahora'
  if (minutos < 60) return `Hace ${minutos} min`

  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `Hace ${horas} h`

  const dias = Math.floor(horas / 24)
  if (dias < 7) return `Hace ${dias} d`

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
  }).format(instante)
}
