<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import PageHeader from '@/shared/components/PageHeader.vue'
import EjercicioForm from '@/modules/ejercicios/components/EjercicioForm.vue'
import { crearEjercicio } from '@/modules/ejercicios/services/ejercicios.service'

const router = useRouter()
const enviando = ref(false)
const erroresServidor = ref({})
const mensajeError = ref('')

async function guardar(datos) {
  if (enviando.value) return
  enviando.value = true
  erroresServidor.value = {}
  mensajeError.value = ''

  try {
    const ejercicio = await crearEjercicio(datos)
    await router.push({
      name: 'ejercicio-detalle',
      params: { id: ejercicio.id },
      query: { notice: 'created' },
    })
  } catch (error) {
    if (error?.status === 422) {
      erroresServidor.value = error.errors ?? {}
      if (!Object.keys(erroresServidor.value).length) {
        mensajeError.value = error?.message || 'Revisa los datos introducidos.'
      }
    } else mensajeError.value = error?.message || 'No pudimos crear el ejercicio.'
  } finally {
    enviando.value = false
  }
}

function cancelar() {
  router.push({ name: 'ejercicios-listado' }).catch(() => {})
}
</script>

<template>
  <section class="ejercicio-editor">
    <PageHeader
      titulo="Nuevo ejercicio"
      descripcion="Añade un ejercicio al catálogo disponible para las rutinas."
      seccion="Ejercicios"
      :ruta-seccion="{ name: 'ejercicios-listado' }"
      etiqueta="Catálogo de entrenamiento"
      :migas="['Nuevo ejercicio']"
    />
    <p v-if="mensajeError" class="alert alert-danger" role="alert">{{ mensajeError }}</p>
    <EjercicioForm
      :enviando="enviando"
      :errores-servidor="erroresServidor"
      @submit="guardar"
      @cancel="cancelar"
    />
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
</style>
