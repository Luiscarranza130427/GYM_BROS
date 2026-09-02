<script setup>
import { Ban, Eye, Pencil } from 'lucide-vue-next'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { CATEGORIAS, EQUIPOS, NIVELES, etiquetaDe } from '@/modules/ejercicios/catalogos'
import EjercicioStatusBadge from '@/modules/ejercicios/components/EjercicioStatusBadge.vue'
import { formatearFecha, formatearNumero } from '@/shared/utils/formato'

const props = defineProps({
  items: { type: Array, required: true },
  paginacion: { type: Object, required: true },
  cargando: { type: Boolean, default: false },
})

defineEmits(['cambiar-pagina', 'desactivar'])

const paginas = computed(() => {
  const total = props.paginacion.ultimaPagina
  const actual = props.paginacion.pagina
  if (total <= 5) return Array.from({ length: total }, (_, indice) => indice + 1)

  let inicio = Math.max(1, actual - 2)
  const fin = Math.min(total, inicio + 4)
  inicio = Math.max(1, fin - 4)
  return Array.from({ length: fin - inicio + 1 }, (_, indice) => inicio + indice)
})

/** `4 × 12`, o sólo las series cuando el ejercicio no cuenta repeticiones. */
function prescripcion({ seriesSugeridas, repeticionesSugeridas }) {
  if (!seriesSugeridas) return '—'
  return repeticionesSugeridas
    ? `${seriesSugeridas} × ${repeticionesSugeridas}`
    : `${seriesSugeridas} ×`
}
</script>

<template>
  <section class="tabla gb-tarjeta" aria-label="Listado de ejercicios" :aria-busy="cargando">
    <div class="tabla__desplazamiento">
      <table>
        <caption class="visually-hidden">
          Ejercicios del catálogo de Gym Bros
        </caption>
        <thead>
          <tr>
            <th scope="col">Ejercicio</th>
            <th scope="col">Nivel</th>
            <th scope="col">Equipo</th>
            <th scope="col">Sugerido</th>
            <th scope="col" class="tabla__numero">Usos</th>
            <th scope="col">Estado</th>
            <th scope="col">Registro</th>
            <th scope="col" class="tabla__acciones-titulo">Acciones</th>
          </tr>
        </thead>
        <tbody v-if="cargando">
          <tr v-for="fila in 6" :key="fila" class="tabla__skeleton" aria-hidden="true">
            <td><span class="skeleton skeleton--ejercicio"></span></td>
            <td><span class="skeleton skeleton--corto"></span></td>
            <td><span class="skeleton skeleton--corto"></span></td>
            <td><span class="skeleton skeleton--corto"></span></td>
            <td><span class="skeleton skeleton--corto"></span></td>
            <td><span class="skeleton skeleton--corto"></span></td>
            <td><span class="skeleton"></span></td>
            <td><span class="skeleton skeleton--acciones"></span></td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-for="ejercicio in items" :key="ejercicio.id">
            <td>
              <RouterLink
                class="tabla__ejercicio"
                :to="{ name: 'ejercicio-detalle', params: { id: ejercicio.id } }"
              >
                <strong>{{ ejercicio.nombre }}</strong>
                <small>{{ etiquetaDe(CATEGORIAS, ejercicio.categoria) }}</small>
              </RouterLink>
            </td>
            <td>
              <span class="tabla__nivel" :class="`tabla__nivel--${ejercicio.nivel}`">
                {{ etiquetaDe(NIVELES, ejercicio.nivel) }}
              </span>
            </td>
            <td>{{ etiquetaDe(EQUIPOS, ejercicio.equipo) }}</td>
            <td class="tabla__tabular">{{ prescripcion(ejercicio) }}</td>
            <td class="tabla__numero tabla__tabular">{{ formatearNumero(ejercicio.usos) }}</td>
            <td><EjercicioStatusBadge :estado="ejercicio.estado" /></td>
            <td class="tabla__fecha">{{ formatearFecha(ejercicio.fechaRegistro) }}</td>
            <td>
              <div class="tabla__acciones">
                <RouterLink
                  class="gb-boton-icono"
                  :to="{ name: 'ejercicio-detalle', params: { id: ejercicio.id } }"
                  :aria-label="`Ver ${ejercicio.nombre}`"
                  title="Ver"
                >
                  <Eye :size="16" aria-hidden="true" />
                </RouterLink>
                <RouterLink
                  class="gb-boton-icono"
                  :to="{ name: 'ejercicio-editar', params: { id: ejercicio.id } }"
                  :aria-label="`Editar ${ejercicio.nombre}`"
                  title="Editar"
                >
                  <Pencil :size="16" aria-hidden="true" />
                </RouterLink>
                <button
                  type="button"
                  class="gb-boton-icono tabla__desactivar"
                  :disabled="ejercicio.estado === 'inactive'"
                  :aria-label="`Desactivar ${ejercicio.nombre}`"
                  :title="ejercicio.estado === 'inactive' ? 'Ejercicio inactivo' : 'Desactivar'"
                  @click="$emit('desactivar', ejercicio)"
                >
                  <Ban :size="16" aria-hidden="true" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer v-if="!cargando && paginacion.total" class="tabla__paginacion">
      <p>
        Mostrando {{ formatearNumero(paginacion.desde) }}–{{ formatearNumero(paginacion.hasta) }} de
        {{ formatearNumero(paginacion.total) }} ejercicios
      </p>
      <nav aria-label="Paginación de ejercicios">
        <button
          type="button"
          class="btn btn-ghost"
          :disabled="paginacion.pagina <= 1"
          @click="$emit('cambiar-pagina', paginacion.pagina - 1)"
        >
          Anterior
        </button>
        <button
          v-for="pagina in paginas"
          :key="pagina"
          type="button"
          class="tabla__pagina"
          :class="{ 'tabla__pagina--activa': pagina === paginacion.pagina }"
          :aria-current="pagina === paginacion.pagina ? 'page' : null"
          :aria-label="`Página ${pagina}`"
          @click="$emit('cambiar-pagina', pagina)"
        >
          {{ pagina }}
        </button>
        <button
          type="button"
          class="btn btn-ghost"
          :disabled="paginacion.pagina >= paginacion.ultimaPagina"
          @click="$emit('cambiar-pagina', paginacion.pagina + 1)"
        >
          Siguiente
        </button>
      </nav>
    </footer>
  </section>
</template>

<style scoped>
.tabla {
  overflow: hidden;
  border-radius: var(--gb-radius-lg);
}

.tabla__desplazamiento {
  max-width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 64rem;
  border-collapse: collapse;
}

th,
td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--gb-border);
  text-align: left;
  vertical-align: middle;
}

th {
  background-color: var(--gb-surface-lowest);
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xxs);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

td {
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-sm);
}

tbody tr {
  background-color: var(--gb-surface);
  transition: background-color 0.18s ease;
}

tbody tr:hover {
  background-color: var(--gb-surface-high-50);
}

tbody tr:last-child td {
  border-bottom: 0;
}

.tabla__ejercicio {
  display: grid;
  min-width: 12rem;
  color: var(--gb-text);
  text-decoration: none;
}

.tabla__ejercicio:hover strong {
  color: var(--gb-red-text);
}

.tabla__ejercicio strong {
  overflow: hidden;
  font-family: var(--gb-fuente-titulo);
  font-size: var(--gb-tipo-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tabla__ejercicio small {
  margin-top: 0.125rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xxs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.tabla__nivel {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background-color: var(--gb-surface-high);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius);
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xxs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.tabla__nivel--principiante {
  color: var(--gb-green);
}

.tabla__nivel--intermedio {
  color: var(--gb-amber);
}

.tabla__nivel--avanzado {
  color: var(--gb-red-text);
}

.tabla__numero {
  text-align: right;
}

.tabla__tabular {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.tabla__fecha {
  white-space: nowrap;
}

.tabla__acciones-titulo {
  text-align: right;
}

.tabla__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
}

.tabla__acciones .gb-boton-icono {
  width: 2.125rem;
  height: 2.125rem;
  color: var(--gb-text-muted);
  text-decoration: none;
}

.tabla__desactivar:not(:disabled):hover {
  color: var(--gb-error);
}

.tabla__desactivar:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.tabla__paginacion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem 1rem;
  background-color: var(--gb-surface-lowest);
  border-top: 1px solid var(--gb-border);
}

.tabla__paginacion p {
  margin: 0;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xs);
}

.tabla__paginacion nav {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.tabla__paginacion .btn {
  min-height: 2.125rem;
  padding: 0.375rem 0.75rem;
  font-size: var(--gb-tipo-xxs);
}

.tabla__pagina {
  display: grid;
  place-items: center;
  width: 2.125rem;
  height: 2.125rem;
  background-color: transparent;
  border: 1px solid transparent;
  border-radius: var(--gb-radius);
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xs);
}

.tabla__pagina:hover {
  background-color: var(--gb-surface-high);
  color: var(--gb-text);
}

.tabla__pagina--activa {
  background-color: var(--gb-red);
  color: var(--gb-on-red);
}

.tabla__skeleton:hover {
  background-color: var(--gb-surface);
}

.skeleton {
  display: block;
  width: 7rem;
  height: 0.75rem;
  background-color: var(--gb-surface-highest);
  border-radius: var(--gb-radius-pill);
  animation: pulso 1.2s ease-in-out infinite alternate;
}

.skeleton--ejercicio {
  width: 11rem;
  height: 2rem;
  border-radius: var(--gb-radius);
}

.skeleton--corto {
  width: 4rem;
}

.skeleton--acciones {
  width: 6rem;
  margin-left: auto;
}

@keyframes pulso {
  to {
    opacity: 0.45;
  }
}

@media (max-width: 90rem) {
  th:nth-child(7),
  td:nth-child(7) {
    display: none;
  }

  table {
    min-width: 54rem;
  }
}

@media (max-width: 58rem) {
  .tabla__paginacion {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
