import api from '@/core/api/api'
import { USE_MOCKS } from '@/core/config/env'
import {
  cerrarSesionMock,
  iniciarSesionMock,
  PISTA_DEMO,
} from '@/modules/auth/mocks/auth.mock'

export async function iniciarSesion({ correo, contrasena } = {}) {
  return iniciarSesionMock({ correo, contrasena })
}

export async function cerrarSesion() {
  if (USE_MOCKS) {
    return cerrarSesionMock()
  }

  try {
    await api.post('/logout')
  } catch {
    // Si la API falla al cerrar sesión en el servidor, cerramos la sesión local
  }
}

export async function pistaDeCredenciales() {
  if (!USE_MOCKS) return null
  return PISTA_DEMO
}
