<script setup>
import { computed } from 'vue'

import marcaUrl from '@/assets/images/brand/gym-bros-mark.webp'
import SidebarNavItem from '@/app/layouts/SidebarNavItem.vue'
import { SECCIONES } from '@/app/navigation/navegacion'
import { useTenantStore } from '@/core/tenant/tenant.store'
import { useUiStore } from '@/shared/stores/ui.store'

const ui = useUiStore()
const tenant = useTenantStore()
const compacto = computed(() => ui.sidebarCompacto)
</script>

<template>
  <aside id="menu-lateral" class="sidebar" :class="{ 'sidebar--compacto': compacto }">
    <div class="sidebar__marca">
      <div class="sidebar__marca-logo-wrapper">
        <img
          class="sidebar__marca-logo"
          :src="tenant.logoUrl || marcaUrl"
          :alt="tenant.logoUrl ? `Logo de ${tenant.nombreTenant}` : 'Gym Bros'"
          @error="(e) => (e.target.src = marcaUrl)"
        />
      </div>
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

.sidebar__marca-logo-wrapper {
  display: grid;
  place-items: center;
  padding: 0.2rem;
  width: min(100%, 8rem);
  height: auto;
  aspect-ratio: 400 / 180;
  overflow: hidden;
  border: 1px solid
    color-mix(in srgb, var(--gb-tenant-primary, #ffffff) 28%, rgba(255, 255, 255, 0.14));
  border-radius: 0.45rem;
  background-color: rgba(255, 255, 255, 0.025);
}

.sidebar .sidebar__marca-logo {
  display: block;
  width: 100%;
  height: 100%;
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

.sidebar--compacto .sidebar__marca-logo-wrapper {
  width: 3rem;
}

.sidebar--compacto .sidebar__nav {
  padding-inline: 0.625rem;
}

@media (max-width: 64rem) {
  .sidebar__marca {
    padding-inline: 0.5rem;
  }

  .sidebar__marca-logo-wrapper {
    width: 3rem;
  }

  .sidebar__nav {
    padding-inline: 0.625rem;
  }
}
</style>
