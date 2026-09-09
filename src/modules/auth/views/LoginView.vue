<script setup>
import { ArrowRight, Eye, EyeOff, Mail, ShieldCheck } from 'lucide-vue-next'
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

import { useAuthStore } from '@/core/auth/auth.store'
import marcaGymBros from '@/assets/images/brand/gym-bros-mark.webp'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const correo = ref('')
const contrasena = ref('')
const mensajeError = ref('')
const mostrarContrasena = ref(false)
const campoCorreo = useTemplateRef('campoCorreo')

const hayError = computed(() => Boolean(mensajeError.value))

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

const swalGymBros = Swal.mixin({
  background: 'var(--gb-surface)',
  color: 'var(--gb-text)',
  buttonsStyling: false,
  heightAuto: false,
  customClass: {
    container: 'login-swal',
    popup: 'login-swal__popup',
    image: 'login-swal__marca',
    icon: 'login-swal__icono',
    title: 'login-swal__titulo',
    htmlContainer: 'login-swal__mensaje',
    confirmButton: 'btn btn-primary login-swal__confirmar',
    timerProgressBar: 'login-swal__progreso',
  },
  showClass: {
    popup: 'login-swal--entrada',
  },
  hideClass: {
    popup: 'login-swal--salida',
  },
})

onMounted(() => {
  campoCorreo.value?.focus()
})

function destinoSeguro(redirect) {
  const alDashboard = { name: 'dashboard' }

  if (typeof redirect !== 'string' || !redirect.startsWith('/')) return alDashboard

  const segundoCaracter = redirect.charAt(1)
  if (segundoCaracter === '/' || segundoCaracter === '\\') return alDashboard

  const resuelta = router.resolve(redirect)
  const esRutaConocida = resuelta.matched.length > 0 && resuelta.name !== 'catch-all'

  return esRutaConocida ? redirect : alDashboard
}

async function enviar() {
  mensajeError.value = ''

  if (!correo.value || !contrasena.value) {
    const error = 'Introduce tu correo y tu contraseña.'
    mensajeError.value = error
    await swalGymBros.fire({
      icon: 'warning',
      title: 'Completa tu acceso',
      text: error,
      confirmButtonText: 'Entendido',
    })
    return
  }

  try {
    await auth.iniciarSesion({ correo: correo.value, contrasena: contrasena.value })
    await swalGymBros.fire({
      imageUrl: marcaGymBros,
      imageAlt: 'Emblema de Gym Bros',
      imageWidth: 72,
      imageHeight: 72,
      title: 'Acceso autorizado',
      text: 'Preparando tu panel administrativo…',
      timer: 1200,
      timerProgressBar: true,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
    })
    await router.replace(destinoSeguro(route.query.redirect))
  } catch (error) {
    const errorTexto = error.message || 'No se ha podido iniciar sesión.'
    mensajeError.value = errorTexto
    await swalGymBros.fire({
      icon: 'error',
      title: 'Acceso denegado',
      text: errorTexto,
      confirmButtonText: 'Intentar de nuevo',
    })
  }
}
</script>

<template>
  <section aria-labelledby="titulo-login">
    <!--
      El título va oculto a la vista, no eliminado: sin ningún encabezado la
      página deja de ser navegable para un lector de pantalla, y el `<section>`
      se quedaría con un `aria-labelledby` apuntando a nada.
    -->
    <h1 id="titulo-login" class="visually-hidden">Iniciar sesión</h1>

    <p v-if="mensajeError" id="error-login" class="alert alert-danger login__error" role="alert">
      {{ mensajeError }}
    </p>

    <form novalidate @submit.prevent="enviar">
      <div class="login__campo">
        <label class="form-label" for="correo">Correo electrónico</label>
        <div class="login__control">
          <Mail class="login__icono" :size="16" aria-hidden="true" />
          <input
            id="correo"
            ref="campoCorreo"
            v-model.trim="correo"
            class="form-control"
            type="email"
            name="correo"
            autocomplete="username"
            placeholder="juan.perez@gmail.com"
            required
            :aria-invalid="hayError"
            :aria-describedby="hayError ? 'error-login' : undefined"
          />
        </div>
      </div>

      <div class="login__campo">
        <label class="form-label" for="contrasena">Contraseña</label>
        <div class="login__control">
          <ShieldCheck class="login__icono" :size="16" aria-hidden="true" />
          <input
            id="contrasena"
            v-model="contrasena"
            class="form-control"
            :type="mostrarContrasena ? 'text' : 'password'"
            name="contrasena"
            autocomplete="current-password"
            placeholder="Tu contraseña"
            required
            :aria-invalid="hayError"
            :aria-describedby="hayError ? 'error-login' : undefined"
          />
          <button
            type="button"
            class="login__mostrar"
            :aria-pressed="mostrarContrasena"
            :aria-label="mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            @click="mostrarContrasena = !mostrarContrasena"
          >
            <component :is="mostrarContrasena ? EyeOff : Eye" :size="16" aria-hidden="true" />
          </button>
        </div>
      </div>

      <button type="submit" class="btn btn-primary login__enviar" :disabled="auth.cargando">
        <span
          v-if="auth.cargando"
          class="spinner-border spinner-border-sm"
          aria-hidden="true"
        ></span>
        <span>{{ auth.cargando ? 'Entrando…' : 'Entrar al dashboard' }}</span>
        <ArrowRight :size="16" aria-hidden="true" />
      </button>
    </form>
  </section>
</template>

<style scoped>
.login__error {
  padding-block: 0.5rem;
}

.login__campo + .login__campo {
  margin-top: 0.875rem;
}

.login__control {
  position: relative;
}

.login__control > .login__icono,
.login__control > :deep(svg:first-child) {
  position: absolute;
  top: 50%;
  left: 0.875rem;
  z-index: 1;
  color: var(--gb-text-muted);
  transform: translateY(-50%);
  pointer-events: none;
}

.login__control .form-control {
  min-height: 2.75rem;
  padding-left: 2.75rem;
  border-radius: 0.875rem;
}

.login__control .form-control:has(+ .login__mostrar) {
  padding-right: 3rem;
}

.login__mostrar {
  position: absolute;
  top: 50%;
  right: 0.375rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  background: transparent;
  border: 0;
  color: var(--gb-text-muted);
  transform: translateY(-50%);
}

.login__mostrar:hover {
  color: var(--gb-text);
}

.login__enviar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 2.875rem;
  margin-top: 1.25rem;
  border-radius: 0.875rem;
}

/*
 * SweetAlert se teletransporta a <body>, fuera del atributo de este estilo
 * scoped. Los selectores globales quedan deliberadamente limitados al prefijo
 * `login-swal` para no alterar diálogos de otros módulos.
 */
:global(.login-swal) {
  padding: var(--gb-espacio);
  background: var(--gb-overlay-strong);
  backdrop-filter: blur(0.5rem);
}

:global(.login-swal__popup) {
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

:global(.login-swal__popup::before) {
  position: absolute;
  inset: 0 0 auto;
  height: 0.25rem;
  background: linear-gradient(90deg, var(--gb-red-hover), var(--gb-red), var(--gb-red-text));
  content: '';
}

:global(.login-swal__marca) {
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

:global(.login-swal__icono) {
  margin-block: 0.375rem 1.25rem;
}

:global(.login-swal__icono.swal2-warning) {
  border-color: var(--gb-amber);
  color: var(--gb-amber);
}

:global(.login-swal__icono.swal2-error) {
  border-color: var(--gb-error);
}

:global(.login-swal__icono.swal2-error [class^='swal2-x-mark-line']) {
  background-color: var(--gb-error);
}

:global(.login-swal__titulo) {
  padding: 0;
  color: var(--gb-text);
  font-family: var(--gb-fuente-titulo);
  font-size: clamp(var(--gb-tipo-lg), 4vw, var(--gb-tipo-xl));
  font-weight: 900;
  letter-spacing: -0.025em;
  line-height: 1.1;
  text-transform: uppercase;
}

:global(.login-swal__mensaje) {
  margin: 0.75rem 0 0;
  padding: 0;
  color: var(--gb-text-muted);
  font-family: var(--gb-fuente-texto);
  font-size: var(--gb-tipo-base);
  line-height: 1.55;
}

:global(.login-swal__confirmar) {
  min-width: 11rem;
  min-height: 2.75rem;
  margin-top: 1.5rem;
  border-radius: var(--gb-radius-lg);
  font-family: var(--gb-fuente-titulo);
  font-size: var(--gb-tipo-sm);
  font-weight: 800;
  letter-spacing: 0.035em;
  text-transform: uppercase;
}

:global(.login-swal__progreso) {
  height: 0.1875rem;
  background: var(--gb-red);
}

:global(.login-swal--entrada) {
  animation: login-swal-entrada 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

:global(.login-swal--salida) {
  animation: login-swal-salida 150ms ease-in both;
}

@keyframes login-swal-entrada {
  from {
    opacity: 0;
    transform: translateY(0.75rem) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes login-swal-salida {
  to {
    opacity: 0;
    transform: translateY(0.375rem) scale(0.99);
  }
}

@media (prefers-reduced-motion: reduce) {
  :global(.login-swal--entrada),
  :global(.login-swal--salida) {
    animation-duration: 1ms;
  }
}

@media (max-height: 48rem) and (min-width: 42.01rem) {
  .login__campo + .login__campo {
    margin-top: 0.75rem;
  }

  .login__enviar {
    margin-top: 1rem;
  }
}
</style>
