<script setup>
import { CloudOff, List, RotateCw, Utensils } from 'lucide-vue-next'
import { ref } from 'vue'

import PageHeader from '@/shared/components/PageHeader.vue'
import { useListadoFiltrable } from '@/shared/composables/useListadoFiltrable'
import { SITUACIONES_PLAN, valoresDe } from '@/modules/alimentacion/catalogos'
import PlanFilters from '@/modules/alimentacion/components/PlanFilters.vue'
import PlanTable from '@/modules/alimentacion/components/PlanTable.vue'
import {
  obtenerEmpresasConPlanes,
  obtenerPlanes,
} from '@/modules/alimentacion/services/alimentacion.service'

const {
  estadoVista,
  items,
  paginacion,
  busqueda,
  filtros,
  hayFiltros,
  mensajeError,
  cargarListado,
  cambiarBusqueda,
  cambiarFiltro,
  cambiarPagina,
  limpiarFiltros,
} = useListadoFiltrable({
  nombreRuta: 'alimentacion-listado',
  cargar: obtenerPlanes,
  filtros: {
    // Las claves de la query van en INGLÉS como en el resto del panel
    // (`?status=`, `?company=`, `?type=`): son URL que la gente comparte, y una
    // sección que las nombrara de otro modo se leería como de otra aplicación.
    // `status` es lista cerrada: con `permitidos`, un valor inventado en la URL
    // cae al valor por defecto y nunca llega al servicio. `company` no lo
    // es —su valor es un id—, así que va sin `permitidos`.
    status: { permitidos: ['all', ...valoresDe(SITUACIONES_PLAN)] },
    company: {},
  },
  mapearParametros: ({ status, company }) => ({ situacion: status, empresaId: company }),
  porPagina: 10,
  mensajeDeError: 'No pudimos cargar los planes de alimentación.',
})

/*
 * Opciones del desplegable de empresas. Es dato auxiliar del filtro, no del
 * listado: si falla, la vista sigue siendo utilizable y el filtro simplemente
 * no se ofrece (ver `PlanFilters`).
 */
const empresas = ref([])

async function cargarEmpresas() {
  try {
    empresas.value = await obtenerEmpresasConPlanes()
  } catch {
    empresas.value = []
  }
}

cargarEmpresas()
</script>

<template>
  <section class="planes">
    <PageHeader
      titulo="Planes de alimentación"
      descripcion="Consulta el horario de comidas de cada usuario y cómo se ajusta a sus objetivos."
      seccion="Alimentación"
      :ruta-seccion="{ name: 'alimentacion-listado' }"
      etiqueta="Nutrición y planes"
    >
      <template #acciones>
        <RouterLink class="btn btn-ghost planes__catalogo" :to="{ name: 'alimentos-listado' }">
          <List :size="16" aria-hidden="true" />
          Catálogo de alimentos
        </RouterLink>
      </template>
    </PageHeader>

    <PlanFilters
      :busqueda="busqueda"
      :situacion="filtros.status"
      :empresa="filtros.company"
      :empresas="empresas"
      :cargando="estadoVista === 'loading'"
      @update:busqueda="cambiarBusqueda"
      @update:situacion="cambiarFiltro('status', $event)"
      @update:empresa="cambiarFiltro('company', $event)"
      @limpiar="limpiarFiltros"
    />

    <PlanTable
      v-if="
        estadoVista === 'idle' ||
        estadoVista === 'loading' ||
        (estadoVista === 'success' && items.length)
      "
      :items="items"
      :paginacion="paginacion"
      :cargando="estadoVista === 'idle' || estadoVista === 'loading'"
      @cambiar-pagina="cambiarPagina"
    />

    <section v-else-if="estadoVista === 'error'" class="planes__estado gb-tarjeta" role="alert">
      <CloudOff :size="48" aria-hidden="true" />
      <h2>No pudimos cargar los planes</h2>
      <p>{{ mensajeError }}</p>
      <button type="button" class="btn btn-primary" @click="cargarListado">
        <RotateCw :size="16" aria-hidden="true" />
        Reintentar
      </button>
    </section>

    <section v-else class="planes__estado gb-tarjeta" role="status">
      <Utensils :size="48" aria-hidden="true" />
      <h2>
        {{ hayFiltros ? 'No encontramos planes' : 'Aún no hay planes de alimentación' }}
      </h2>
      <p v-if="hayFiltros">Prueba con otra búsqueda o limpia los filtros seleccionados.</p>
      <p v-else>
        Los planes se crean desde la ficha del usuario al que pertenecen. Aquí aparecerán en cuanto
        exista el primero.
      </p>
      <button v-if="hayFiltros" type="button" class="btn btn-ghost" @click="limpiarFiltros">
        Limpiar filtros
      </button>
    </section>
  </section>
</template>

<style scoped>
.planes {
  display: grid;
  gap: var(--gb-dashboard-gap);
  width: 100%;
  max-width: 100rem;
  margin: 0 auto;
  padding-bottom: var(--gb-margen);
}

.planes__catalogo,
.planes__estado .btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding-inline: 1.25rem;
  text-decoration: none;
}

.planes__estado {
  display: grid;
  place-items: center;
  min-height: 24rem;
  padding: 2rem;
  border-radius: var(--gb-radius-xl);
  text-align: center;
}

.planes__estado > :deep(svg) {
  color: var(--gb-text-soft);
  font-size: 2rem;
}

.planes__estado h2 {
  margin: 1rem 0 0;
  font-size: var(--gb-tipo-lg);
  text-transform: uppercase;
}

.planes__estado p {
  max-width: 32rem;
  margin: 0.5rem 0 1.25rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-sm);
}
</style>
