import { APP_NAME } from '@/config/env'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Control de acceso a las rutas.
 *
 * Vue Router 5 desaconseja el callback `next()`: los guards devuelven el
 * resultado (`true`, `false` o una ubicación a la que redirigir).
 *
 * @param {import('vue-router').RouteLocationNormalized} to
 */
export function guardAutenticacion(to) {
  const auth = useAuthStore()

  // Ruta privada sin sesión: al login, recordando a dónde quería ir.
  if (to.meta.requiresAuth && !auth.estaAutenticado) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Ruta sólo para invitados (login) con sesión abierta: al panel.
  if (to.meta.guestOnly && auth.estaAutenticado) {
    return { name: 'dashboard' }
  }

  return true
}

/**
 * Mantiene el título del documento sincronizado con la ruta activa.
 * Ejemplo: "Dashboard | Gym Bros".
 *
 * `afterEach` también se ejecuta cuando la navegación ha fallado o ha sido
 * redirigida por un guard; en ese caso el destino no llegó a mostrarse y poner
 * su título provocaría un parpadeo en la pestaña.
 */
export function aplicarTitulo(to, _from, fallo) {
  if (fallo) return

  document.title = to.meta.title ? `${to.meta.title} | ${APP_NAME}` : APP_NAME
}
