import { HttpError } from '@/core/api/http-error'

export const CREDENCIALES_DEMO = {
  correo: 'admin@gymbros.com',
  contrasena: 'admin123',
}

export const PISTA_DEMO = {
  correo: CREDENCIALES_DEMO.correo,
  contrasena: CREDENCIALES_DEMO.contrasena,
}

const LATENCIA_MOCK = 400

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function iniciarSesionMock({ correo, contrasena }) {
  await esperar(LATENCIA_MOCK)

  const correoNormalizado = (correo ?? '').trim().toLowerCase()
  const demoCorreo = CREDENCIALES_DEMO.correo.toLowerCase()

  if (correoNormalizado !== demoCorreo || contrasena !== CREDENCIALES_DEMO.contrasena) {
    throw new HttpError(401, 'Credenciales incorrectas. Revisa tu correo y contraseña.')
  }

  return {
    usuario: {
      id: 1,
      nombre: 'Administrador Demo',
      correo: CREDENCIALES_DEMO.correo,
      rol: 'admin',
      tenantId: 1,
    },
    token: 'mock-jwt-token-admin-gym-bros-2026',
  }
}

export async function cerrarSesionMock() {
  await esperar(150)
  return { ok: true }
}
