<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import AppHeader from '@/app/layouts/AppHeader.vue'
import AppSidebar from '@/app/layouts/AppSidebar.vue'
import { useTenantStore } from '@/core/tenant/tenant.store'
import { useUiStore } from '@/shared/stores/ui.store'

const ui = useUiStore()
const tenant = useTenantStore()
const route = useRoute()
const contenidoPrincipal = ref(null)

onMounted(() => {
  if (!tenant.tenant) {
    tenant.cargarTenant()
  }
})

watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    if (contenidoPrincipal.value) {
      contenidoPrincipal.value.scrollTop = 0
    }
  },
)
</script>

<template>
  <div class="panel" :class="{ 'panel--compacto gb-panel--compacto': ui.sidebarCompacto }">
    <a class="gb-salto-contenido" href="#contenido-principal">Saltar al contenido</a>

    <AppSidebar class="panel__sidebar" />
    <AppHeader class="panel__header" />

    <main id="contenido-principal" ref="contenidoPrincipal" class="panel__contenido" tabindex="-1">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.panel {
  display: grid;
  grid-template-columns: var(--gb-sidebar-ancho) minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-areas:
    'sidebar header'
    'sidebar contenido';
  height: 100%;
  width: 100%;
  background-color: var(--gb-bg);
  overflow: hidden;
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
  padding: 0.875rem var(--gb-gutter) 0.375rem;
  background-color: var(--gb-bg);
}

.panel__contenido {
  grid-area: contenido;
  min-width: 0;
  padding: var(--gb-margen);
  overflow-y: auto;
}

@media (max-width: 64rem) {
  .panel {
    grid-template-columns: var(--gb-sidebar-ancho-compacto) minmax(0, 1fr);
  }

  .panel__header {
    padding: 0.75rem var(--gb-espacio) 0.25rem;
  }

  .panel__contenido {
    padding: var(--gb-gutter) var(--gb-espacio);
  }
}

@media (max-width: 48rem) {
  .panel__header {
    padding: 0.5rem 0.75rem 0.25rem;
  }

  .panel__contenido {
    padding: 1rem 0.75rem;
  }
}
</style>
