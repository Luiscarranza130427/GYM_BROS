<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import IconoSvg from '@/components/base/IconoSvg.vue'
import PageHeader from '@/components/base/PageHeader.vue'
import UsuarioHistory from '@/modules/usuarios/components/UsuarioHistory.vue'
import UsuarioProfileSummary from '@/modules/usuarios/components/UsuarioProfileSummary.vue'
import {
  desactivarUsuario,
  obtenerHistorialUsuario,
  obtenerUsuario,
} from '@/services/usuarios.service'

const route = useRoute()
const router = useRouter()
const estado = ref('loading')
const usuario = ref(null)
const historial = ref([])
const historialCargando = ref(false)
const historialError = ref('')
const mensajeError = ref('')
const mensajeExito = ref('')
const dialogoAbierto = ref(false)
const desactivando = ref(false)
let solicitudActual = 0
let solicitudHistorial = 0

async function cargarHistorial() {
  const idSolicitud = ++solicitudHistorial
  historialCargando.value = true
  historialError.value = ''
  try {
    const respuesta = await obtenerHistorialUsuario(route.params.id)
    if (idSolicitud !== solicitudHistorial) return
    historial.value = respuesta
  } catch (error) {
    if (idSolicitud !== solicitudHistorial) return
    historial.value = []
    historialError.value = error?.message || 'No pudimos cargar el historial.'
  } finally {
    if (idSolicitud === solicitudHistorial) historialCargando.value = false
  }
}

async function cargar() {
  const idSolicitud = ++solicitudActual
  estado.value = 'loading'
  usuario.value = null
  historial.value = []
  historialError.value = ''
  dialogoAbierto.value = false
  mensajeError.value = ''
  try {
    const respuesta = await obtenerUsuario(route.params.id)
    if (idSolicitud !== solicitudActual) return
    usuario.value = respuesta
    estado.value = 'success'
    cargarHistorial()
  } catch (error) {
    if (idSolicitud !== solicitudActual) return
    mensajeError.value = error?.message || 'No pudimos cargar el usuario.'
    estado.value = error?.status === 404 ? 'not-found' : 'error'
  }
}

async function confirmarDesactivacion() {
  if (!usuario.value || desactivando.value) return
  desactivando.value = true
  try {
    await desactivarUsuario(usuario.value.id)
    dialogoAbierto.value = false
    await router.push({ name: 'usuarios-listado', query: { notice: 'deactivated' } })
  } catch (error) {
    dialogoAbierto.value = false
    mensajeError.value = error?.message || 'No pudimos desactivar el usuario.'
  } finally {
    desactivando.value = false
  }
}

watch(
  () => route.params.id,
  () => {
    mensajeExito.value = ''
    const notice = route.query.notice
    if (notice === 'created') mensajeExito.value = 'Usuario creado correctamente.'
    if (notice === 'updated') mensajeExito.value = 'Usuario actualizado correctamente.'
    if (notice === 'created' || notice === 'updated') {
      router.replace({ name: 'usuario-detalle', params: { id: route.params.id } })
    }
    cargar()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  solicitudActual += 1
  solicitudHistorial += 1
})
</script>

<template>
  <section class="usuario-detalle">
    <PageHeader
      :titulo="usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Perfil de usuario'"
      descripcion="Consulta su información, membresía y trazabilidad administrativa."
      seccion="Usuarios"
      :ruta-seccion="{ name: 'usuarios-listado' }"
      etiqueta="Gestión de usuarios"
      :migas="[usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Usuario']"
    >
      <template v-if="estado === 'success' && usuario" #acciones>
        <RouterLink
          class="btn btn-ghost usuario-detalle__accion"
          :to="{ name: 'usuario-editar', params: { id: usuario.id } }"
          ><IconoSvg nombre="pencil" />Editar</RouterLink
        >
        <button
          v-if="usuario.estado === 'active'"
          type="button"
          class="btn btn-outline-danger usuario-detalle__accion"
          @click="dialogoAbierto = true"
        >
          <IconoSvg nombre="slash-circle" />Desactivar
        </button>
      </template>
    </PageHeader>

    <p v-if="mensajeExito" class="usuario-detalle__exito" role="status">
      <IconoSvg nombre="check-circle-fill" />{{ mensajeExito }}
    </p>
    <p v-if="mensajeError && estado === 'success'" class="alert alert-danger" role="alert">
      {{ mensajeError }}
    </p>

    <section
      v-if="estado === 'loading'"
      class="usuario-detalle__estado gb-tarjeta"
      aria-busy="true"
    >
      <span class="spinner-border" aria-hidden="true"></span>
      <p>Cargando perfil del usuario…</p>
    </section>

    <template v-else-if="estado === 'success' && usuario">
      <UsuarioProfileSummary :usuario="usuario" />
      <UsuarioHistory
        :items="historial"
        :loading="historialCargando"
        :error="historialError"
        @retry="cargarHistorial"
      />
    </template>

    <section
      v-else
      class="usuario-detalle__estado gb-tarjeta"
      :role="estado === 'error' ? 'alert' : 'status'"
    >
      <IconoSvg nombre="person-x" />
      <h2>
        {{ estado === 'not-found' ? 'Usuario no encontrado' : 'No pudimos cargar el usuario' }}
      </h2>
      <p>{{ mensajeError }}</p>
      <div>
        <button v-if="estado === 'error'" type="button" class="btn btn-primary" @click="cargar">
          Reintentar</button
        ><RouterLink class="btn btn-ghost" :to="{ name: 'usuarios-listado' }"
          >Volver a usuarios</RouterLink
        >
      </div>
    </section>

    <ConfirmDialog
      :abierto="dialogoAbierto"
      titulo="¿Desactivar usuario?"
      :descripcion="`${usuario?.nombre ?? 'El usuario'} ${usuario?.apellido ?? ''} dejará de tener acceso a Gym Bros.`"
      :confirmando="desactivando"
      etiqueta-confirmar="Desactivar usuario"
      etiqueta-confirmando="Desactivando…"
      @cancelar="dialogoAbierto = false"
      @confirmar="confirmarDesactivacion"
    />
  </section>
</template>

<style scoped>
.usuario-detalle {
  display: grid;
  gap: var(--gb-dashboard-gap);
  width: min(100%, 86rem);
  margin: 0 auto;
  padding-bottom: var(--gb-margen);
}
.usuario-detalle__accion {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding-inline: 1rem;
  font-family: var(--gb-fuente-titulo);
  font-size: var(--gb-tipo-xs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-decoration: none;
  text-transform: uppercase;
}
.usuario-detalle__exito {
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
.usuario-detalle__estado {
  display: grid;
  place-items: center;
  min-height: 28rem;
  padding: 2rem;
  border-radius: var(--gb-radius-xl);
  text-align: center;
}
.usuario-detalle__estado > i {
  color: var(--gb-text-soft);
  font-size: 2rem;
}
.usuario-detalle__estado h2,
.usuario-detalle__estado p {
  margin: 0;
}
.usuario-detalle__estado h2 {
  margin-top: 1rem;
  font-size: var(--gb-tipo-lg);
  text-transform: uppercase;
}
.usuario-detalle__estado p {
  margin-top: 0.5rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-sm);
}
.usuario-detalle__estado div {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
}
.usuario-detalle__estado .btn {
  text-decoration: none;
}
</style>
