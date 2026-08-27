<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import IconoSvg from '@/components/base/IconoSvg.vue'
import PageHeader from '@/components/base/PageHeader.vue'
import EjercicioForm from '@/modules/ejercicios/components/EjercicioForm.vue'
import { actualizarEjercicio, obtenerEjercicio } from '@/services/ejercicios.service'

const route = useRoute()
const router = useRouter()
const estado = ref('loading')
const ejercicio = ref(null)
const enviando = ref(false)
const erroresServidor = ref({})
const mensajeError = ref('')
let solicitudActual = 0

async function cargar() {
  const idSolicitud = ++solicitudActual
  estado.value = 'loading'
  ejercicio.value = null
  erroresServidor.value = {}
  mensajeError.value = ''

  try {
    const respuesta = await obtenerEjercicio(route.params.id)
    if (idSolicitud !== solicitudActual) return
    ejercicio.value = respuesta
    estado.value = 'success'
  } catch (error) {
    if (idSolicitud !== solicitudActual) return
    mensajeError.value = error?.message || 'No pudimos cargar el ejercicio.'
    estado.value = error?.status === 404 ? 'not-found' : 'error'
  }
}

async function guardar(datos) {
  if (enviando.value) return
  enviando.value = true
  erroresServidor.value = {}
  mensajeError.value = ''

  try {
    const actualizado = await actualizarEjercicio(route.params.id, datos)
    await router.push({
      name: 'ejercicio-detalle',
      params: { id: actualizado.id },
      query: { notice: 'updated' },
    })
  } catch (error) {
    if (error?.status === 422) {
      erroresServidor.value = error.errors ?? {}
      if (!Object.keys(erroresServidor.value).length) {
        mensajeError.value = error?.message || 'Revisa los datos introducidos.'
      }
    } else if (error?.status === 404) {
      ejercicio.value = null
      mensajeError.value = error?.message || 'El ejercicio solicitado no existe.'
      estado.value = 'not-found'
    } else mensajeError.value = error?.message || 'No pudimos actualizar el ejercicio.'
  } finally {
    enviando.value = false
  }
}

function cancelar() {
  router.push({ name: 'ejercicios-listado' }).catch(() => {})
}

watch(() => route.params.id, cargar, { immediate: true })
onBeforeUnmount(() => {
  solicitudActual += 1
})
</script>

<template>
  <section class="ejercicio-editor">
    <PageHeader
      titulo="Editar ejercicio"
      :descripcion="
        ejercicio
          ? `Actualiza la ficha de ${ejercicio.nombre}.`
          : 'Actualiza la ficha del ejercicio.'
      "
      seccion="Ejercicios"
      :ruta-seccion="{ name: 'ejercicios-listado' }"
      etiqueta="Catálogo de entrenamiento"
      :migas="[ejercicio?.nombre ?? 'Ejercicio', 'Editar']"
    />

    <p v-if="mensajeError && estado === 'success'" class="alert alert-danger" role="alert">
      {{ mensajeError }}
    </p>

    <section
      v-if="estado === 'loading'"
      class="ejercicio-editor__estado gb-tarjeta"
      aria-busy="true"
    >
      <span class="spinner-border" aria-hidden="true"></span>
      <p>Cargando información del ejercicio…</p>
    </section>

    <EjercicioForm
      v-else-if="estado === 'success' && ejercicio"
      modo="edit"
      :valores-iniciales="ejercicio"
      :enviando="enviando"
      :errores-servidor="erroresServidor"
      @submit="guardar"
      @cancel="cancelar"
    />

    <section
      v-else
      class="ejercicio-editor__estado gb-tarjeta"
      :role="estado === 'error' ? 'alert' : 'status'"
    >
      <IconoSvg nombre="x-circle" />
      <h2>
        {{ estado === 'not-found' ? 'Ejercicio no encontrado' : 'No pudimos cargar el ejercicio' }}
      </h2>
      <p>{{ mensajeError }}</p>
      <div>
        <button v-if="estado === 'error'" type="button" class="btn btn-primary" @click="cargar">
          Reintentar
        </button>
        <RouterLink class="btn btn-ghost" :to="{ name: 'ejercicios-listado' }">
          Volver a ejercicios
        </RouterLink>
      </div>
    </section>
  </section>
</template>

<style scoped>
.ejercicio-editor {
  display: grid;
  gap: var(--gb-dashboard-gap);
  width: min(100%, 86rem);
  margin: 0 auto;
}

.ejercicio-editor .alert {
  margin: 0;
}

.ejercicio-editor__estado {
  display: grid;
  place-items: center;
  min-height: 28rem;
  padding: 2rem;
  border-radius: var(--gb-radius-xl);
  text-align: center;
}

.ejercicio-editor__estado > svg {
  color: var(--gb-text-soft);
  font-size: 2rem;
}

.ejercicio-editor__estado h2,
.ejercicio-editor__estado p {
  margin: 0;
}

.ejercicio-editor__estado h2 {
  margin-top: 1rem;
  font-size: var(--gb-tipo-lg);
  text-transform: uppercase;
}

.ejercicio-editor__estado p {
  margin-top: 0.5rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-sm);
}

.ejercicio-editor__estado div {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.ejercicio-editor__estado .btn {
  text-decoration: none;
}
</style>
