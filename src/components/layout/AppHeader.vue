<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import NotificationButton from '@/components/layout/NotificationButton.vue'
import UserMenu from '@/components/layout/UserMenu.vue'
import { useUiStore } from '@/stores/ui.store'

const ui = useUiStore()
const route = useRoute()

const busqueda = ref('')
const titulo = computed(() => route.meta.title ?? '')
const mostrarBusqueda = computed(() => route.name === 'dashboard')
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
        <i class="bi bi-list" aria-hidden="true"></i>
        <span class="visually-hidden">
          {{ ui.sidebarCompacto ? 'Expandir menú lateral' : 'Contraer menú lateral' }}
        </span>
      </button>

      <p class="header__titulo">{{ titulo }}</p>

      <label v-if="mostrarBusqueda" class="header__busqueda">
        <span class="visually-hidden">Buscar en el dashboard</span>
        <i class="bi bi-search" aria-hidden="true"></i>
        <input
          v-model="busqueda"
          type="search"
          placeholder="Buscar sistemas, usuarios o métricas…"
        />
      </label>
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

.header__busqueda {
  position: relative;
  display: block;
  width: min(100%, 28rem);
  margin-left: 0.25rem;
}

.header__busqueda i {
  position: absolute;
  top: 50%;
  left: 0.875rem;
  color: var(--gb-text-muted);
  transform: translateY(-50%);
}

.header__busqueda input {
  width: 100%;
  height: 2.5rem;
  padding: 0 0.875rem 0 2.625rem;
  background-color: var(--gb-surface);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius);
  color: var(--gb-text);
  font-size: var(--gb-tipo-base);
  line-height: 1.25;
  outline: none;
}

.header__busqueda input:focus {
  border-color: var(--gb-red);
  box-shadow: 0 0 0 0.2rem rgba(var(--gb-red-rgb), 0.18);
}

.header__busqueda input::placeholder {
  color: var(--gb-text-muted);
}

.header__acciones {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 100%;
}

@media (max-width: 72rem) {
  .header__busqueda {
    display: none;
  }
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
