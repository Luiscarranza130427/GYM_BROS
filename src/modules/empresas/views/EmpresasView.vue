<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import PageHeader from '@/components/base/PageHeader.vue'
import EmpresaFilters from '@/modules/empresas/components/EmpresaFilters.vue'
import EmpresaTable from '@/modules/empresas/components/EmpresaTable.vue'
import { desactivarEmpresa, obtenerEmpresas } from '@/services/empresas.service'

const route = useRoute()
const router = useRouter()
const ESTADOS_VALIDOS = ['all', 'active', 'inactive']
const PAGINACION_VACIA = {
  pagina: 1,
  ultimaPagina: 1,
  porPagina: 8,
  total: 0,
  desde: 0,
  hasta: 0,
}

const estadoVista = ref('idle')
const items = ref([])
const paginacion = ref({ ...PAGINACION_VACIA })
const busquedaInput = ref(String(route.query.search ?? ''))
const estadoFiltro = ref(validarEstado(route.query.status))
const mensajeError = ref('')
const mensajeExito = ref('')
const mensajeExitoRef = useTemplateRef('mensajeExitoRef')
const empresaSeleccionada = ref(null)
const desactivando = ref(false)
let temporizadorBusqueda = null
let solicitudActual = 0

const hayFiltros = computed(
  () => Boolean(busquedaInput.value.trim()) || estadoFiltro.value !== 'all',
)

function validarEstado(valor) {
  return ESTADOS_VALIDOS.includes(valor) ? valor : 'all'
}

function validarPagina(valor) {
  const pagina = Number.parseInt(valor, 10)
  return Number.isFinite(pagina) && pagina > 0 ? pagina : 1
}

/**
 * Cancela el rebote de la búsqueda y deja constancia de que ya no hay ninguno
 * pendiente. `clearTimeout` por sí solo no borra la variable, y el resto de la
 * vista se apoya en que `temporizadorBusqueda === null` signifique "el usuario
 * no está escribiendo ahora mismo".
 */
function cancelarBusquedaPendiente() {
  window.clearTimeout(temporizadorBusqueda)
  temporizadorBusqueda = null
}

function construirQuery({
  search = busquedaInput.value,
  status = estadoFiltro.value,
  page = 1,
} = {}) {
  const query = {}
  const termino = String(search).trim()
  if (termino) query.search = termino
  if (status !== 'all') query.status = status
  if (page > 1) query.page = String(page)
  return query
}

async function actualizarQuery(cambios) {
  const actual = {
    search: String(route.query.search ?? ''),
    status: validarEstado(route.query.status),
    page: validarPagina(route.query.page),
    ...cambios,
  }
  const query = construirQuery(actual)
  if (JSON.stringify(query) === JSON.stringify(route.query)) return
  await router.replace({ name: 'empresas-listado', query })
}

async function cargarEmpresas() {
  const idSolicitud = ++solicitudActual
  estadoVista.value = 'loading'
  mensajeError.value = ''
  // El input sólo se resincroniza desde la URL cuando el usuario NO está
  // escribiendo. Si hay un rebote pendiente, esta carga la provocó otra cosa
  // (el filtro de estado, el botón atrás) y copiar aquí el `search` viejo de la
  // URL borraría de la caja lo que se está tecleando.
  if (temporizadorBusqueda === null) {
    busquedaInput.value = String(route.query.search ?? '')
  }
  estadoFiltro.value = validarEstado(route.query.status)

  try {
    const respuesta = await obtenerEmpresas({
      busqueda: busquedaInput.value.trim(),
      estado: estadoFiltro.value === 'all' ? '' : estadoFiltro.value,
      pagina: validarPagina(route.query.page),
      porPagina: PAGINACION_VACIA.porPagina,
    })
    if (idSolicitud !== solicitudActual) return
    items.value = respuesta.items
    paginacion.value = respuesta.paginacion
    estadoVista.value = 'success'

    if (respuesta.paginacion.pagina !== validarPagina(route.query.page)) {
      await actualizarQuery({ page: respuesta.paginacion.pagina })
    }
  } catch (error) {
    if (idSolicitud !== solicitudActual) return
    items.value = []
    paginacion.value = { ...PAGINACION_VACIA }
    mensajeError.value = error?.message || 'No pudimos cargar las empresas.'
    estadoVista.value = 'error'
  }
}

function cambiarBusqueda(valor) {
  busquedaInput.value = valor
  cancelarBusquedaPendiente()
  temporizadorBusqueda = window.setTimeout(() => {
    temporizadorBusqueda = null
    actualizarQuery({ search: valor, page: 1 })
  }, 350)
}

function cambiarEstado(valor) {
  estadoFiltro.value = valor

  // Se navega ya, así que el rebote pendiente sobra: si se dejara vivo, dispararía
  // una segunda navegación 350 ms después. Y se arrastra lo tecleado hasta ahora
  // (`busquedaInput.value`, no el `search` de la URL, que va por detrás) para que
  // el cambio de estado no descarte la búsqueda a medio escribir.
  cancelarBusquedaPendiente()
  actualizarQuery({ status: valor, search: busquedaInput.value, page: 1 })
}

function limpiarFiltros() {
  cancelarBusquedaPendiente()
  busquedaInput.value = ''
  estadoFiltro.value = 'all'
  router.replace({ name: 'empresas-listado' })
}

function solicitarDesactivacion(empresa) {
  empresaSeleccionada.value = empresa
}

async function enfocarMensajeExito() {
  await nextTick()
  mensajeExitoRef.value?.focus()
}

async function confirmarDesactivacion() {
  if (!empresaSeleccionada.value || desactivando.value) return
  desactivando.value = true

  try {
    await desactivarEmpresa(empresaSeleccionada.value.id)
    mensajeExito.value = `La empresa ${empresaSeleccionada.value.nombre} fue desactivada correctamente.`
    empresaSeleccionada.value = null
    await cargarEmpresas()
    await enfocarMensajeExito()
  } catch (error) {
    mensajeError.value = error?.message || 'No pudimos desactivar la empresa.'
    empresaSeleccionada.value = null
    estadoVista.value = 'error'
  } finally {
    desactivando.value = false
  }
}

watch(
  [() => route.query.search, () => route.query.status, () => route.query.page],
  cargarEmpresas,
  { immediate: true },
)

watch(
  () => route.query.notice,
  async (notice) => {
    if (notice !== 'deactivated') return
    mensajeExito.value = 'Empresa desactivada correctamente.'
    const query = { ...route.query }
    delete query.notice
    await router.replace({ name: 'empresas-listado', query })
    await enfocarMensajeExito()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  solicitudActual += 1
  cancelarBusquedaPendiente()
})
</script>

<template>
  <section class="empresas">
    <PageHeader
      titulo="Empresas"
      descripcion="Administra las empresas registradas y su acceso a Gym Bros."
      seccion="Empresas"
      :ruta-seccion="{ name: 'empresas-listado' }"
      etiqueta="Gestión empresarial"
    >
      <template #acciones>
        <RouterLink class="btn btn-primary empresas__nueva" :to="{ name: 'empresa-nueva' }">
          <i class="bi bi-plus-lg" aria-hidden="true"></i>
          Nueva empresa
        </RouterLink>
      </template>
    </PageHeader>

    <p
      v-if="mensajeExito"
      ref="mensajeExitoRef"
      class="empresas__exito"
      role="status"
      tabindex="-1"
    >
      <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
      {{ mensajeExito }}
    </p>

    <EmpresaFilters
      :busqueda="busquedaInput"
      :estado="estadoFiltro"
      :cargando="estadoVista === 'loading'"
      @update:busqueda="cambiarBusqueda"
      @update:estado="cambiarEstado"
    />

    <EmpresaTable
      v-if="
        estadoVista === 'idle' ||
        estadoVista === 'loading' ||
        (estadoVista === 'success' && items.length)
      "
      :items="items"
      :paginacion="paginacion"
      :cargando="estadoVista === 'idle' || estadoVista === 'loading'"
      @cambiar-pagina="actualizarQuery({ page: $event })"
      @desactivar="solicitarDesactivacion"
    />

    <section v-else-if="estadoVista === 'error'" class="empresas__estado gb-tarjeta" role="alert">
      <i class="bi bi-cloud-slash" aria-hidden="true"></i>
      <h2>No pudimos cargar las empresas</h2>
      <p>{{ mensajeError }}</p>
      <button type="button" class="btn btn-primary" @click="cargarEmpresas">
        <i class="bi bi-arrow-clockwise" aria-hidden="true"></i>
        Reintentar
      </button>
    </section>

    <section v-else class="empresas__estado gb-tarjeta" role="status">
      <i class="bi bi-buildings" aria-hidden="true"></i>
      <h2>{{ hayFiltros ? 'No encontramos resultados' : 'Aún no hay empresas registradas' }}</h2>
      <p v-if="hayFiltros">Prueba con otra búsqueda o limpia los filtros seleccionados.</p>
      <p v-else>Registra tu primera empresa para comenzar.</p>
      <button v-if="hayFiltros" type="button" class="btn btn-ghost" @click="limpiarFiltros">
        Limpiar filtros
      </button>
      <RouterLink v-else class="btn btn-primary" :to="{ name: 'empresa-nueva' }">
        <i class="bi bi-plus-lg" aria-hidden="true"></i>
        Nueva empresa
      </RouterLink>
    </section>

    <ConfirmDialog
      :abierto="Boolean(empresaSeleccionada)"
      titulo="¿Desactivar empresa?"
      :descripcion="`Esta acción suspenderá el acceso de ${empresaSeleccionada?.nombre ?? 'la empresa'} al sistema.`"
      :confirmando="desactivando"
      etiqueta-confirmar="Desactivar empresa"
      etiqueta-confirmando="Desactivando…"
      @cancelar="empresaSeleccionada = null"
      @confirmar="confirmarDesactivacion"
    />
  </section>
</template>

<style scoped>
.empresas {
  display: grid;
  gap: var(--gb-dashboard-gap);
  width: 100%;
  max-width: 100rem;
  margin: 0 auto;
  padding-bottom: var(--gb-margen);
}

.empresas__nueva {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding-inline: 1.25rem;
  text-decoration: none;
}

.empresas__exito {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin: 0;
  padding: 0.75rem 1rem;
  background-color: rgba(var(--gb-green-rgb), 0.08);
  border: 1px solid rgba(var(--gb-green-rgb), 0.28);
  border-radius: var(--gb-radius-lg);
  color: var(--gb-green);
  font-size: var(--gb-tipo-sm);
}

.empresas__estado {
  display: grid;
  place-items: center;
  min-height: 24rem;
  padding: 2rem;
  border-radius: var(--gb-radius-xl);
  text-align: center;
}

.empresas__estado > i {
  color: var(--gb-text-soft);
  font-size: 2rem;
}

.empresas__estado h2 {
  margin: 1rem 0 0;
  font-size: var(--gb-tipo-lg);
  text-transform: uppercase;
}

.empresas__estado p {
  max-width: 30rem;
  margin: 0.5rem 0 1.25rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-sm);
}

.empresas__estado .btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding-inline: 1.25rem;
  text-decoration: none;
}
</style>
