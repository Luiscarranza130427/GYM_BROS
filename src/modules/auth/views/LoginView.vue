<script setup>
import { ArrowRight, Eye, EyeOff, Mail, ShieldCheck } from 'lucide-vue-next'
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

import { useAuthStore } from '@/core/auth/auth.store'

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
  background: '#1c1b1b',
  color: '#e5e2e1',
  confirmButtonColor: '#e50914',
  customClass: {
    popup: 'login-swal-popup',
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
    swalGymBros.fire({
      icon: 'warning',
      title: 'Campos obligatorios',
      text: error,
      confirmButtonText: 'Entendido',
    })
    return
  }

  try {
    await auth.iniciarSesion({ correo: correo.value, contrasena: contrasena.value })
    await swalGymBros.fire({
      icon: 'success',
      title: '¡Sesión iniciada!',
      text: 'Accediendo al panel...',
      timer: 1000,
      showConfirmButton: false,
    })
    await router.replace(destinoSeguro(route.query.redirect))
  } catch (error) {
    const errorTexto = error.message || 'No se ha podido iniciar sesión.'
    mensajeError.value = errorTexto
    swalGymBros.fire({
      icon: 'error',
      title: 'Error de acceso',
      text: errorTexto,
      confirmButtonText: 'Reintentar',
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

@media (max-height: 48rem) and (min-width: 42.01rem) {
  .login__campo + .login__campo {
    margin-top: 0.75rem;
  }

  .login__enviar {
    margin-top: 1rem;
  }
}
</style>
