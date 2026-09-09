<script setup>
import { Ban, Dumbbell, ExternalLink, Eye, Pencil } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import EjercicioStatusBadge from '@/modules/ejercicios/components/EjercicioStatusBadge.vue'

const props = defineProps({
  ejercicio: { type: Object, required: true },
})

defineEmits(['desactivar'])

const imagenFallida = ref(false)

watch(
  () => props.ejercicio.imagenUrl,
  () => {
    imagenFallida.value = false
  },
)

function etiqueta(valor) {
  if (!valor) return 'Sin especificar'
  return String(valor)
    .replaceAll('_', ' ')
    .replace(/^./, (letra) => letra.toUpperCase())
}
</script>

<template>
  <article class="tarjeta">
    <header class="tarjeta__badges">
      <span v-if="ejercicio.tipo" class="tarjeta__tipo">{{ etiqueta(ejercicio.tipo) }}</span>
      <span v-else class="tarjeta__tipo tarjeta__tipo--vacio">Tipo sin especificar</span>
      <EjercicioStatusBadge :estado="ejercicio.estado" />
    </header>

    <RouterLink
      class="tarjeta__media"
      :to="{ name: 'ejercicio-detalle', params: { id: ejercicio.id } }"
      :aria-label="`Ver detalles de ${ejercicio.nombre}`"
    >
      <img
        v-if="ejercicio.imagenUrl && !imagenFallida"
        :src="ejercicio.imagenUrl"
        :alt="ejercicio.nombre"
        loading="lazy"
        decoding="async"
        @error="imagenFallida = true"
      />
      <span v-else class="tarjeta__sin-imagen">
        <Dumbbell :size="42" aria-hidden="true" />
        <span>Imagen no disponible</span>
      </span>
    </RouterLink>

    <div class="tarjeta__contenido">
      <div class="tarjeta__encabezado">
        <div>
          <p class="tarjeta__nivel">{{ etiqueta(ejercicio.nivel) }}</p>
          <h3>
            <RouterLink :to="{ name: 'ejercicio-detalle', params: { id: ejercicio.id } }">
              {{ ejercicio.nombre }}
            </RouterLink>
          </h3>
        </div>
      </div>

      <p class="tarjeta__descripcion">
        {{ ejercicio.descripcion || 'Sin descripción disponible.' }}
      </p>

      <div class="tarjeta__equipo">
        <Dumbbell :size="16" aria-hidden="true" />
        <span>{{ ejercicio.equipamiento || 'Sin equipamiento especificado' }}</span>
      </div>

      <footer class="tarjeta__acciones">
        <RouterLink
          class="tarjeta__accion"
          :to="{ name: 'ejercicio-detalle', params: { id: ejercicio.id } }"
        >
          <Eye :size="16" aria-hidden="true" />
          Ver
        </RouterLink>
        <RouterLink
          class="tarjeta__accion"
          :to="{ name: 'ejercicio-editar', params: { id: ejercicio.id } }"
        >
          <Pencil :size="16" aria-hidden="true" />
          Editar
        </RouterLink>
        <a
          v-if="ejercicio.enlaceVideo"
          class="tarjeta__accion"
          :href="ejercicio.enlaceVideo"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink :size="16" aria-hidden="true" />
          Video
        </a>
        <button
          type="button"
          class="tarjeta__accion tarjeta__accion--peligro"
          :disabled="ejercicio.estado === 'inactive'"
          @click="$emit('desactivar', ejercicio)"
        >
          <Ban :size="16" aria-hidden="true" />
          {{ ejercicio.estado === 'inactive' ? 'Inactivo' : 'Desactivar' }}
        </button>
      </footer>
    </div>
  </article>
</template>

<style scoped>
.tarjeta {
  min-width: 0;
  overflow: hidden;
  background: var(--gb-surface);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-xl);
  box-shadow: var(--gb-relieve);
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;
}

.tarjeta:hover {
  border-color: rgba(var(--gb-red-rgb), 0.48);
  transform: translateY(-3px);
}

.tarjeta__badges {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 2.75rem;
  padding: 0.55rem 0.75rem;
  background: var(--gb-surface-lowest);
  border-bottom: 1px solid var(--gb-border);
}

.tarjeta__media {
  position: relative;
  display: block;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--gb-surface-lowest);
  color: inherit;
}

.tarjeta__media::after {
  position: absolute;
  inset: auto 0 0;
  height: 42%;
  background: linear-gradient(transparent, var(--gb-overlay-strong));
  content: '';
  pointer-events: none;
}

.tarjeta__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.tarjeta:hover .tarjeta__media img {
  transform: scale(1.035);
}

.tarjeta__sin-imagen {
  display: grid;
  place-content: center;
  justify-items: center;
  width: 100%;
  height: 100%;
  gap: 0.625rem;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xs);
}

.tarjeta__tipo {
  padding: 0.3rem 0.625rem;
  background: var(--gb-surface-high);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-pill);
  color: var(--gb-text);
  font-size: var(--gb-tipo-xxs);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.tarjeta__tipo--vacio {
  color: var(--gb-text-muted);
}

.tarjeta__contenido {
  display: grid;
  gap: 0.875rem;
  padding: 1rem;
}

.tarjeta__nivel {
  margin: 0 0 0.25rem;
  color: var(--gb-red-text);
  font-size: var(--gb-tipo-xxs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.tarjeta h3 {
  margin: 0;
  font-family: var(--gb-fuente-titulo);
  font-size: var(--gb-tipo-md);
  line-height: 1.25;
  text-transform: uppercase;
}

.tarjeta h3 a {
  color: var(--gb-text);
  text-decoration: none;
}

.tarjeta h3 a:hover {
  color: var(--gb-red-text);
}

.tarjeta__descripcion {
  display: -webkit-box;
  min-height: 2.6em;
  margin: 0;
  overflow: hidden;
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-sm);
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.tarjeta__equipo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  padding: 0.625rem 0.75rem;
  background: var(--gb-surface-lowest);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-lg);
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xs);
}

.tarjeta__equipo span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tarjeta__acciones {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--gb-border);
}

.tarjeta__accion {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 2.25rem;
  padding: 0.4rem 0.55rem;
  background: transparent;
  border: 0;
  border-radius: var(--gb-radius-md);
  color: var(--gb-text-muted);
  font-family: inherit;
  font-size: var(--gb-tipo-xxs);
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.tarjeta__accion:hover {
  background: var(--gb-surface-high);
  color: var(--gb-text);
}

.tarjeta__accion--peligro {
  margin-left: auto;
}

.tarjeta__accion--peligro:not(:disabled):hover {
  color: var(--gb-error);
}

.tarjeta__accion:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@media (prefers-reduced-motion: reduce) {
  .tarjeta,
  .tarjeta__media img {
    transition: none;
  }
}
</style>
