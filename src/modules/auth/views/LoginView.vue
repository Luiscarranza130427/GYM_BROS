<script setup>
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { pistaDeCredenciales } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const correo = ref('')
const contrasena = ref('')
const mensajeError = ref('')
const mostrarContrasena = ref(false)
const campoCorreo = useTemplateRef('campoCorreo')

// La pista de demo llega de forma asíncrona: el servicio carga los datos
// simulados con `import()` para que no entren en el bundle de producción. La
// vista sigue sin saber si hay backend o no; sólo espera la respuesta.
const pistaDemo = ref(null)
const hayError = computed(() => Boolean(mensajeError.value))

onMounted(async () => {
  campoCorreo.value?.focus()
  pistaDemo.value = await pistaDeCredenciales()
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
    mensajeError.value = 'Introduce tu correo y tu contraseña.'
    return
  }

  try {
    await auth.iniciarSesion({ correo: correo.value, contrasena: contrasena.value })
    await router.replace(destinoSeguro(route.query.redirect))
  } catch (error) {
    mensajeError.value = error.message || 'No se ha podido iniciar sesión.'
  }
}
</script>

<template>
  <section aria-labelledby="titulo-login">
    <header class="login__cabecera">
      <p>Acceso administrativo</p>
      <h2 id="titulo-login">Bienvenido de nuevo</h2>
      <span>Introduce tus credenciales para entrar al centro de mando.</span>
    </header>

    <p v-if="mensajeError" id="error-login" class="alert alert-danger py-2" role="alert">
      {{ mensajeError }}
    </p>

    <form novalidate @submit.prevent="enviar">
      <div class="login__campo">
        <label class="form-label" for="correo">Correo electrónico</label>
        <div class="login__control">
          <i class="bi bi-envelope" aria-hidden="true"></i>
          <input
            id="correo"
            ref="campoCorreo"
            v-model.trim="correo"
            class="form-control"
            type="email"
            name="correo"
            autocomplete="username"
            placeholder="admin@gymbros.com"
            required
            :aria-invalid="hayError"
            :aria-describedby="hayError ? 'error-login' : undefined"
          />
        </div>
      </div>

      <div class="login__campo">
        <div class="login__fila-label">
          <label class="form-label" for="contrasena">Contraseña</label>
          <span>Acceso seguro</span>
        </div>
        <div class="login__control">
          <i class="bi bi-shield-lock" aria-hidden="true"></i>
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
            <i
              :class="mostrarContrasena ? 'bi-eye-slash' : 'bi-eye'"
              class="bi"
              aria-hidden="true"
            ></i>
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
        <i v-if="!auth.cargando" class="bi bi-arrow-right" aria-hidden="true"></i>
      </button>
    </form>

    <p v-if="pistaDemo" class="login__demo">
      <i class="bi bi-terminal" aria-hidden="true"></i>
      <span>
        Demo: <code>{{ pistaDemo.correo }}</code> · <code>{{ pistaDemo.contrasena }}</code>
      </span>
    </p>
  </section>
</template>

<style scoped>
.login__cabecera {
  margin-bottom: 1.25rem;
}

.login__cabecera p {
  margin: 0 0 0.625rem;
  color: var(--gb-red-text);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.login__cabecera h2 {
  margin: 0;
  font-size: clamp(1.5rem, 2.4vw, 1.8rem);
  font-weight: 900;
  line-height: 1.15;
  text-transform: uppercase;
}

.login__cabecera span {
  display: block;
  margin-top: 0.5rem;
  color: var(--gb-text-muted);
  font-size: 0.9375rem;
}

.login__campo + .login__campo {
  margin-top: 0.875rem;
}

.login__fila-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.login__fila-label span {
  color: var(--gb-text-muted);
  font-size: 0.6875rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.login__control {
  position: relative;
}

.login__control > .bi:first-child {
  position: absolute;
  top: 50%;
  left: 0.875rem;
  z-index: 1;
  color: var(--gb-text-muted);
  transform: translateY(-50%);
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

.login__demo {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  margin: 1rem 0 0;
  padding: 0.625rem 0.75rem;
  background-color: var(--gb-bg);
  border: 1px dashed var(--gb-border);
  border-radius: var(--gb-radius);
  color: var(--gb-text-muted);
  font-size: 0.75rem;
  line-height: 1.55;
}

@media (max-height: 48rem) and (min-width: 42.01rem) {
  .login__cabecera {
    margin-bottom: 1rem;
  }

  .login__cabecera p {
    margin-bottom: 0.375rem;
  }

  .login__cabecera span {
    font-size: 0.875rem;
  }

  .login__campo + .login__campo {
    margin-top: 0.75rem;
  }

  .login__enviar {
    margin-top: 1rem;
  }

  .login__demo {
    margin-top: 0.75rem;
  }
}

.login__demo code {
  color: var(--gb-red-text);
}
</style>
