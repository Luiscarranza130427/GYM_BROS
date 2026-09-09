<script setup>
import { computed } from 'vue'

import EjercicioCard from '@/modules/ejercicios/components/EjercicioCard.vue'
import { formatearNumero } from '@/shared/utils/formato'

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
</script>

<template>
  <section class="catalogo" aria-label="Catálogo de ejercicios" :aria-busy="cargando">
    <h2 class="visually-hidden">Ejercicios disponibles</h2>

    <div v-if="cargando" class="catalogo__grid" aria-hidden="true">
      <article v-for="indice in 8" :key="indice" class="skeleton">
        <span class="skeleton__imagen"></span>
        <span class="skeleton__linea skeleton__linea--corta"></span>
        <span class="skeleton__linea skeleton__linea--titulo"></span>
        <span class="skeleton__linea"></span>
        <span class="skeleton__linea"></span>
      </article>
    </div>

    <div v-else class="catalogo__grid">
      <EjercicioCard
        v-for="ejercicio in items"
        :key="ejercicio.id"
        :ejercicio="ejercicio"
        @desactivar="$emit('desactivar', $event)"
      />
    </div>

    <footer v-if="!cargando && paginacion.total" class="catalogo__paginacion">
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
          class="catalogo__pagina"
          :class="{ 'catalogo__pagina--activa': pagina === paginacion.pagina }"
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
.catalogo {
  display: grid;
  gap: 1.25rem;
}

.catalogo__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.catalogo__paginacion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem 1rem;
  background: var(--gb-surface-lowest);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-lg);
}

.catalogo__paginacion p {
  margin: 0;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xs);
}

.catalogo__paginacion nav {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.catalogo__paginacion .btn {
  min-height: 2.125rem;
  padding: 0.375rem 0.75rem;
  font-size: var(--gb-tipo-xxs);
}

.catalogo__pagina {
  display: grid;
  place-items: center;
  width: 2.125rem;
  height: 2.125rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--gb-radius);
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xs);
}

.catalogo__pagina:hover {
  background: var(--gb-surface-high);
  color: var(--gb-text);
}

.catalogo__pagina--activa {
  background: var(--gb-red);
  color: var(--gb-on-red);
}

.skeleton {
  display: grid;
  gap: 0.75rem;
  padding: 0 1rem 1rem;
  overflow: hidden;
  background: var(--gb-surface);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-xl);
}

.skeleton__imagen,
.skeleton__linea {
  display: block;
  background: var(--gb-surface-highest);
  animation: pulso 1.2s ease-in-out infinite alternate;
}

.skeleton__imagen {
  width: calc(100% + 2rem);
  aspect-ratio: 16 / 10;
  margin-left: -1rem;
}

.skeleton__linea {
  width: 100%;
  height: 0.75rem;
  border-radius: var(--gb-radius-pill);
}

.skeleton__linea--corta {
  width: 35%;
}

.skeleton__linea--titulo {
  width: 68%;
  height: 1rem;
}

@keyframes pulso {
  to {
    opacity: 0.45;
  }
}

@media (max-width: 42rem) {
  .catalogo__paginacion {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 90rem) {
  .catalogo__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 68rem) {
  .catalogo__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 42rem) {
  .catalogo__grid {
    grid-template-columns: 1fr;
  }
}
</style>
