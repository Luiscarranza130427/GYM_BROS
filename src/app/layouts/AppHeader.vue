<script setup>
import { Menu, Search } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import NotificationButton from '@/app/layouts/NotificationButton.vue'
import UserMenu from '@/app/layouts/UserMenu.vue'
import { useTenantStore } from '@/core/tenant/tenant.store'
import { useUiStore } from '@/shared/stores/ui.store'

const ui = useUiStore()
const tenant = useTenantStore()
const route = useRoute()
const router = useRouter()

const estilosEmpresa = computed(() => ({
  '--gb-header-accent': tenant.colorSecundario || tenant.colorPrimario || 'var(--gb-red)',
  '--gb-header-brand': tenant.colorPrimario || 'var(--gb-surface-lowest)',
}))

const DESCRIPCIONES_POR_TITULO = {
  Empresas: 'Gestión de empresas',
  'Nueva empresa': 'Alta de empresa',
  'Detalle empresa': 'Detalle de empresa',
  'Editar empresa': 'Actualizar empresa',
  Usuarios: 'Gestión de usuarios',
  'Nuevo usuario': 'Alta de usuario',
  'Perfil de usuario': 'Detalle de usuario',
  'Editar usuario': 'Actualizar usuario',
  Dashboard: 'Panel de control',
  Ejercicios: 'Biblioteca de ejercicios',
  'Nuevo ejercicio': 'Registrar ejercicio',
  'Detalle ejercicio': 'Ficha técnica de ejercicio',
  'Editar ejercicio': 'Actualizar ejercicio',
  Planes: 'Gestión de membresías',
  'Nuevo plan': 'Crear nuevo plan',
  'Editar plan': 'Actualizar plan',
  Alimentación: 'Planes nutricionales y alimentos',
  Notificaciones: 'Centro de notificaciones',
  'Mi perfil': 'Configuración de cuenta',
  Pagos: 'Facturación e historial',
  'Suscripciones SaaS': 'Control de suscripciones',
}

const titulo = computed(() => route.meta.title ?? 'GYM BROS')
const subtitulo = computed(() => {
  if (route.meta.subtitle) return route.meta.subtitle
  return DESCRIPCIONES_POR_TITULO[route.meta.title] || 'Panel de administración'
})

const placeholderBusqueda = computed(() => {
  const nombre = (route.meta.title ?? '').toLowerCase()
  if (nombre.includes('empresa')) return 'Buscar empresas...'
  if (nombre.includes('usuario')) return 'Buscar usuarios...'
  if (nombre.includes('ejercicio')) return 'Buscar ejercicios...'
  if (nombre.includes('plan') || nombre.includes('membres')) return 'Buscar planes...'
  if (nombre.includes('alimento') || nombre.includes('comida')) return 'Buscar alimentos...'
  if (nombre.includes('notificac')) return 'Buscar notificaciones...'
  return 'Buscar en Gym Bros...'
})

const textoBusqueda = ref(String(route.query.search ?? ''))

watch(
  () => route.query.search,
  (nuevo) => {
    textoBusqueda.value = String(nuevo ?? '')
  },
)

let temporizador = null
function manejarInput(evento) {
  const valor = evento.target.value
  textoBusqueda.value = valor
  clearTimeout(temporizador)
  temporizador = setTimeout(() => {
    enviarBusqueda()
  }, 350)
}

function enviarBusqueda() {
  clearTimeout(temporizador)
  const query = { ...route.query }
  const valorLimpio = textoBusqueda.value.trim()
  if (valorLimpio) {
    query.search = valorLimpio
    query.page = '1'
  } else {
    delete query.search
    delete query.page
  }
  router.replace({ query }).catch(() => {})
}
</script>

<template>
  <header class="header" :style="estilosEmpresa">
    <div class="header__izquierda">
      <button
        type="button"
        class="header__toggle"
        :aria-pressed="ui.sidebarCompacto"
        aria-controls="menu-lateral"
        @click="ui.alternarSidebar()"
      >
        <Menu :size="18" aria-hidden="true" />
        <span class="visually-hidden">
          {{ ui.sidebarCompacto ? 'Expandir menú lateral' : 'Contraer menú lateral' }}
        </span>
      </button>

      <div class="header__identidad">
        <h1 class="header__titulo">{{ titulo }}</h1>
        <p v-if="subtitulo" class="header__subtitulo">{{ subtitulo }}</p>
      </div>
    </div>

    <div class="header__centro">
      <form class="header__buscador" role="search" @submit.prevent="enviarBusqueda">
        <Search class="header__buscador-icono" :size="16" aria-hidden="true" />
        <input
          v-model="textoBusqueda"
          type="search"
          class="header__buscador-input"
          :placeholder="placeholderBusqueda"
          aria-label="Buscar"
          @input="manejarInput"
        />
      </form>
    </div>

    <div class="header__derecha">
      <NotificationButton />
      <div class="header__divisor" aria-hidden="true"></div>
      <UserMenu />
    </div>
  </header>
</template>

<style scoped>
.header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  width: 100%;
  min-height: 4.25rem;
  padding: 0.5rem 1rem 0.5rem 0.75rem;
  background:
    radial-gradient(
      circle at 20% 0,
      color-mix(in srgb, var(--gb-header-brand, var(--gb-red)) 14%, transparent),
      transparent 25rem
    ),
    linear-gradient(180deg, #181818 0%, #111111 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--gb-radius-xl);
  box-shadow:
    0 12px 35px rgba(0, 0, 0, 0.75),
    0 4px 18px -2px color-mix(in srgb, var(--gb-header-accent, var(--gb-red)) 30%, transparent);
}

/* Línea sutil de resplandor en el borde inferior con el color de acento de la empresa */
.header::after {
  content: '';
  position: absolute;
  inset: auto 1.5rem -1px 1.5rem;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--gb-header-accent, var(--gb-red)) 25%,
    var(--gb-header-accent, var(--gb-red)) 75%,
    transparent 100%
  );
  box-shadow: 0 0 12px 1px var(--gb-header-accent, var(--gb-red));
  border-radius: 9999px;
  pointer-events: none;
}

.header__izquierda {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: none;
}

.header__toggle {
  display: grid;
  place-items: center;
  width: 2.625rem;
  height: 2.625rem;
  padding: 0;
  background-color: #1a1a1a;
  border: 1px solid color-mix(in srgb, var(--gb-header-accent, var(--gb-red)) 45%, transparent);
  border-radius: 0.75rem;
  color: var(--gb-text);
  cursor: pointer;
  box-shadow: 0 0 10px color-mix(in srgb, var(--gb-header-accent, var(--gb-red)) 15%, transparent);
  transition: all 0.2s ease;
}

.header__toggle:hover {
  background-color: #222222;
  border-color: var(--gb-header-accent, var(--gb-red));
  box-shadow: 0 0 14px color-mix(in srgb, var(--gb-header-accent, var(--gb-red)) 35%, transparent);
  color: #ffffff;
}

.header__identidad {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.125rem;
}

.header__titulo {
  margin: 0;
  color: var(--gb-header-accent, var(--gb-red));
  font-family: var(--gb-fuente-titulo);
  font-size: var(--gb-tipo-lg);
  font-weight: 900;
  letter-spacing: 0.02em;
  line-height: 1.1;
  text-transform: uppercase;
}

.header__subtitulo {
  margin: 0;
  color: var(--gb-text-muted);
  font-family: var(--gb-fuente-texto);
  font-size: var(--gb-tipo-xs);
  font-weight: 500;
  line-height: 1.2;
}

.header__centro {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  max-width: 32rem;
  margin: 0 auto;
}

.header__buscador {
  position: relative;
  width: 100%;
}

.header__buscador-icono {
  position: absolute;
  top: 50%;
  left: 1.125rem;
  transform: translateY(-50%);
  color: var(--gb-text-muted);
  pointer-events: none;
}

.header__buscador-input {
  width: 100%;
  height: 2.5rem;
  padding: 0 1.25rem 0 2.75rem;
  background-color: #1c1b1b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
  color: var(--gb-text);
  font-family: var(--gb-fuente-texto);
  font-size: var(--gb-tipo-sm);
  outline: none;
  transition: all 0.2s ease;
}

.header__buscador-input::placeholder {
  color: #777777;
}

.header__buscador-input:focus {
  background-color: #222222;
  border-color: color-mix(in srgb, var(--gb-header-accent, var(--gb-red)) 55%, transparent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--gb-header-accent, var(--gb-red)) 25%, transparent);
}

.header__derecha {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex: none;
}

.header__divisor {
  width: 1px;
  height: 1.75rem;
  background-color: rgba(255, 255, 255, 0.12);
  margin: 0 0.25rem;
}

@media (max-width: 64rem) {
  .header__centro {
    max-width: 20rem;
  }
}

@media (max-width: 48rem) {
  .header {
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
  }

  .header__centro {
    display: none;
  }

  .header__subtitulo {
    display: none;
  }
}

@media (max-width: 38rem) {
  .header__titulo {
    font-size: 1rem;
  }

  .header__divisor {
    display: none;
  }
}
</style>
