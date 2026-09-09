<script setup>
import { computed, ref } from 'vue'

import marcaUrl from '@/assets/images/brand/gym-bros-lockup.webp'
import SidebarNavItem from '@/app/layouts/SidebarNavItem.vue'
import { SECCIONES } from '@/app/navigation/navegacion'
import { useTenantStore } from '@/core/tenant/tenant.store'
import { useUiStore } from '@/shared/stores/ui.store'

const ui = useUiStore()
const tenant = useTenantStore()
const compacto = computed(() => ui.sidebarCompacto)
const logoFallido = ref(false)
const tieneLogoEmpresa = computed(() => Boolean(tenant.logoUrl) && !logoFallido.value)
const estilosEmpresa = computed(() => ({
  '--gb-sidebar-accent': tenant.colorSecundario || tenant.colorPrimario || 'var(--gb-red)',
  '--gb-sidebar-brand': tenant.colorPrimario || 'var(--gb-surface-lowest)',
}))
</script>

<template>
  <aside
    id="menu-lateral"
    class="sidebar"
    :class="{ 'sidebar--compacto': compacto }"
    :style="estilosEmpresa"
  >
    <div class="sidebar__marca">
      <div class="sidebar__marca-logo-wrapper">
        <img
          class="sidebar__marca-logo"
          :src="tieneLogoEmpresa ? tenant.logoUrl : marcaUrl"
          :alt="tieneLogoEmpresa ? `Logo de ${tenant.nombreTenant}` : 'Gym Bros'"
          @error="logoFallido = true"
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
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background:
    radial-gradient(
      circle at 50% 0,
      color-mix(in srgb, var(--gb-sidebar-brand) 16%, transparent),
      transparent 17rem
    ),
    linear-gradient(180deg, var(--gb-surface) 0%, var(--gb-surface-lowest) 100%);
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
  padding: 0.375rem 1rem;
  border-bottom: 1px solid var(--gb-border);
}

.sidebar__marca-logo-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(100%, 10rem);
  height: calc(var(--gb-header-alto) - 0.75rem);
  min-width: 0;
}

.sidebar .sidebar__marca-logo {
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(
    0 0.25rem 0.5rem color-mix(in srgb, var(--gb-sidebar-brand) 22%, transparent)
  );
}

.sidebar__nav {
  flex: 1;
  min-width: 0;
  padding: 0.75rem 1rem 1rem;
  overflow-y: auto;
  scrollbar-color: color-mix(in srgb, var(--gb-sidebar-accent) 28%, var(--gb-border)) transparent;
  scrollbar-width: thin;
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
  height: 3rem;
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
    height: 3rem;
  }

  .sidebar__nav {
    padding-inline: 0.625rem;
  }
}
</style>
