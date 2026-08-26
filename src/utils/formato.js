const FORMATEADOR_NUMEROS = new Intl.NumberFormat('es-PE')
const FORMATEADOR_FECHAS = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/** Formato numérico único para los datos del panel. */
export function formatearNumero(valor) {
  return FORMATEADOR_NUMEROS.format(Number(valor) || 0)
}

/** Muestra fechas de API de forma localizada y tolerante a valores inválidos. */
export function formatearFecha(fecha) {
  const instante = new Date(fecha)
  return Number.isNaN(instante.getTime())
    ? 'Fecha no disponible'
    : FORMATEADOR_FECHAS.format(instante)
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
