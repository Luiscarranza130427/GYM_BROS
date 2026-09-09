<script setup>
import { ChevronRight } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

defineProps({
  seccion: { type: Object, required: true },
  compacto: { type: Boolean, default: false },
})
</script>

<template>
  <li>
    <RouterLink
      class="enlace"
      :class="{ 'enlace--compacto': compacto }"
      :to="{ name: seccion.name }"
      :title="compacto ? seccion.title : null"
    >
      <span class="enlace__icono">
        <component :is="seccion.icono" :size="18" aria-hidden="true" />
      </span>

      <span class="enlace__contenido gb-oculto-al-contraer">
        <span class="enlace__texto">{{ seccion.title }}</span>
        <small v-if="seccion.descripcion" class="enlace__descripcion">{{
          seccion.descripcion
        }}</small>
      </span>

      <ChevronRight class="enlace__flecha gb-oculto-al-contraer" :size="15" aria-hidden="true" />
    </RouterLink>
  </li>
</template>

<style scoped>
.enlace {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-height: 2.875rem;
  padding: 0.375rem 0.5rem;
  border: 1px solid transparent;
  border-radius: var(--gb-radius-lg);
  color: var(--gb-text-muted);
  font-family: var(--gb-fuente-titulo);
  text-decoration: none;
  white-space: nowrap;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.enlace--compacto {
  justify-content: center;
  padding-inline: 0.5rem;
}

.enlace:hover {
  background-color: color-mix(in srgb, var(--gb-surface-high) 68%, transparent);
  border-color: color-mix(in srgb, var(--gb-border-soft) 72%, transparent);
  color: var(--gb-text);
}

.enlace:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--gb-sidebar-accent, var(--gb-focus)) 70%, white);
  outline-offset: 0.125rem;
}

.enlace.router-link-active {
  background: linear-gradient(
    100deg,
    color-mix(in srgb, var(--gb-sidebar-accent, var(--gb-red)) 7%, var(--gb-surface-high)),
    color-mix(in srgb, var(--gb-surface-high) 88%, var(--gb-surface-lowest))
  );
  border-color: color-mix(in srgb, var(--gb-sidebar-accent, var(--gb-red)) 26%, var(--gb-border));
  box-shadow:
    inset 0.1875rem 0 0 var(--gb-sidebar-accent, var(--gb-red)),
    var(--gb-relieve);
  color: var(--gb-text);
  font-weight: 800;
  transform: none;
}

.enlace.router-link-active .enlace__icono {
  border-color: color-mix(in srgb, var(--gb-sidebar-accent, var(--gb-red)) 42%, var(--gb-border));
  background-color: color-mix(
    in srgb,
    var(--gb-sidebar-accent, var(--gb-red)) 12%,
    var(--gb-surface-lowest)
  );
  color: color-mix(in srgb, var(--gb-sidebar-accent, var(--gb-red)) 70%, white);
}

.enlace__icono {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-lg);
  background-color: var(--gb-surface-lowest);
  font-size: 1.125rem;
  line-height: 1;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.enlace:hover .enlace__icono {
  border-color: color-mix(in srgb, var(--gb-sidebar-accent, var(--gb-red)) 22%, var(--gb-border));
  transform: translateY(-0.0625rem);
}

.enlace__contenido {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.enlace__texto {
  overflow: hidden;
  font-size: var(--gb-tipo-sm);
  font-weight: 700;
  letter-spacing: 0.02em;
  text-overflow: ellipsis;
}

.enlace__descripcion {
  overflow: hidden;
  color: var(--gb-text-muted);
  font-family: var(--gb-fuente-texto);
  font-size: var(--gb-tipo-xxs);
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1.3;
  text-overflow: ellipsis;
}

.enlace__flecha {
  flex: none;
  color: var(--gb-text-muted);
  opacity: 0.32;
  transition:
    color 0.18s ease,
    opacity 0.18s ease,
    transform 0.18s ease;
}

.enlace:hover .enlace__flecha,
.enlace.router-link-active .enlace__flecha {
  color: color-mix(in srgb, var(--gb-sidebar-accent, var(--gb-red)) 70%, white);
  opacity: 0.9;
  transform: translateX(0.125rem);
}

@media (prefers-reduced-motion: reduce) {
  .enlace,
  .enlace__icono,
  .enlace__flecha {
    transition-duration: 1ms;
  }
}

@media (max-width: 64rem) {
  .enlace {
    justify-content: center;
    padding-inline: 0.5rem;
  }
}
</style>
