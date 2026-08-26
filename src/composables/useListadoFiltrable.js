import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * Listado administrativo con filtros en la URL, búsqueda con rebote y paginación.
 *
 * Empresas y Usuarios tenían esta misma lógica copiada línea a línea: unas 150
 * por vista entre sincronizar la query, validar sus valores, descartar respuestas
 * obsoletas y gestionar el aviso de éxito. Cada módulo CRUD nuevo —ejercicios,
 * planes, pagos— habría añadido otra copia, y con ella otra oportunidad de que
 * un arreglo se aplicase sólo en dos de los cinco sitios.
 *
 * Aquí vive lo mecánico. Lo propio de cada módulo (qué servicio se llama, cómo
 * se traducen los filtros a parámetros y qué dice cada mensaje) entra por
 * parámetro, y la acción de desactivar se queda en la vista porque su texto y su
 * confirmación son específicos del recurso.
 *
 * La URL es la fuente de verdad: se navega y la navegación dispara la carga.
 * Así el botón atrás, recargar y compartir un enlace funcionan solos.
 */

/** Milisegundos que se espera a que el usuario deje de teclear antes de navegar. */
const RETARDO_BUSQUEDA = 350

/**
 * @param {object} opciones
 * @param {string} opciones.nombreRuta        Ruta con nombre del listado.
 * @param {(params: object) => Promise<{items: object[], paginacion: object}>} opciones.cargar
 * @param {Record<string, {permitidos?: string[], defecto?: string}>} [opciones.filtros]
 *   Filtros por su clave en la query. Sin `permitidos`, se acepta cualquier
 *   valor (p. ej. el id de empresa, que no es una lista cerrada).
 * @param {(filtros: object) => object} [opciones.mapearParametros]
 *   Traduce los filtros al vocabulario del servicio. Recibe ya resueltos los
 *   valores 'all' como cadena vacía.
 * @param {number} [opciones.porPagina]
 * @param {string} [opciones.mensajeDeError]
 * @param {Record<string, string>} [opciones.avisos]
 *   Mensajes para los `?notice=` con que otras vistas anuncian una acción ya
 *   realizada (por ejemplo `deactivated` tras borrar desde el detalle).
 */
export function useListadoFiltrable({
  nombreRuta,
  cargar,
  filtros: definicion = {},
  mapearParametros = (valores) => valores,
  porPagina = 8,
  mensajeDeError = 'No pudimos cargar el listado.',
  avisos = {},
}) {
  const route = useRoute()
  const router = useRouter()

  const PAGINACION_VACIA = {
    pagina: 1,
    ultimaPagina: 1,
    porPagina,
    total: 0,
    desde: 0,
    hasta: 0,
  }

  const claves = Object.keys(definicion)
  const porDefecto = (clave) => definicion[clave].defecto ?? 'all'

  const estadoVista = ref('idle')
  const items = ref([])
  const paginacion = ref({ ...PAGINACION_VACIA })
  const mensajeError = ref('')
  const mensajeExito = ref('')
  const mensajeExitoRef = ref(null)

  const busqueda = ref(String(route.query.search ?? ''))
  const filtros = reactive(
    Object.fromEntries(claves.map((clave) => [clave, valorValido(clave, route.query[clave])])),
  )

  /*
   * `temporizadorBusqueda === null` significa "el usuario no está escribiendo
   * ahora mismo". De ese dato depende que una carga pueda o no resincronizar la
   * caja de búsqueda desde la URL.
   */
  let temporizadorBusqueda = null
  let solicitudActual = 0

  const hayFiltros = computed(
    () =>
      Boolean(busqueda.value.trim()) ||
      claves.some((clave) => filtros[clave] !== porDefecto(clave)),
  )

  function valorValido(clave, valor) {
    const defecto = porDefecto(clave)
    const permitidos = definicion[clave].permitidos
    const texto = String(valor ?? defecto)
    return !permitidos || permitidos.includes(texto) ? texto : defecto
  }

  function paginaValida(valor) {
    const numero = Number.parseInt(valor, 10)
    return Number.isFinite(numero) && numero > 0 ? numero : 1
  }

  /** `clearTimeout` no borra la variable, y el resto se apoya en que sea null. */
  function cancelarBusquedaPendiente() {
    window.clearTimeout(temporizadorBusqueda)
    temporizadorBusqueda = null
  }

  /** Omite de la URL todo lo que ya sea el valor por defecto. */
  function construirQuery({ search, pagina, ...valores }) {
    const query = {}
    const termino = String(search).trim()
    if (termino) query.search = termino

    claves.forEach((clave) => {
      if (valores[clave] !== porDefecto(clave)) query[clave] = String(valores[clave])
    })

    if (Number(pagina) > 1) query.page = String(pagina)
    return query
  }

  function sonIgualesLasQueries(a, b) {
    const clavesA = Object.keys(a)
    const clavesB = Object.keys(b)
    return (
      clavesA.length === clavesB.length &&
      clavesA.every((clave) => String(a[clave]) === String(b[clave]))
    )
  }

  async function actualizarQuery(cambios = {}) {
    const actual = {
      search: busqueda.value,
      pagina: paginaValida(route.query.page),
      ...Object.fromEntries(claves.map((c) => [c, valorValido(c, route.query[c])])),
      ...cambios,
    }
    const query = construirQuery(actual)

    // Comparación clave a clave: `JSON.stringify` dependería del orden de
    // inserción y fallaría con un parámetro repetido en la URL.
    if (sonIgualesLasQueries(query, route.query)) return
    await router.replace({ name: nombreRuta, query })
  }

  async function cargarListado() {
    const idSolicitud = ++solicitudActual
    estadoVista.value = 'loading'
    mensajeError.value = ''

    /*
     * La caja de búsqueda sólo se resincroniza desde la URL cuando el usuario NO
     * está escribiendo. Si hay rebote pendiente, esta carga la provocó otra cosa
     * (un filtro, el botón atrás) y copiar aquí el `search` viejo borraría lo
     * que se está tecleando.
     */
    if (temporizadorBusqueda === null) {
      busqueda.value = String(route.query.search ?? '')
    }
    claves.forEach((clave) => {
      filtros[clave] = valorValido(clave, route.query[clave])
    })

    const valores = Object.fromEntries(
      claves.map((clave) => [clave, filtros[clave] === porDefecto(clave) ? '' : filtros[clave]]),
    )

    try {
      const respuesta = await cargar({
        ...mapearParametros(valores),
        busqueda: busqueda.value.trim(),
        pagina: paginaValida(route.query.page),
        porPagina,
      })
      if (idSolicitud !== solicitudActual) return

      items.value = respuesta.items
      paginacion.value = respuesta.paginacion
      estadoVista.value = 'success'

      // El backend puede devolver una página distinta de la pedida (la última,
      // si nos pasamos). La URL debe reflejar lo que se está viendo.
      if (respuesta.paginacion.pagina !== paginaValida(route.query.page)) {
        await actualizarQuery({ pagina: respuesta.paginacion.pagina })
      }
    } catch (error) {
      if (idSolicitud !== solicitudActual) return
      items.value = []
      paginacion.value = { ...PAGINACION_VACIA }
      mensajeError.value = error?.message || mensajeDeError
      estadoVista.value = 'error'
    }
  }

  function cambiarBusqueda(valor) {
    busqueda.value = valor
    cancelarBusquedaPendiente()
    temporizadorBusqueda = window.setTimeout(() => {
      temporizadorBusqueda = null
      actualizarQuery({ search: valor, pagina: 1 })
    }, RETARDO_BUSQUEDA)
  }

  function cambiarFiltro(clave, valor) {
    filtros[clave] = valor

    /*
     * Se navega ya, así que el rebote pendiente sobra: si se dejara vivo,
     * dispararía una segunda navegación. Y se arrastra lo tecleado hasta ahora
     * (`busqueda.value`, no el `search` de la URL, que va por detrás) para que
     * cambiar de filtro no descarte la búsqueda a medio escribir.
     */
    cancelarBusquedaPendiente()
    actualizarQuery({ [clave]: valor, search: busqueda.value, pagina: 1 })
  }

  function cambiarPagina(pagina) {
    actualizarQuery({ pagina })
  }

  function limpiarFiltros() {
    cancelarBusquedaPendiente()
    busqueda.value = ''
    claves.forEach((clave) => {
      filtros[clave] = porDefecto(clave)
    })
    router.replace({ name: nombreRuta })
  }

  /** Lleva el foco al aviso de éxito para que un lector de pantalla lo anuncie. */
  async function enfocarExito() {
    await nextTick()
    mensajeExitoRef.value?.focus()
  }

  async function anunciarExito(texto) {
    mensajeExito.value = texto
    await cargarListado()
    await enfocarExito()
  }

  watch(
    [() => route.query.search, () => route.query.page, ...claves.map((c) => () => route.query[c])],
    cargarListado,
    { immediate: true },
  )

  /*
   * Aviso que llega desde otra vista (`?notice=deactivated`). Se consume y se
   * retira de la URL para que no reaparezca al recargar o al volver atrás.
   */
  watch(
    () => route.query.notice,
    async (notice) => {
      if (notice !== 'deactivated') return
      mensajeExito.value = avisos.deactivated ?? ''
      const query = { ...route.query }
      delete query.notice
      await router.replace({ name: nombreRuta, query })
      await enfocarExito()
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    // Invalida cualquier respuesta en vuelo y corta el rebote pendiente.
    solicitudActual += 1
    cancelarBusquedaPendiente()
  })

  return {
    estadoVista,
    items,
    paginacion,
    busqueda,
    filtros,
    hayFiltros,
    mensajeError,
    mensajeExito,
    mensajeExitoRef,
    cargarListado,
    cambiarBusqueda,
    cambiarFiltro,
    cambiarPagina,
    limpiarFiltros,
    anunciarExito,
  }
}
