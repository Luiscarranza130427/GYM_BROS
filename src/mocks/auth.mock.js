import { HttpError } from '@/services/http-error'

/**
 * Autenticación simulada para desarrollar sin backend (VITE_USE_MOCKS=true).
 *
 * Devuelve exactamente la misma forma que se espera de Laravel y lanza el mismo
 * HttpError que el interceptor real, de modo que al apagar los mocks no cambia
 * nada en el store ni en las vistas.
 */

/**
 * Credenciales de desarrollo. NO son un secreto: sólo funcionan contra este
 * archivo y dejan de existir en cuanto VITE_USE_MOCKS pasa a false.
 */
export const CREDENCIALES_DEMO = {
  correo: 'admin@gymbros.test',
  contrasena: 'password123',
}

const USUARIO_DEMO = {
  id: 1,
  nombre: 'Administrador Demo',
  correo: CREDENCIALES_DEMO.correo,
  rol: 'admin',
}

/** Latencia simulada para que los estados de carga sean visibles. */
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Simula POST /auth/login */
export async function iniciarSesionMock({ correo, contrasena }) {
  await esperar(250)

  const credencialesValidas =
    correo === CREDENCIALES_DEMO.correo && contrasena === CREDENCIALES_DEMO.contrasena

  if (!credencialesValidas) {
    throw new HttpError({
      status: 422,
      message: 'El correo o la contraseña no son correctos.',
      errors: { correo: ['El correo o la contraseña no son correctos.'] },
    })
  }

  return {
    token: 'token-simulado-de-desarrollo',
    usuario: { ...USUARIO_DEMO },
  }
}

/** Simula POST /auth/logout */
export async function cerrarSesionMock() {
  await esperar(100)
}
