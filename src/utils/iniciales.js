/**
 * Iniciales de un nombre, para los avatares del panel.
 *
 * El diseño de referencia usa fotografías servidas desde un CDN externo. Aquí se
 * usan iniciales: no dependemos de una URL de terceros, no hay imágenes rotas
 * cuando el usuario no tiene foto y no se filtra nada a otro dominio. Cuando
 * Laravel sirva avatares reales, este cálculo queda como alternativa.
 *
 * @param {string} [nombre]
 * @returns {string} Una o dos letras en mayúscula, o '?' si no hay nombre.
 */
export function inicialesDe(nombre) {
  const partes = (nombre ?? '').split(' ').filter(Boolean)
  if (partes.length === 0) return '?'

  const primera = partes[0].charAt(0)
  const segunda = partes.length > 1 ? partes[partes.length - 1].charAt(0) : ''

  return (primera + segunda).toUpperCase()
}
