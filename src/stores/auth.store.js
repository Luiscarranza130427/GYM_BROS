import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import * as authService from '@/services/auth.service'
import { guardarSesion, leerSesion, limpiarSesion } from '@/services/session.storage'

/**
 * Estado de autenticación. Es global de verdad: lo consultan el router, el
 * layout administrativo y la cabecera, por eso vive en Pinia y no en un
 * componente.
 *
 * No guarda el mensaje de error del login: eso es estado local de la vista.
 * `iniciarSesion` lanza el HttpError y la vista decide cómo mostrarlo.
 */
export const useAuthStore = defineStore('auth', () => {
  // Rehidratación: permite recargar la página sin perder la sesión de desarrollo.
  const sesionPrevia = leerSesion()

  const usuario = ref(sesionPrevia?.usuario ?? null)
  const token = ref(sesionPrevia?.token ?? null)
  const cargando = ref(false)

  const estaAutenticado = computed(() => Boolean(token.value))

  async function iniciarSesion(credenciales) {
    cargando.value = true
    try {
      const sesion = await authService.iniciarSesion(credenciales)
      usuario.value = sesion.usuario
      token.value = sesion.token
      guardarSesion(sesion)
    } finally {
      cargando.value = false
    }
  }

  /**
   * Borra la sesión sólo en el cliente, sin llamar al backend.
   * Es lo que debe usarse al recibir un 401: llamar a /auth/logout con un token
   * ya inválido devolvería otro 401 y entraría en bucle.
   */
  function olvidarSesion() {
    usuario.value = null
    token.value = null
    limpiarSesion()
  }

  async function cerrarSesion() {
    try {
      await authService.cerrarSesion()
    } catch {
      // Si el backend falla al cerrar sesión, la sesión local se cierra igual:
      // dejar al usuario dentro sería peor que perder la llamada.
    } finally {
      olvidarSesion()
    }
  }

  return {
    usuario,
    token,
    cargando,
    estaAutenticado,
    iniciarSesion,
    cerrarSesion,
    olvidarSesion,
  }
})
