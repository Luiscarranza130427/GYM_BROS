<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import IconoSvg from '@/components/base/IconoSvg.vue'
import PageHeader from '@/components/base/PageHeader.vue'
import AlimentoForm from '@/modules/alimentacion/components/AlimentoForm.vue'
import { actualizarAlimento, obtenerAlimento } from '@/services/alimentacion.service'

const route = useRoute()
const router = useRouter()
const estado = ref('loading')
const alimento = ref(null)
const enviando = ref(false)
const erroresServidor = ref({})
const mensajeError = ref('')
let solicitudActual = 0

async function cargar() {
  const idSolicitud = ++solicitudActual
  estado.value = 'loading'
  alimento.value = null
  erroresServidor.value = {}
  mensajeError.value = ''

  try {
    const respuesta = await obtenerAlimento(route.params.id)
    if (idSolicitud !== solicitudActual) return
    alimento.value = respuesta
    estado.value = 'success'
  } catch (error) {
    if (idSolicitud !== solicitudActual) return
    mensajeError.value = error?.message || 'No pudimos cargar el alimento.'
    estado.value = error?.status === 404 ? 'not-found' : 'error'
  }
}

async function guardar(datos) {
  if (enviando.value) return
  enviando.value = true
  erroresServidor.value = {}
  mensajeError.value = ''

  try {
    const actualizado = await actualizarAlimento(route.params.id, datos)
    await router.push({
      name: 'alimento-detalle',
      params: { id: actualizado.id },
      query: { notice: 'updated' },
    })
  } catch (error) {
    /*
     * Guardar es una ACCIÓN: si falla, el formulario con lo tecleado sigue en
     * pantalla. Sólo el 404 sustituye el contenido, porque entonces ya no hay
     * nada que editar.
     */
    if (error?.status === 422) {
      erroresServidor.value = error.errors ?? {}
      if (!Object.keys(erroresServidor.value).length) {
        mensajeError.value = error?.message || 'Revisa los datos introducidos.'
      }
    } else if (error?.status === 404) {
      alimento.value = null
      mensajeError.value = error?.message || 'El alimento solicitado no existe.'
      estado.value = 'not-found'
    } else mensajeError.value = error?.message || 'No pudimos actualizar el alimento.'
  } finally {
    enviando.value = false
  }
}

function cancelar() {
  router.push({ name: 'alimentos-listado' }).catch(() => {})
}

watch(() => route.params.id, cargar, { immediate: true })
onBeforeUnmount(() => {
  solicitudActual += 1
})
</script>

<template>
  <section class="alimento-editor">
    <PageHeader
      titulo="Editar alimento"
      :descripcion="
        alimento ? `Actualiza la ficha de ${alimento.nombre}.` : 'Actualiza la ficha del alimento.'
      "
      seccion="Catálogo de alimentos"
      :ruta-seccion="{ name: 'alimentos-listado' }"
      etiqueta="Alimentación"
      :migas="[alimento?.nombre ?? 'Alimento', 'Editar']"
    />

    <p v-if="mensajeError && estado === 'success'" class="alert alert-danger" role="alert">
      {{ mensajeError }}
    </p>

    <section
      v-if="estado === 'loading'"
      class="alimento-editor__estado gb-tarjeta"
      aria-busy="true"
    >
      <span class="spinner-border" aria-hidden="true"></span>
      <p>Cargando información del alimento…</p>
    </section>

    <AlimentoForm
      v-else-if="estado === 'success' && alimento"
      modo="edit"
      :valores-iniciales="alimento"
      :enviando="enviando"
      :errores-servidor="erroresServidor"
      @submit="guardar"
      @cancel="cancelar"
    />

    <section
      v-else
      class="alimento-editor__estado gb-tarjeta"
      :role="estado === 'error' ? 'alert' : 'status'"
    >
      <IconoSvg nombre="x-circle" />
      <h2>
        {{ estado === 'not-found' ? 'Alimento no encontrado' : 'No pudimos cargar el alimento' }}
      </h2>
      <p>{{ mensajeError }}</p>
      <div>
        <button v-if="estado === 'error'" type="button" class="btn btn-primary" @click="cargar">
          Reintentar
        </button>
        <RouterLink class="btn btn-ghost" :to="{ name: 'alimentos-listado' }">
          Volver al catálogo
        </RouterLink>
      </div>
    </section>
  </section>
</template>

<style scoped>
.alimento-editor {
  display: grid;
  gap: var(--gb-dashboard-gap);
  width: min(100%, 86rem);
  margin: 0 auto;
}

.alimento-editor .alert {
  margin: 0;
}

.alimento-editor__estado {
  display: grid;
  place-items: center;
  min-height: 28rem;
  padding: 2rem;
  border-radius: var(--gb-radius-xl);
  text-align: center;
}

.alimento-editor__estado > svg {
  color: var(--gb-text-soft);
  font-size: 2rem;
}

.alimento-editor__estado h2,
.alimento-editor__estado p {
  margin: 0;
}

.alimento-editor__estado h2 {
  margin-top: 1rem;
  font-size: var(--gb-tipo-lg);
  text-transform: uppercase;
}

.alimento-editor__estado p {
  margin-top: 0.5rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-sm);
}

.alimento-editor__estado div {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.alimento-editor__estado .btn {
  text-decoration: none;
}
</style>
