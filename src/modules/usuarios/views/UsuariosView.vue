<script setup>
import { CheckCircle2, CloudOff, RotateCw, UserPlus, Users } from 'lucide-vue-next'
import { ref } from 'vue'

import ConfirmDialog from '@/shared/components/ConfirmDialog.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useListadoFiltrable } from '@/shared/composables/useListadoFiltrable'
import UsuarioFilters from '@/modules/usuarios/components/UsuarioFilters.vue'
import UsuarioTable from '@/modules/usuarios/components/UsuarioTable.vue'
import { desactivarUsuario, obtenerUsuarios } from '@/modules/usuarios/services/usuarios.service'

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
    status: { permitidos: ['all', 'active', 'inactive'] },
    subscription: { permitidos: ['all', 'active', 'expiring', 'expired', 'none'] },
  },
  mapearParametros: ({ status, subscription }) => ({
    estado: status,
    suscripcion: subscription,
  }),
  mensajeDeError: 'No pudimos cargar los usuarios.',
  avisos: {
    created: 'Usuario creado correctamente.',
    updated: 'Usuario actualizado correctamente.',
    deactivated: 'Usuario desactivado correctamente.',
  },
})

const usuarioSeleccionado = ref(null)
const desactivando = ref(false)

async function confirmarDesactivacion() {
  if (!usuarioSeleccionado.value || desactivando.value) return
  desactivando.value = true

  try {
    const { id, nombre, apellido } = usuarioSeleccionado.value
    await desactivarUsuario(id)
    usuarioSeleccionado.value = null
    await anunciarExito(`El usuario ${nombre} ${apellido ?? ''}`.trim() + ' fue desactivado.')
  } catch (error) {
    mensajeError.value = error?.message || 'No pudimos desactivar al usuario.'
    usuarioSeleccionado.value = null
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
      descripcion="Administra los usuarios asociados a tu empresa."
      seccion="Usuarios"
      :ruta-seccion="{ name: 'usuarios-listado' }"
      etiqueta="Gestión de usuarios"
    >
      <template #acciones>
        <RouterLink class="btn btn-primary usuarios__nuevo" :to="{ name: 'usuario-nuevo' }">
          <UserPlus :size="16" aria-hidden="true" />
          Nuevo usuario
        </RouterLink>
      </template>
    </PageHeader>

    <p
      v-if="mensajeExito"
      ref="mensajeExitoRef"
      class="usuarios__exito"
      role="status"
      tabindex="-1"
    >
      <CheckCircle2 :size="18" aria-hidden="true" />
      {{ mensajeExito }}
    </p>

    <UsuarioFilters
      :busqueda="busqueda"
      :estado="filtros.status"
      :suscripcion="filtros.subscription"
      :cargando="estadoVista === 'loading'"
      @update:busqueda="cambiarBusqueda"
      @update:estado="cambiarFiltro('status', $event)"
      @update:suscripcion="cambiarFiltro('subscription', $event)"
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
      <CloudOff :size="48" aria-hidden="true" />
      <h2>No pudimos cargar los usuarios</h2>
      <p>{{ mensajeError }}</p>
      <button type="button" class="btn btn-primary" @click="cargarListado">
        <RotateCw :size="16" aria-hidden="true" />
        Reintentar
      </button>
    </section>

    <section v-else class="usuarios__estado gb-tarjeta" role="status">
      <Users :size="48" aria-hidden="true" />
      <h2>{{ hayFiltros ? 'No encontramos usuarios' : 'Aún no hay usuarios registrados' }}</h2>
      <p v-if="hayFiltros">No hay coincidencias con los filtros seleccionados.</p>
      <p v-else>Registra el primer usuario de Gym Bros.</p>
      <button v-if="hayFiltros" type="button" class="btn btn-ghost" @click="limpiarFiltros">
        Limpiar filtros
      </button>
      <RouterLink v-else class="btn btn-primary" :to="{ name: 'usuario-nuevo' }">
        <UserPlus :size="16" aria-hidden="true" />
        Nuevo usuario
      </RouterLink>
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
  background-color: rgba(var(--gb-green-rgb), 0.08);
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

.usuarios__estado > :deep(svg) {
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
