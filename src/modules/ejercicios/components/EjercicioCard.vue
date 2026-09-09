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
      <span class="tarjeta__badges">
        <span v-if="ejercicio.tipo" class="tarjeta__tipo">{{ etiqueta(ejercicio.tipo) }}</span>
        <EjercicioStatusBadge class="tarjeta__estado" :estado="ejercicio.estado" />
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
          :aria-label="`Ver ${ejercicio.nombre}`"
          :to="{ name: 'ejercicio-detalle', params: { id: ejercicio.id } }"
        >
          <Eye :size="16" aria-hidden="true" />
          <span class="tarjeta__tooltip" aria-hidden="true">Ver detalles</span>
        </RouterLink>
        <RouterLink
          class="tarjeta__accion"
          :aria-label="`Editar ${ejercicio.nombre}`"
          :to="{ name: 'ejercicio-editar', params: { id: ejercicio.id } }"
        >
          <Pencil :size="16" aria-hidden="true" />
          <span class="tarjeta__tooltip" aria-hidden="true">Editar</span>
        </RouterLink>
        <a
          v-if="ejercicio.enlaceVideo"
          class="tarjeta__accion"
          :href="ejercicio.enlaceVideo"
          :aria-label="`Ver video de ${ejercicio.nombre} (abre otra pestaña)`"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink :size="16" aria-hidden="true" />
          <span class="tarjeta__tooltip" aria-hidden="true">Ver video</span>
        </a>
        <button
          type="button"
          class="tarjeta__accion tarjeta__accion--peligro"
          :disabled="ejercicio.estado === 'inactive'"
          :aria-label="
            ejercicio.estado === 'inactive'
              ? `${ejercicio.nombre} inactivo`
              : `Desactivar ${ejercicio.nombre}`
          "
          @click="$emit('desactivar', ejercicio)"
        >
          <Ban :size="16" aria-hidden="true" />
          <span class="tarjeta__tooltip" aria-hidden="true">
            {{ ejercicio.estado === 'inactive' ? 'Inactivo' : 'Desactivar' }}
          </span>
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
  position: absolute;
  inset: 0.5rem 0.5rem auto;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  pointer-events: none;
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
  height: 18%;
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
  padding: 0.2rem 0.45rem;
  background: var(--gb-overlay-strong);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-pill);
  color: var(--gb-text);
  font-size: var(--gb-tipo-xxs);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.tarjeta__estado {
  margin-left: auto;
  padding: 0.2rem 0.45rem;
  background: var(--gb-overlay-strong);
  border-radius: var(--gb-radius-pill);
}

.tarjeta__contenido {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
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
  overflow-wrap: anywhere;
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
  gap: 0.5rem;
  flex-wrap: wrap;
  padding-top: 0.75rem;
  border-top: 1px solid var(--gb-border);
}

.tarjeta__accion {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2.5rem;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  background: var(--gb-surface-lowest);
  border: 1px solid var(--gb-border);
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

.tarjeta__accion:focus-visible {
  outline: 2px solid var(--gb-focus);
  outline-offset: 2px;
}

.tarjeta__tooltip {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 0;
  z-index: 2;
  width: max-content;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-md);
  background: var(--gb-surface-lowest);
  color: var(--gb-text);
  visibility: hidden;
  pointer-events: none;
}

.tarjeta__accion:hover .tarjeta__tooltip,
.tarjeta__accion:focus-visible .tarjeta__tooltip {
  visibility: visible;
}

.tarjeta__accion--peligro .tarjeta__tooltip {
  right: 0;
  left: auto;
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
