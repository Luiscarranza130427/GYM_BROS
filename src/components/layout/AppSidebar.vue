<script setup>
import { computed } from 'vue'

import marcaHorizontalUrl from '@/assets/images/brand/gym-bros-lockup.webp'
import marcaUrl from '@/assets/images/brand/gym-bros-mark.webp'
import SidebarNavItem from '@/components/layout/SidebarNavItem.vue'
import { SECCIONES } from '@/router/navegacion'
import { useUiStore } from '@/stores/ui.store'

const ui = useUiStore()

const compacto = computed(() => ui.sidebarCompacto)
</script>

<template>
  <aside id="menu-lateral" class="sidebar" :class="{ 'sidebar--compacto': compacto }">
    <div class="sidebar__marca">
      <img class="sidebar__marca-icono" :src="marcaUrl" alt="Gym Bros" />
      <img class="sidebar__marca-horizontal" :src="marcaHorizontalUrl" alt="Gym Bros" />
    </div>

    <nav class="sidebar__nav" aria-label="Secciones del panel">
      <ul class="sidebar__lista">
        <SidebarNavItem
          v-for="seccion in SECCIONES"
          :key="seccion.name"
          :seccion="seccion"
          :compacto="compacto"
        />
      </ul>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background-color: var(--gb-surface);
  border-right: 1px solid var(--gb-border);
  overflow: hidden;
}

.sidebar__marca {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: var(--gb-header-alto);
  min-height: var(--gb-header-alto);
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--gb-border);
}

.sidebar__marca-horizontal {
  display: block;
  width: 100%;
  max-width: 12.25rem;
  height: auto;
  object-fit: contain;
}

.sidebar__marca-icono {
  display: none;
  width: 3rem;
  height: 3rem;
  object-fit: contain;
}

.sidebar__nav {
  flex: 1;
  min-width: 0;
  padding: 0.75rem 0.875rem;
  overflow-y: auto;
}

.sidebar__lista {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sidebar--compacto .sidebar__marca {
  padding-inline: 0.5rem;
}

.sidebar--compacto .sidebar__marca-horizontal {
  display: none;
}

.sidebar--compacto .sidebar__marca-icono {
  display: block;
}

.sidebar--compacto .sidebar__nav {
  padding-inline: 0.625rem;
}

@media (max-width: 64rem) {
  .sidebar__marca-horizontal {
    display: none;
  }

  .sidebar__marca-icono {
    display: block;
  }

  .sidebar__marca {
    padding-inline: 0.5rem;
  }

  .sidebar__nav {
    padding-inline: 0.625rem;
  }
}
</style>
