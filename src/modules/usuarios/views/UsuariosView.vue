<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import PageHeader from '@/components/base/PageHeader.vue'
import UsuarioFilters from '@/modules/usuarios/components/UsuarioFilters.vue'
import UsuarioTable from '@/modules/usuarios/components/UsuarioTable.vue'
import {
  desactivarUsuario,
  obtenerOpcionesEmpresas,
  obtenerUsuarios,
} from '@/services/usuarios.service'

const route = useRoute()
const router = useRouter()
const ESTADOS = ['all', 'active', 'inactive']
const SUSCRIPCIONES = ['all', 'active', 'expiring', 'expired', 'none']
const ROLES = ['all', 'admin', 'manager', 'trainer', 'member']
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
const empresas = ref([])
const paginacion = ref({ ...PAGINACION_VACIA })
const busqueda = ref(String(route.query.search ?? ''))
const empresa = ref(valorValido(route.query.company, [], 'all'))
const estado = ref(valorValido(route.query.status, ESTADOS))
const suscripcion = ref(valorValido(route.query.subscription, SUSCRIPCIONES))
const rol = ref(valorValido(route.query.role, ROLES))
const mensajeError = ref('')
const mensajeExito = ref('')
const mensajeExitoRef = useTemplateRef('mensajeExitoRef')
const usuarioSeleccionado = ref(null)
const desactivando = ref(false)
let temporizadorBusqueda = null
let solicitudActual = 0

const hayFiltros = computed(
  () =>
    Boolean(busqueda.value.trim()) ||
    empresa.value !== 'all' ||
    estado.value !== 'all' ||
    suscripcion.value !== 'all' ||
    rol.value !== 'all',
)

function valorValido(valor, permitidos, porDefecto = 'all') {
  const texto = String(valor ?? porDefecto)
  return !permitidos.length || permitidos.includes(texto) ? texto : porDefecto
}

function paginaValida(valor) {
  const numero = Number.parseInt(valor, 10)
  return Number.isFinite(numero) && numero > 0 ? numero : 1
}

function construirQuery(cambios = {}) {
  const filtros = {
    search: busqueda.value,
    company: empresa.value,
    status: estado.value,
    subscription: suscripcion.value,
    role: rol.value,
    page: 1,
    ...cambios,
  }
  const query = {}
  const termino = String(filtros.search).trim()
  if (termino) query.search = termino
  if (filtros.company !== 'all') query.company = String(filtros.company)
  if (filtros.status !== 'all') query.status = filtros.status
  if (filtros.subscription !== 'all') query.subscription = filtros.subscription
  if (filtros.role !== 'all') query.role = filtros.role
  if (Number(filtros.page) > 1) query.page = String(filtros.page)
  return query
}

async function actualizarQuery(cambios = {}) {
  const query = construirQuery({
    search: route.query.search ?? busqueda.value,
    company: valorValido(route.query.company, [], 'all'),
    status: valorValido(route.query.status, ESTADOS),
    subscription: valorValido(route.query.subscription, SUSCRIPCIONES),
    role: valorValido(route.query.role, ROLES),
    page: paginaValida(route.query.page),
    ...cambios,
  })
  if (JSON.stringify(query) === JSON.stringify(route.query)) return
  await router.replace({ name: 'usuarios-listado', query })
}

async function cargarUsuarios() {
  const idSolicitud = ++solicitudActual
  estadoVista.value = 'loading'
  mensajeError.value = ''
  busqueda.value = String(route.query.search ?? '')
  empresa.value = valorValido(route.query.company, [], 'all')
  estado.value = valorValido(route.query.status, ESTADOS)
  suscripcion.value = valorValido(route.query.subscription, SUSCRIPCIONES)
  rol.value = valorValido(route.query.role, ROLES)

  try {
    const respuesta = await obtenerUsuarios({
      busqueda: busqueda.value.trim(),
      empresaId: empresa.value === 'all' ? '' : empresa.value,
      estado: estado.value === 'all' ? '' : estado.value,
      suscripcion: suscripcion.value === 'all' ? '' : suscripcion.value,
      rol: rol.value === 'all' ? '' : rol.value,
      pagina: paginaValida(route.query.page),
      porPagina: PAGINACION_VACIA.porPagina,
    })
    if (idSolicitud !== solicitudActual) return
    items.value = respuesta.items
    paginacion.value = respuesta.paginacion
    estadoVista.value = 'success'
    if (respuesta.paginacion.pagina !== paginaValida(route.query.page)) {
      await actualizarQuery({ page: respuesta.paginacion.pagina })
    }
  } catch (error) {
    if (idSolicitud !== solicitudActual) return
    items.value = []
    paginacion.value = { ...PAGINACION_VACIA }
    mensajeError.value = error?.message || 'No pudimos cargar los usuarios.'
    estadoVista.value = 'error'
  }
}

async function cargarEmpresas() {
  try {
    empresas.value = (await obtenerOpcionesEmpresas()).filter((item) => item.estado !== 'inactive')
  } catch {
    empresas.value = []
  }
}

function cambiarBusqueda(valor) {
  busqueda.value = valor
  window.clearTimeout(temporizadorBusqueda)
  temporizadorBusqueda = window.setTimeout(() => actualizarQuery({ search: valor, page: 1 }), 350)
}

function cambiarFiltro(campo, valor) {
  if (campo === 'company') empresa.value = valor
  if (campo === 'status') estado.value = valor
  if (campo === 'subscription') suscripcion.value = valor
  if (campo === 'role') rol.value = valor
  actualizarQuery({ [campo]: valor, page: 1 })
}

function limpiarFiltros() {
  window.clearTimeout(temporizadorBusqueda)
  busqueda.value = ''
  empresa.value = 'all'
  estado.value = 'all'
  suscripcion.value = 'all'
  rol.value = 'all'
  router.replace({ name: 'usuarios-listado' })
}

async function enfocarExito() {
  await nextTick()
  mensajeExitoRef.value?.focus()
}

async function confirmarDesactivacion() {
  if (!usuarioSeleccionado.value || desactivando.value) return
  desactivando.value = true
  try {
    const nombre = `${usuarioSeleccionado.value.nombre} ${usuarioSeleccionado.value.apellido}`
    await desactivarUsuario(usuarioSeleccionado.value.id)
    usuarioSeleccionado.value = null
    mensajeExito.value = `${nombre} fue desactivado correctamente.`
    await cargarUsuarios()
    await enfocarExito()
  } catch (error) {
    usuarioSeleccionado.value = null
    mensajeError.value = error?.message || 'No pudimos desactivar el usuario.'
    estadoVista.value = 'error'
  } finally {
    desactivando.value = false
  }
}

watch(
  [
    () => route.query.search,
    () => route.query.company,
    () => route.query.status,
    () => route.query.subscription,
    () => route.query.role,
    () => route.query.page,
  ],
  cargarUsuarios,
  { immediate: true },
)

watch(
  () => route.query.notice,
  async (notice) => {
    if (notice !== 'deactivated') return
    mensajeExito.value = 'Usuario desactivado correctamente.'
    const query = { ...route.query }
    delete query.notice
    await router.replace({ name: 'usuarios-listado', query })
    await enfocarExito()
  },
  { immediate: true },
)

cargarEmpresas()

onBeforeUnmount(() => {
  solicitudActual += 1
  window.clearTimeout(temporizadorBusqueda)
})
</script>

<template>
  <section class="usuarios">
    <PageHeader
      titulo="Usuarios"
      descripcion="Administra los usuarios registrados en las empresas."
      seccion="Usuarios"
      :ruta-seccion="{ name: 'usuarios-listado' }"
      etiqueta="Gestión de usuarios"
    >
      <template #acciones>
        <RouterLink class="btn btn-primary usuarios__nuevo" :to="{ name: 'usuario-nuevo' }"
          ><i class="bi bi-person-plus" aria-hidden="true"></i>Nuevo usuario</RouterLink
        >
      </template>
    </PageHeader>

    <p
      v-if="mensajeExito"
      ref="mensajeExitoRef"
      class="usuarios__exito"
      role="status"
      tabindex="-1"
    >
      <i class="bi bi-check-circle-fill" aria-hidden="true"></i>{{ mensajeExito }}
    </p>

    <UsuarioFilters
      :busqueda="busqueda"
      :empresa="empresa"
      :estado="estado"
      :suscripcion="suscripcion"
      :rol="rol"
      :empresas="empresas"
      :cargando="estadoVista === 'loading'"
      @update:busqueda="cambiarBusqueda"
      @update:empresa="cambiarFiltro('company', $event)"
      @update:estado="cambiarFiltro('status', $event)"
      @update:suscripcion="cambiarFiltro('subscription', $event)"
      @update:rol="cambiarFiltro('role', $event)"
      @limpiar="limpiarFiltros"
    />

    <UsuarioTable
      v-if="
        estadoVista === 'idle' ||
        estadoVista === 'loading' ||
        (estadoVista === 'success' && items.length)
      "
      :items="items"
      :paginacion="paginacion"
      :cargando="estadoVista !== 'success'"
      @cambiar-pagina="actualizarQuery({ page: $event })"
      @desactivar="usuarioSeleccionado = $event"
    />

    <section v-else-if="estadoVista === 'error'" class="usuarios__estado gb-tarjeta" role="alert">
      <i class="bi bi-cloud-slash" aria-hidden="true"></i>
      <h2>No pudimos cargar los usuarios</h2>
      <p>{{ mensajeError }}</p>
      <button type="button" class="btn btn-primary" @click="cargarUsuarios">
        <i class="bi bi-arrow-clockwise" aria-hidden="true"></i>Reintentar
      </button>
    </section>

    <section v-else class="usuarios__estado gb-tarjeta" role="status">
      <i class="bi bi-people" aria-hidden="true"></i>
      <h2>{{ hayFiltros ? 'No encontramos usuarios' : 'Aún no hay usuarios registrados' }}</h2>
      <p v-if="hayFiltros">No hay coincidencias con los filtros seleccionados.</p>
      <p v-else>Registra el primer usuario de Gym Bros.</p>
      <button v-if="hayFiltros" type="button" class="btn btn-ghost" @click="limpiarFiltros">
        Limpiar filtros</button
      ><RouterLink v-else class="btn btn-primary" :to="{ name: 'usuario-nuevo' }"
        ><i class="bi bi-person-plus" aria-hidden="true"></i>Nuevo usuario</RouterLink
      >
    </section>

    <ConfirmDialog
      :abierto="Boolean(usuarioSeleccionado)"
      titulo="¿Desactivar usuario?"
      :descripcion="`${usuarioSeleccionado?.nombre ?? 'El usuario'} ${usuarioSeleccionado?.apellido ?? ''} dejará de tener acceso a Gym Bros.`"
      :confirmando="desactivando"
      etiqueta-confirmar="Desactivar usuario"
      etiqueta-confirmando="Desactivando…"
      @cancelar="usuarioSeleccionado = null"
      @confirmar="confirmarDesactivacion"
    />
  </section>
</template>

<style scoped>
.usuarios {
  display: grid;
  gap: var(--gb-dashboard-gap);
  width: 100%;
  max-width: 100rem;
  margin: 0 auto;
  padding-bottom: var(--gb-margen);
}
.usuarios__nuevo,
.usuarios__estado .btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding-inline: 1.25rem;
  text-decoration: none;
}
.usuarios__exito {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin: 0;
  padding: 0.75rem 1rem;
  background: rgba(var(--gb-green-rgb), 0.08);
  border: 1px solid rgba(var(--gb-green-rgb), 0.28);
  border-radius: var(--gb-radius-lg);
  color: var(--gb-green);
  font-size: var(--gb-tipo-sm);
}
.usuarios__estado {
  display: grid;
  place-items: center;
  min-height: 24rem;
  padding: 2rem;
  border-radius: var(--gb-radius-xl);
  text-align: center;
}
.usuarios__estado > i {
  color: var(--gb-text-soft);
  font-size: 2rem;
}
.usuarios__estado h2 {
  margin: 1rem 0 0;
  font-size: var(--gb-tipo-lg);
  text-transform: uppercase;
}
.usuarios__estado p {
  max-width: 30rem;
  margin: 0.5rem 0 1.25rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-sm);
}
</style>
