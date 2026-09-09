<script setup>
import { ChevronDown, LogOut } from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { SECCIONES_DE_USUARIO } from '@/app/navigation/navegacion'
import { useAuthStore } from '@/core/auth/auth.store'
import { obtenerUsuario } from '@/modules/usuarios/services/usuarios.service'
import { inicialesDe } from '@/shared/utils/iniciales'
import { resolverUrlStorage } from '@/shared/utils/storage'
import marcaGymBros from '@/assets/images/brand/gym-bros-mark.webp'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

const auth = useAuthStore()
const router = useRouter()

const abierto = ref(false)
const cerrando = ref(false)
const contenedor = useTemplateRef('contenedor')
const disparador = useTemplateRef('disparador')
const listaOpciones = useTemplateRef('listaOpciones')
const imagenFallida = ref(false)
const fotoRemota = ref('')

const rol = computed(() => auth.usuario?.rol || 'Administrador')
const iniciales = computed(() => inicialesDe(auth.usuario?.nombre))
// No usamos la foto persistida en la sesión: puede estar obsoleta y producir
// un destello antes de que el API confirme el valor actual.
const fotoUrl = computed(() => resolverUrlStorage(fotoRemota.value))

watch(fotoUrl, () => {
  imagenFallida.value = false
})

onMounted(async () => {
  const idSesion = auth.usuario?.id
  if (!idSesion) return

  try {
    const usuarioActual = await obtenerUsuario(idSesion)
    fotoRemota.value = usuarioActual.fotoPerfil || ''
  } catch {
    // Sin confirmación actual del API se mantienen las iniciales.
  }
})

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

function opciones() {
  if (!listaOpciones.value) return []
  return [...listaOpciones.value.querySelectorAll('[role="menuitem"]')].filter(
    (el) => !el.hasAttribute('disabled'),
  )
}

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

// Compatibilidad para entornos de prueba o navegadores sin matchMedia
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

const swalCerrarSesion = Swal.mixin({
  background: 'var(--gb-surface)',
  color: 'var(--gb-text)',
  buttonsStyling: false,
  heightAuto: false,
  customClass: {
    container: 'logout-swal',
    popup: 'logout-swal__popup',
    image: 'logout-swal__marca',
    icon: 'logout-swal__icono',
    title: 'logout-swal__titulo',
    htmlContainer: 'logout-swal__mensaje',
    actions: 'logout-swal__acciones',
    confirmButton: 'btn btn-primary logout-swal__confirmar',
    cancelButton: 'btn logout-swal__cancelar',
    timerProgressBar: 'logout-swal__progreso',
  },
  showClass: {
    popup: 'logout-swal--entrada',
  },
  hideClass: {
    popup: 'logout-swal--salida',
  },
})

onBeforeUnmount(cerrar)

async function cerrarSesion() {
  if (cerrando.value) return

  cerrar()

  const confirmacion = await swalCerrarSesion.fire({
    icon: 'warning',
    title: '¿Cerrar sesión?',
    text: '¿Estás seguro de que deseas salir del panel administrativo?',
    showCancelButton: true,
    confirmButtonText: 'Sí, cerrar sesión',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
  })

  if (!confirmacion.isConfirmed) return

  cerrando.value = true
  try {
    await auth.cerrarSesion()
    await swalCerrarSesion.fire({
      imageUrl: marcaGymBros,
      imageAlt: 'Emblema de Gym Bros',
      imageWidth: 72,
      imageHeight: 72,
      title: 'Sesión finalizada',
      text: 'Cerrando tu sesión de forma segura…',
      timer: 1200,
      timerProgressBar: true,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
    })
    await router.replace({ name: 'login' })
  } catch (error) {
    await swalCerrarSesion.fire({
      icon: 'error',
      title: 'Error al salir',
      text: error.message || 'No se pudo cerrar la sesión.',
      confirmButtonText: 'Entendido',
    })
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
      <img
        v-if="fotoUrl && !imagenFallida"
        :src="fotoUrl"
        :alt="auth.usuario?.nombre || 'Usuario'"
        class="menu__avatar-img"
        @error="imagenFallida = true"
      />
      <span v-else class="menu__avatar" aria-hidden="true">{{ iniciales }}</span>
      <span class="menu__resumen">
        <span>{{ auth.usuario?.nombre }}</span>
        <small>{{ rol }}</small>
      </span>
      <ChevronDown :size="16" class="menu__flecha" aria-hidden="true" />
    </button>

    <div v-show="abierto" id="menu-usuario" class="menu__panel">
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
          <component :is="seccion.icono" :size="16" aria-hidden="true" />
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
          <LogOut :size="16" aria-hidden="true" />
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

.menu__avatar-img {
  flex: none;
  width: 2rem;
  height: 2rem;
  border-radius: var(--gb-radius-lg);
  object-fit: cover;
  border: 1px solid var(--gb-red);
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
  flex-shrink: 0;
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

/*
 * SweetAlert se teletransporta a <body>, fuera del atributo de este estilo
 * scoped. Los selectores globales quedan deliberadamente limitados al prefijo
 * `logout-swal` para no alterar diálogos de otros módulos.
 */
:global(.logout-swal) {
  padding: var(--gb-espacio);
  background: var(--gb-overlay-strong);
  backdrop-filter: blur(0.5rem);
}

:global(.logout-swal__popup) {
  position: relative;
  width: min(100%, 27rem);
  overflow: hidden;
  padding: 2rem 2rem 1.75rem;
  border: 1px solid var(--gb-border-soft);
  border-radius: var(--gb-radius-xl);
  background: linear-gradient(145deg, var(--gb-surface-high), var(--gb-surface));
  box-shadow:
    var(--gb-relieve),
    0 1.75rem 5rem var(--gb-overlay-strong);
}

:global(.logout-swal__popup::before) {
  position: absolute;
  inset: 0 0 auto;
  height: 0.25rem;
  background: linear-gradient(90deg, var(--gb-red-hover), var(--gb-red), var(--gb-red-text));
  content: '';
}

:global(.logout-swal__marca) {
  width: 4.5rem;
  height: 4.5rem;
  margin: 0.25rem auto 1.25rem;
  padding: 0.625rem;
  border: 1px solid var(--gb-border-soft);
  border-radius: var(--gb-radius-xl);
  background: var(--gb-surface-lowest);
  box-shadow:
    var(--gb-relieve-fuerte),
    0 0 0 0.375rem var(--gb-surface-high-50);
  object-fit: contain;
}

:global(.logout-swal__icono) {
  margin-block: 0.375rem 1.25rem;
}

:global(.logout-swal__icono.swal2-warning) {
  border-color: var(--gb-amber);
  color: var(--gb-amber);
}

:global(.logout-swal__icono.swal2-error) {
  border-color: var(--gb-error);
}

:global(.logout-swal__icono.swal2-error [class^='swal2-x-mark-line']) {
  background-color: var(--gb-error);
}

:global(.logout-swal__titulo) {
  padding: 0;
  color: var(--gb-text);
  font-family: var(--gb-fuente-titulo);
  font-size: clamp(var(--gb-tipo-lg), 4vw, var(--gb-tipo-xl));
  font-weight: 900;
  letter-spacing: -0.025em;
  line-height: 1.1;
  text-transform: uppercase;
}

:global(.logout-swal__mensaje) {
  margin: 0.75rem 0 0;
  padding: 0;
  color: var(--gb-text-muted);
  font-family: var(--gb-fuente-texto);
  font-size: var(--gb-tipo-base);
  line-height: 1.55;
}

:global(.logout-swal__acciones) {
  display: flex;
  gap: 0.75rem;
  width: 100%;
  margin-top: 1.5rem;
  justify-content: center;
}

:global(.logout-swal__confirmar) {
  min-width: 9.5rem;
  min-height: 2.75rem;
  border-radius: var(--gb-radius-lg);
  font-family: var(--gb-fuente-titulo);
  font-size: var(--gb-tipo-sm);
  font-weight: 800;
  letter-spacing: 0.035em;
  text-transform: uppercase;
}

:global(.logout-swal__cancelar) {
  min-width: 7.5rem;
  min-height: 2.75rem;
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius-lg);
  background: var(--gb-surface-highest);
  color: var(--gb-text-muted);
  font-family: var(--gb-fuente-titulo);
  font-size: var(--gb-tipo-sm);
  font-weight: 800;
  letter-spacing: 0.035em;
  text-transform: uppercase;
  transition: all 0.15s ease-in-out;
}

:global(.logout-swal__cancelar:hover) {
  background: var(--gb-surface-high);
  color: var(--gb-text);
  border-color: var(--gb-border-soft);
}

:global(.logout-swal__progreso) {
  height: 0.1875rem;
  background: var(--gb-red);
}

:global(.logout-swal--entrada) {
  animation: logout-swal-entrada 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

:global(.logout-swal--salida) {
  animation: logout-swal-salida 150ms ease-in both;
}

@keyframes logout-swal-entrada {
  from {
    opacity: 0;
    transform: translateY(0.75rem) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes logout-swal-salida {
  to {
    opacity: 0;
    transform: translateY(0.375rem) scale(0.99);
  }
}

@media (prefers-reduced-motion: reduce) {
  :global(.logout-swal--entrada),
  :global(.logout-swal--salida) {
    animation-duration: 1ms;
  }
}
</style>
