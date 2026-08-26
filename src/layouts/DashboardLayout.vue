<script setup>
import { RouterView } from 'vue-router'

import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { useUiStore } from '@/stores/ui.store'

const ui = useUiStore()
</script>

<template>
  <!--
    Armazón único del panel administrativo: menú lateral, cabecera y contenido.
    Todas las secciones lo reutilizan; ninguna vista dibuja su propio sidebar.
  -->
  <div class="panel" :class="{ 'panel--compacto gb-panel--compacto': ui.sidebarCompacto }">
    <a class="gb-salto-contenido" href="#contenido-principal">Saltar al contenido</a>

    <AppSidebar class="panel__sidebar" />
    <AppHeader class="panel__header" />

    <main id="contenido-principal" class="panel__contenido" tabindex="-1">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.panel {
  display: grid;
  grid-template-columns: var(--gb-sidebar-ancho) minmax(0, 1fr);
  grid-template-rows: var(--gb-header-alto) minmax(0, 1fr);
  grid-template-areas:
    'sidebar header'
    'sidebar contenido';
  height: 100vh;
  min-height: 40rem;
  background-color: var(--gb-bg);
  overflow: hidden;
  /* Sin transición sobre grid-template-columns: no interpola de forma fiable
     entre valores basados en var() y el ancho renderizado se queda un estado
     por detrás del menú. El cambio de ancho es instantáneo a propósito. */
}

.panel--compacto {
  grid-template-columns: var(--gb-sidebar-ancho-compacto) minmax(0, 1fr);
}

.panel__sidebar {
  grid-area: sidebar;
}

.panel__header {
  grid-area: header;
  position: sticky;
  top: 0;
  z-index: 30;
}

.panel__contenido {
  grid-area: contenido;
  /* min-width: 0 evita que un hijo ancho (una tabla futura) desborde la rejilla
     y provoque scroll horizontal en toda la página. */
  min-width: 0;
  padding: var(--gb-margen);
  overflow-y: auto;
}

/* La ventana no da para el menú ancho: se fuerza el compacto, con o sin
   conmutador. Los textos del menú los oculta la utilidad global. */
@media (max-width: 64rem) {
  .panel {
    grid-template-columns: var(--gb-sidebar-ancho-compacto) minmax(0, 1fr);
  }

  .panel__contenido {
    padding: var(--gb-gutter) var(--gb-espacio);
  }
}
</style>
