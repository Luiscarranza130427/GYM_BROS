<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import IconoSvg from '@/components/base/IconoSvg.vue'
import PageHeader from '@/components/base/PageHeader.vue'
import EmpresaForm from '@/modules/empresas/components/EmpresaForm.vue'
import { actualizarEmpresa, obtenerEmpresa } from '@/services/empresas.service'

const route = useRoute()
const router = useRouter()
const estado = ref('loading')
const empresa = ref(null)
const enviando = ref(false)
const erroresServidor = ref({})
const mensajeError = ref('')
let solicitudActual = 0

async function cargar() {
  const idSolicitud = ++solicitudActual
  estado.value = 'loading'
  empresa.value = null
  erroresServidor.value = {}
  mensajeError.value = ''

  try {
    const respuesta = await obtenerEmpresa(route.params.id)
    if (idSolicitud !== solicitudActual) return
    empresa.value = respuesta
    estado.value = 'success'
  } catch (error) {
    if (idSolicitud !== solicitudActual) return
    mensajeError.value = error?.message || 'No pudimos cargar la empresa.'
    estado.value = error?.status === 404 ? 'not-found' : 'error'
  }
}

async function guardar(datos) {
  if (enviando.value) return
  enviando.value = true
  erroresServidor.value = {}
  mensajeError.value = ''

  try {
    const actualizada = await actualizarEmpresa(route.params.id, datos)
    await router.push({
      name: 'empresa-detalle',
      params: { id: actualizada.id },
      query: { notice: 'updated' },
    })
  } catch (error) {
    if (error?.status === 422) {
      erroresServidor.value = error.errors ?? {}
      if (!Object.keys(erroresServidor.value).length) {
        mensajeError.value = error?.message || 'Revisa los datos introducidos.'
      }
    } else if (error?.status === 404) {
      empresa.value = null
      mensajeError.value = error?.message || 'La empresa solicitada no existe.'
      estado.value = 'not-found'
    } else mensajeError.value = error?.message || 'No pudimos actualizar la empresa.'
  } finally {
    enviando.value = false
  }
}

watch(() => route.params.id, cargar, { immediate: true })
onBeforeUnmount(() => {
  solicitudActual += 1
})
</script>

<template>
  <section class="empresa-editor">
    <PageHeader
      titulo="Editar empresa"
      :descripcion="
        empresa
          ? `Actualiza la información de ${empresa.nombre}.`
          : 'Actualiza la información de la empresa.'
      "
      seccion="Empresas"
      :ruta-seccion="{ name: 'empresas-listado' }"
      etiqueta="Gestión empresarial"
      :migas="[empresa?.nombre ?? 'Empresa', 'Editar']"
    />

    <p v-if="mensajeError && estado === 'success'" class="alert alert-danger" role="alert">
      {{ mensajeError }}
    </p>

    <section v-if="estado === 'loading'" class="empresa-editor__estado gb-tarjeta" aria-busy="true">
      <span class="spinner-border" aria-hidden="true"></span>
      <p>Cargando información de la empresa…</p>
    </section>

    <EmpresaForm
      v-else-if="estado === 'success' && empresa"
      modo="edit"
      :valores-iniciales="empresa"
      :enviando="enviando"
      :errores-servidor="erroresServidor"
      @submit="guardar"
      @cancel="router.push({ name: 'empresas-listado' })"
    />

    <section
      v-else
      class="empresa-editor__estado gb-tarjeta"
      :role="estado === 'error' ? 'alert' : 'status'"
    >
      <IconoSvg nombre="building-x" />
      <h2>
        {{ estado === 'not-found' ? 'Empresa no encontrada' : 'No pudimos cargar la empresa' }}
      </h2>
      <p>{{ mensajeError }}</p>
      <div>
        <button v-if="estado === 'error'" type="button" class="btn btn-primary" @click="cargar">
          Reintentar
        </button>
        <RouterLink class="btn btn-ghost" :to="{ name: 'empresas-listado' }"
          >Volver a empresas</RouterLink
        >
      </div>
    </section>
  </section>
</template>

<style scoped>
.empresa-editor {
  display: grid;
  gap: var(--gb-dashboard-gap);
  width: min(100%, 86rem);
  margin: 0 auto;
}

.empresa-editor .alert {
  margin: 0;
}

.empresa-editor__estado {
  display: grid;
  place-items: center;
  min-height: 28rem;
  padding: 2rem;
  border-radius: var(--gb-radius-xl);
  text-align: center;
}

.empresa-editor__estado > i {
  color: var(--gb-text-soft);
  font-size: 2rem;
}

.empresa-editor__estado h2,
.empresa-editor__estado p {
  margin: 0;
}

.empresa-editor__estado h2 {
  margin-top: 1rem;
  font-size: var(--gb-tipo-lg);
  text-transform: uppercase;
}

.empresa-editor__estado p {
  margin-top: 0.5rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-sm);
}

.empresa-editor__estado div {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.empresa-editor__estado .btn {
  text-decoration: none;
}
</style>
