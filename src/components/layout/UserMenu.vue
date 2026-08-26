<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { SECCIONES_DE_USUARIO } from '@/router/navegacion'
import { useAuthStore } from '@/stores/auth.store'
import { inicialesDe } from '@/utils/iniciales'

const auth = useAuthStore()
const router = useRouter()

const abierto = ref(false)
const cerrando = ref(false)
const contenedor = useTemplateRef('contenedor')
const disparador = useTemplateRef('disparador')
const listaOpciones = useTemplateRef('listaOpciones')

const rol = computed(() => auth.usuario?.rol || 'Administrador')

/*
 * Iniciales en lugar de fotografía. Antes se usaba `login-athlete.webp` —el
 * mismo archivo de 1,8 MB que ilustra la pantalla de acceso— para pintar un
 * círculo de 32 px en cada carga del panel. Además no era la foto de quien
 * había iniciado sesión, sino una imagen de catálogo.
 *
 * Cuando Laravel sirva avatares reales, aquí entra la URL del usuario y las
 * iniciales quedan como alternativa (el patrón que ya usa UsuarioAvatar).
 */
const iniciales = computed(() => inicialesDe(auth.usuario?.nombre))

function alClicarFuera(evento) {
  if (!contenedor.value?.contains(evento.target)) cerrar()
}

function cerrar() {
  abierto.value = false
  document.removeEventListener('click', alClicarFuera, true)
}

function abrir() {
  if (abierto.value) return
  abierto.value = true
  document.addEventListener('click', alClicarFuera, true)
}

function alternar() {
  if (abierto.value) {
    cerrar()
    return
  }
  abrir()
}

/*
 * Navegación con teclado del patrón `menu` de WAI-ARIA.
 *
 * Antes se declaraban `role="menu"` y `role="menuitem"` sin nada de esto: un
 * lector de pantalla anunciaba «menú» y el usuario pulsaba las flechas
 * esperando moverse entre opciones, sin que ocurriera nada. Prometer un patrón
 * y no implementarlo es peor que no declararlo.
 *
 * Los elementos llevan `tabindex="-1"` y el foco se mueve por código («roving
 * focus»): dentro de un menú, el tabulador sale, no recorre las opciones.
 */
function opciones() {
  if (!listaOpciones.value) return []
  return [...listaOpciones.value.querySelectorAll('[role="menuitem"]')].filter(
    (el) => !el.hasAttribute('disabled'),
  )
}

/** @param {number} indice Negativo cuenta desde el final (-1 es la última). */
function enfocarOpcion(indice) {
  const lista = opciones()
  if (lista.length === 0) return
  const posicion = ((indice % lista.length) + lista.length) % lista.length
  lista[posicion].focus()
}

async function abrirYEnfocar(indice) {
  abrir()
  await nextTick()
  enfocarOpcion(indice)
}

function navegar(evento) {
  const lista = opciones()
  if (lista.length === 0) return

  const actual = lista.indexOf(document.activeElement)

  const acciones = {
    ArrowDown: () => enfocarOpcion(actual + 1),
    ArrowUp: () => enfocarOpcion(actual - 1),
    Home: () => enfocarOpcion(0),
    End: () => enfocarOpcion(-1),
    Tab: () => {
      // El tabulador cierra el menú y sigue el flujo normal del documento.
      cerrar()
      return false
    },
  }

  const accion = acciones[evento.key]
  if (!accion) return
  if (accion() !== false) evento.preventDefault()
}

function cerrarConEscape() {
  if (!abierto.value) return
  cerrar()
  disparador.value?.focus()
}

onBeforeUnmount(cerrar)

async function cerrarSesion() {
  if (cerrando.value) return

  cerrando.value = true
  try {
    await auth.cerrarSesion()
    await router.replace({ name: 'login' })
  } finally {
    cerrando.value = false
  }
}
</script>

<template>
  <div ref="contenedor" class="menu" @keydown.escape="cerrarConEscape">
    <button
      ref="disparador"
      type="button"
      class="menu__disparador"
      :aria-expanded="abierto"
      aria-haspopup="menu"
      aria-controls="menu-usuario"
      aria-label="Menú de usuario"
      @click="alternar"
      @keydown.down.prevent="abrirYEnfocar(0)"
      @keydown.up.prevent="abrirYEnfocar(-1)"
    >
      <span class="menu__avatar" aria-hidden="true">{{ iniciales }}</span>
      <span class="menu__resumen">
        <span>{{ auth.usuario?.nombre }}</span>
        <small>{{ rol }}</small>
      </span>
      <i class="bi bi-chevron-down menu__flecha" aria-hidden="true"></i>
    </button>

    <div v-show="abierto" id="menu-usuario" class="menu__panel">
      <!-- La cabecera queda FUERA del role="menu": un menú accesible sólo puede
           contener elementos de menú, y esto es texto informativo. -->
      <p class="menu__cabecera">
        <span class="menu__nombre">{{ auth.usuario?.nombre }}</span>
        <span class="menu__correo">{{ auth.usuario?.correo }}</span>
      </p>

      <div ref="listaOpciones" role="menu" aria-label="Opciones de usuario" @keydown="navegar">
        <RouterLink
          v-for="seccion in SECCIONES_DE_USUARIO"
          :key="seccion.name"
          class="menu__opcion"
          :to="{ name: seccion.name }"
          role="menuitem"
          tabindex="-1"
          @click="cerrar"
        >
          <i class="bi" :class="seccion.icono" aria-hidden="true"></i>
          {{ seccion.title }}
        </RouterLink>

        <button
          type="button"
          class="menu__opcion menu__opcion--salir"
          role="menuitem"
          tabindex="-1"
          :disabled="cerrando"
          @click="cerrarSesion"
        >
          <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
          {{ cerrando ? 'Cerrando…' : 'Cerrar sesión' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu {
  position: relative;
}

.menu__disparador {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-height: 2.5rem;
  padding: 0.25rem 0.5rem 0.25rem 0.25rem;
  background-color: transparent;
  border: 1px solid transparent;
  border-radius: var(--gb-radius-lg);
  color: var(--gb-text);
  cursor: pointer;
}

.menu__disparador:hover {
  background-color: var(--gb-surface-high);
  border-color: var(--gb-border);
}

.menu__avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  background-color: var(--gb-surface-high);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-lg);
  color: var(--gb-red-text);
  font-family: var(--gb-fuente-titulo);
  font-size: var(--gb-tipo-xxs);
  font-weight: 800;
  line-height: 1;
}

.menu__resumen {
  display: flex;
  flex-direction: column;
  min-width: 0;
  text-align: left;
}

.menu__resumen > span {
  max-width: 10rem;
  overflow: hidden;
  font-size: var(--gb-tipo-sm);
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu__resumen small {
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xxs);
  line-height: 1.25;
  text-transform: capitalize;
}

.menu__flecha {
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xxs);
  line-height: 1;
}

.menu__panel {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 1050;
  min-width: 15rem;
  padding: 0.375rem;
  background-color: var(--gb-surface-high);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-lg);
  box-shadow: var(--gb-relieve);
}

.menu__cabecera {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  margin: 0;
  padding: 0.625rem 0.75rem 0.75rem;
  border-bottom: 1px solid var(--gb-border);
}

.menu__nombre {
  color: var(--gb-text);
  font-weight: 700;
}

.menu__correo {
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-xs);
  overflow-wrap: anywhere;
}

.menu__opcion {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  margin-top: 0.25rem;
  padding: 0.625rem 0.75rem;
  background-color: transparent;
  border: 0;
  border-radius: var(--gb-radius);
  color: var(--gb-text-muted);
  font-size: var(--gb-tipo-base);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.menu__opcion:hover:not(:disabled) {
  background-color: var(--gb-surface-highest);
  color: var(--gb-text);
}

.menu__opcion--salir:hover:not(:disabled) {
  background-color: rgba(var(--gb-red-rgb), 0.15);
  color: var(--gb-error);
}

@media (max-width: 46rem) {
  .menu__resumen,
  .menu__flecha {
    display: none;
  }
}
</style>
