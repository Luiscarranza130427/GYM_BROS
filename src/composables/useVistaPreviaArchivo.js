import { onBeforeUnmount, ref } from 'vue'

/** 2 MB: el tope que anuncian los formularios de logo y de foto de perfil. */
const TAMANO_MAXIMO = 2 * 1024 * 1024

/**
 * Vista previa local de una imagen elegida con `<input type="file">`.
 *
 * El ciclo de `URL.createObjectURL` es fácil de romper y estaba duplicado en los
 * dos formularios, con una diferencia real entre ellos: `EmpresaForm` no
 * revocaba la URL anterior al recargar valores y filtraba un blob por cada
 * recarga. Aquí sólo hay una implementación, y libera siempre.
 *
 * OJO: esto es SÓLO vista previa. El archivo no se envía a ninguna parte porque
 * la API todavía no expone dónde subirlo; el formulario lo advierte de forma
 * explícita. Cuando exista el endpoint, este composable es el sitio donde
 * exponer el `File` seleccionado.
 */
export function useVistaPreviaArchivo({ maximoBytes = TAMANO_MAXIMO, etiqueta = 'archivo' } = {}) {
  const url = ref('')
  const error = ref('')

  /** URL de objeto viva, si la hay. Se guarda aparte de `url`, que puede ser remota. */
  let urlTemporal = ''

  function liberar() {
    if (!urlTemporal) return
    URL.revokeObjectURL(urlTemporal)
    urlTemporal = ''
  }

  /** Vuelve al valor que venga del servidor y descarta cualquier selección. */
  function reiniciar(urlInicial = '') {
    liberar()
    error.value = ''
    url.value = urlInicial || ''
  }

  /**
   * @param {Event} evento  `change` del input de archivo.
   * @param {string} [urlActual] URL a la que volver si se cancela la selección.
   */
  function seleccionar(evento, urlActual = '') {
    const archivo = evento.target.files?.[0]
    liberar()
    error.value = ''

    if (!archivo) {
      url.value = urlActual || ''
      return
    }

    if (!archivo.type.startsWith('image/')) {
      error.value = 'Selecciona un archivo de imagen.'
      evento.target.value = ''
      return
    }

    if (archivo.size > maximoBytes) {
      const megas = Math.round(maximoBytes / 1024 / 1024)
      error.value = `El ${etiqueta} no puede superar ${megas} MB.`
      evento.target.value = ''
      return
    }

    urlTemporal = URL.createObjectURL(archivo)
    url.value = urlTemporal
  }

  onBeforeUnmount(liberar)

  return { url, error, seleccionar, reiniciar, liberar }
}
