import { USE_MOCKS } from '@/config/env'
import api from '@/services/api'
import { CREDENCIALES_DEMO, cerrarSesionMock, iniciarSesionMock } from '@/mocks/auth.mock'

/**
 * Única frontera entre la aplicación y el backend de autenticación.
 *
 * El interruptor de mocks vive AQUÍ y en ningún otro sitio: no debe aparecer
 * ningún `USE_MOCKS` en vistas, stores ni componentes. Cuando Laravel esté
 * disponible basta con poner VITE_USE_MOCKS=false.
 *
 * CONTRATO PROVISIONAL — pendiente de acordar con Natan:
 *   POST /auth/login   { correo, contrasena }  ->  { token, usuario }
 *   POST /auth/logout                          ->  204 sin cuerpo
 * Si Laravel devuelve otra forma (por ejemplo `access_token` o `user`), se
 * adapta en `normalizarSesion()` y el resto de la aplicación no se entera.
 */
function normalizarSesion(datos) {
  return {
    token: datos.token,
    usuario: datos.usuario,
  }
}

export async function iniciarSesion(credenciales) {
  if (USE_MOCKS) {
    return iniciarSesionMock(credenciales)
  }

  const { data } = await api.post('/auth/login', credenciales)
  return normalizarSesion(data)
}

export async function cerrarSesion() {
  if (USE_MOCKS) {
    return cerrarSesionMock()
  }

  await api.post('/auth/logout')
}

/**
 * Ayuda de desarrollo para la pantalla de acceso: devuelve las credenciales de
 * prueba mientras se trabaja con mocks y `null` cuando hay backend real.
 *
 * Existe para que la vista pueda mostrar la ayuda sin importar nada de
 * `@/mocks` ni consultar el entorno: sigue sin saber si hay backend o no.
 */
export function pistaDeCredenciales() {
  return USE_MOCKS ? CREDENCIALES_DEMO : null
}
