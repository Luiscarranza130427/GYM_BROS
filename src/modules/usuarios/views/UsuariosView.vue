<script setup>
import { ref } from 'vue'

import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import IconoSvg from '@/components/base/IconoSvg.vue'
import PageHeader from '@/components/base/PageHeader.vue'
import { useListadoFiltrable } from '@/composables/useListadoFiltrable'
import UsuarioFilters from '@/modules/usuarios/components/UsuarioFilters.vue'
import UsuarioTable from '@/modules/usuarios/components/UsuarioTable.vue'
import {
  desactivarUsuario,
  obtenerOpcionesEmpresas,
  obtenerUsuarios,
} from '@/services/usuarios.service'

const {
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
} = useListadoFiltrable({
  nombreRuta: 'usuarios-listado',
  cargar: obtenerUsuarios,
  filtros: {
    // La empresa no es una lista cerrada: su valor es un id, así que no lleva
    // `permitidos`. El resto sí, para que un valor inventado en la URL no
    // llegue al servicio.
    company: {},
    status: { permitidos: ['all', 'active', 'inactive'] },
    subscription: { permitidos: ['all', 'active', 'expiring', 'expired', 'none'] },
    role: { permitidos: ['all', 'admin', 'manager', 'trainer', 'member'] },
  },
  mapearParametros: ({ company, status, subscription, role }) => ({
    empresaId: company,
    estado: status,
    suscripcion: subscription,
    rol: role,
  }),
  mensajeDeError: 'No pudimos cargar los usuarios.',
  avisos: { deactivated: 'Usuario desactivado correctamente.' },
})

// Opciones del desplegable de empresas. Es dato auxiliar del filtro, no del
// listado: si falla, la vista sigue siendo utilizable sin ese filtro.
const empresas = ref([])

async function cargarEmpresas() {
  try {
    empresas.value = (await obtenerOpcionesEmpresas()).filter((item) => item.estado !== 'inactive')
  } catch {
    empresas.value = []
  }
}

cargarEmpresas()

// La desactivación se queda en la vista: su texto y su confirmación son propios
// del recurso, no algo que el composable pueda generalizar sin quedarse soso.
const usuarioSeleccionado = ref(null)
const desactivando = ref(false)

async function confirmarDesactivacion() {
  if (!usuarioSeleccionado.value || desactivando.value) return
  desactivando.value = true

  try {
    const { id, nombre, apellido } = usuarioSeleccionado.value
    await desactivarUsuario(id)
    usuarioSeleccionado.value = null
    await anunciarExito(`${nombre} ${apellido} fue desactivado correctamente.`)
  } catch (error) {
    usuarioSeleccionado.value = null
    mensajeError.value = error?.message || 'No pudimos desactivar el usuario.'
    estadoVista.value = 'error'
  } finally {
    desactivando.value = false
  }
}
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
          ><IconoSvg nombre="person-plus" />Nuevo usuario</RouterLink
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
      <IconoSvg nombre="check-circle-fill" />{{ mensajeExito }}
    </p>

    <UsuarioFilters
      :busqueda="busqueda"
      :empresa="filtros.company"
      :estado="filtros.status"
      :suscripcion="filtros.subscription"
      :rol="filtros.role"
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
      @cambiar-pagina="cambiarPagina"
      @desactivar="usuarioSeleccionado = $event"
    />

    <section v-else-if="estadoVista === 'error'" class="usuarios__estado gb-tarjeta" role="alert">
      <IconoSvg nombre="cloud-slash" />
      <h2>No pudimos cargar los usuarios</h2>
      <p>{{ mensajeError }}</p>
      <button type="button" class="btn btn-primary" @click="cargarListado">
        <IconoSvg nombre="arrow-clockwise" />Reintentar
      </button>
    </section>

    <section v-else class="usuarios__estado gb-tarjeta" role="status">
      <IconoSvg nombre="people" />
      <h2>{{ hayFiltros ? 'No encontramos usuarios' : 'Aún no hay usuarios registrados' }}</h2>
      <p v-if="hayFiltros">No hay coincidencias con los filtros seleccionados.</p>
      <p v-else>Registra el primer usuario de Gym Bros.</p>
      <button v-if="hayFiltros" type="button" class="btn btn-ghost" @click="limpiarFiltros">
        Limpiar filtros</button
      ><RouterLink v-else class="btn btn-primary" :to="{ name: 'usuario-nuevo' }"
        ><IconoSvg nombre="person-plus" />Nuevo usuario</RouterLink
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
