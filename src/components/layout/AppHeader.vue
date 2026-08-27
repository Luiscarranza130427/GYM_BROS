<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import IconoSvg from '@/components/base/IconoSvg.vue'
import NotificationButton from '@/components/layout/NotificationButton.vue'
import UserMenu from '@/components/layout/UserMenu.vue'
import { useUiStore } from '@/stores/ui.store'

const ui = useUiStore()
const route = useRoute()

const titulo = computed(() => route.meta.title ?? '')

/*
 * Aquí había una caja de búsqueda que no buscaba: tenía `v-model` y su valor no
 * se usaba en ningún sitio. Se retira en lugar de dejarla decorativa; un control
 * que no hace nada es peor que su ausencia, porque el usuario teclea, pulsa
 * Intro y concluye que la aplicación está rota.
 *
 * La búsqueda global es una decisión de producto pendiente y necesita backend.
 * Cada listado ya tiene la suya, que sí funciona y vive en la URL.
 */
</script>

<template>
  <header class="header">
    <div class="header__izquierda">
      <button
        type="button"
        class="gb-boton-icono header__toggle"
        :aria-pressed="ui.sidebarCompacto"
        aria-controls="menu-lateral"
        @click="ui.alternarSidebar()"
      >
        <IconoSvg nombre="list" />
        <span class="visually-hidden">
          {{ ui.sidebarCompacto ? 'Expandir menú lateral' : 'Contraer menú lateral' }}
        </span>
      </button>

      <p class="header__titulo">{{ titulo }}</p>
    </div>

    <div class="header__acciones">
      <NotificationButton />
      <UserMenu />
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gb-espacio);
  min-width: 0;
  min-height: var(--gb-header-alto);
  padding: 0 var(--gb-gutter);
  background-color: var(--gb-bg);
  border-bottom: 1px solid var(--gb-border);
}

.header__izquierda {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  height: 100%;
  min-width: 0;
  flex: 1;
}

.header__toggle {
  flex: none;
  font-size: 1.125rem;
  line-height: 1;
}

.header__titulo {
  flex: none;
  margin: 0;
  color: var(--gb-red);
  font-family: var(--gb-fuente-titulo);
  font-size: var(--gb-tipo-lg);
  font-weight: 900;
  line-height: 1.1;
  text-transform: uppercase;
}

.header__acciones {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 100%;
}

@media (max-width: 64rem) {
  .header__toggle {
    display: none;
  }
}

@media (max-width: 38rem) {
  .header {
    padding-inline: 1rem;
  }

  .header__titulo {
    font-size: 1rem;
  }
}
</style>
