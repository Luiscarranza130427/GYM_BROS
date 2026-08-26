<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import DashboardBanner from '@/modules/dashboard/components/DashboardBanner.vue'
import DashboardSkeleton from '@/modules/dashboard/components/DashboardSkeleton.vue'
import MetricCard from '@/modules/dashboard/components/MetricCard.vue'
import PopularExercises from '@/modules/dashboard/components/PopularExercises.vue'
import ProgressChart from '@/modules/dashboard/components/ProgressChart.vue'
import RecentActivity from '@/modules/dashboard/components/RecentActivity.vue'
import { obtenerDashboard } from '@/services/dashboard.service'
import { formatearTiempoRelativo } from '@/utils/formato'

const estado = ref('idle')
const datos = ref(null)
const mensajeError = ref('')
const ahora = ref(new Date())
const actualizadoEn = ref(null)
let solicitudActual = 0
let reloj = null

const etiquetaActualizacion = computed(() =>
  actualizadoEn.value ? formatearTiempoRelativo(actualizadoEn.value, ahora.value) : '',
)

async function cargarDashboard() {
  const idSolicitud = ++solicitudActual
  estado.value = 'loading'
  mensajeError.value = ''
  actualizadoEn.value = null

  try {
    const respuesta = await obtenerDashboard()
    if (idSolicitud !== solicitudActual) return

    datos.value = respuesta
    actualizadoEn.value = new Date()
    estado.value = 'success'
  } catch (error) {
    if (idSolicitud !== solicitudActual) return

    mensajeError.value =
      error?.message || 'No pudimos cargar la información del dashboard. Inténtalo de nuevo.'
    estado.value = 'error'
  }
}

onMounted(() => {
  cargarDashboard()
  reloj = window.setInterval(() => {
    ahora.value = new Date()
  }, 60_000)
})
onBeforeUnmount(() => {
  solicitudActual += 1
  window.clearInterval(reloj)
})
</script>

<template>
  <section class="dashboard" aria-labelledby="titulo-dashboard">
    <header class="dashboard__contexto">
      <div>
        <p><span aria-hidden="true"></span> Centro de mando</p>
        <h1 id="titulo-dashboard">Resumen general</h1>
        <span>Supervisa la operación de Gym Bros desde un único lugar.</span>
      </div>
      <p v-if="estado === 'success'" class="dashboard__actualizacion">
        <i class="bi bi-clock-history" aria-hidden="true"></i>
        Última actualización: {{ etiquetaActualizacion.toLowerCase() }}
      </p>
    </header>

    <DashboardSkeleton v-if="estado === 'idle' || estado === 'loading'" />

    <section
      v-else-if="estado === 'error'"
      class="dashboard__error gb-tarjeta"
      role="alert"
      aria-live="assertive"
    >
      <span class="dashboard__error-icono" aria-hidden="true">
        <i class="bi bi-exclamation-triangle"></i>
      </span>
      <h2>No pudimos cargar el dashboard</h2>
      <p>{{ mensajeError }}</p>
      <button type="button" class="btn btn-primary" @click="cargarDashboard">
        <i class="bi bi-arrow-clockwise" aria-hidden="true"></i>
        Reintentar
      </button>
    </section>

    <template v-else-if="estado === 'success' && datos">
      <DashboardBanner :banner="datos.banner" />

      <section class="dashboard__indicadores" aria-labelledby="titulo-indicadores">
        <header class="dashboard__seccion-cabecera">
          <div>
            <h2 id="titulo-indicadores">Indicadores principales</h2>
            <p>Estado consolidado de la plataforma.</p>
          </div>
          <span>Periodo actual</span>
        </header>

        <div v-if="datos.metricas.length" class="dashboard__metricas">
          <MetricCard v-for="metrica in datos.metricas" :key="metrica.id" :metrica="metrica" />
        </div>
        <p v-else class="dashboard__sin-indicadores gb-tarjeta" role="status">
          Aún no hay indicadores disponibles.
        </p>
      </section>

      <div class="dashboard__analitica">
        <ProgressChart :progreso="datos.progreso" />
        <PopularExercises :ejercicios="datos.ejerciciosPopulares" />
      </div>

      <RecentActivity :actividades="datos.actividadReciente" :ahora="ahora" />
    </template>
  </section>
</template>

<style scoped>
.dashboard {
  display: grid;
  gap: var(--gb-dashboard-gap);
  width: 100%;
  max-width: 100rem;
  margin: 0 auto;
  padding-bottom: var(--gb-margen);
}

.dashboard__contexto {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
}

.dashboard__contexto p,
.dashboard__contexto h1,
.dashboard__contexto span {
  margin: 0;
}

.dashboard__contexto > div > p {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--gb-red-text);
  font-size: var(--gb-tipo-xxs);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.dashboard__contexto > div > p span {
  width: 0.5rem;
  height: 0.5rem;
  background-color: var(--gb-green);
  border-radius: var(--gb-radius-pill);
}

.dashboard__contexto h1 {
  margin-top: 0.25rem;
  font-size: var(--gb-tipo-xl);
  font-weight: 900;
  line-height: 1.1;
  text-transform: uppercase;
}

.dashboard__contexto > div > span,
.dashboard__actualizacion {
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-sm);
}

.dashboard__contexto > div > span {
  display: block;
  margin-top: 0.375rem;
}

.dashboard__actualizacion {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.dashboard__actualizacion i {
  color: var(--gb-text-soft);
}

.dashboard__indicadores {
  display: grid;
  gap: 0.875rem;
}

.dashboard__seccion-cabecera {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.dashboard__seccion-cabecera h2,
.dashboard__seccion-cabecera p {
  margin: 0;
}

.dashboard__seccion-cabecera h2 {
  font-size: var(--gb-tipo-md);
  font-weight: 800;
  text-transform: uppercase;
}

.dashboard__seccion-cabecera p,
.dashboard__seccion-cabecera > span {
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xs);
}

.dashboard__seccion-cabecera p {
  margin-top: 0.25rem;
}

.dashboard__metricas {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--gb-gutter);
}

.dashboard__sin-indicadores {
  margin: 0;
  padding: 1.5rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-sm);
  text-align: center;
}

.dashboard__analitica {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(18rem, 1fr);
  gap: var(--gb-gutter);
  align-items: stretch;
}

.dashboard__error {
  display: grid;
  place-items: center;
  min-height: 28rem;
  padding: 3rem;
  border-radius: var(--gb-radius-xl);
  text-align: center;
}

.dashboard__error-icono {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  background-color: rgba(var(--gb-red-rgb), 0.12);
  border: 1px solid rgba(var(--gb-red-rgb), 0.5);
  border-radius: var(--gb-radius-lg);
  color: var(--gb-error);
  font-size: 1.25rem;
}

.dashboard__error h2 {
  margin: 1rem 0 0;
  font-size: var(--gb-tipo-lg);
  text-transform: uppercase;
}

.dashboard__error p {
  max-width: 32rem;
  margin: 0.5rem 0 1.25rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-base);
}

.dashboard__error .btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding-inline: 1.25rem;
}

@media (max-width: 78rem) {
  .dashboard__metricas {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard__analitica {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 52rem) {
  .dashboard__contexto {
    align-items: flex-start;
  }

  .dashboard__actualizacion {
    display: none;
  }
}

@media (max-width: 44rem) {
  .dashboard__metricas {
    grid-template-columns: 1fr;
  }

  .dashboard__seccion-cabecera > span {
    display: none;
  }
}
</style>
