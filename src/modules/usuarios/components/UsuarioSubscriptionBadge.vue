<script setup>
import { computed } from 'vue'

import IconoSvg from '@/components/base/IconoSvg.vue'

const props = defineProps({
  estado: { type: String, default: 'none' },
})

const presentacion = computed(
  () =>
    ({
      active: { etiqueta: 'Activa', icono: 'bi-check-circle-fill' },
      expiring: { etiqueta: 'Por vencer', icono: 'bi-exclamation-triangle-fill' },
      expired: { etiqueta: 'Vencida', icono: 'bi-x-circle-fill' },
      none: { etiqueta: 'Sin suscripción', icono: 'bi-dash-circle' },
    })[props.estado] ?? { etiqueta: 'Sin suscripción', icono: 'bi-dash-circle' },
)
</script>

<template>
  <span class="suscripcion" :class="`suscripcion--${estado}`">
    <IconoSvg :nombre="presentacion.icono" />
    {{ presentacion.etiqueta }}
  </span>
</template>

<style scoped>
.suscripcion {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius);
  font-size: var(--gb-tipo-xxs);
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.suscripcion--active {
  background-color: rgba(var(--gb-green-rgb), 0.08);
  border-color: rgba(var(--gb-green-rgb), 0.3);
  color: var(--gb-green);
}

.suscripcion--expiring {
  background-color: color-mix(in srgb, var(--gb-amber) 10%, transparent);
  border-color: color-mix(in srgb, var(--gb-amber) 35%, transparent);
  color: var(--gb-amber);
}

.suscripcion--expired {
  background-color: rgba(var(--gb-red-rgb), 0.08);
  border-color: rgba(var(--gb-red-rgb), 0.3);
  color: var(--gb-error);
}

.suscripcion--none,
.suscripcion:not(.suscripcion--active):not(.suscripcion--expiring):not(.suscripcion--expired) {
  background-color: var(--gb-surface-high);
  color: var(--gb-text-muted);
}
</style>
