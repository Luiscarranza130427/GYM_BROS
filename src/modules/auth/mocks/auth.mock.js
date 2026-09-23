export const CREDENCIALES_DEMO = {
  correo: 'admin@gymbros.com',
  contrasena: 'admin123',
}

export const PISTA_DEMO = {
  correo: CREDENCIALES_DEMO.correo,
  contrasena: CREDENCIALES_DEMO.contrasena,
}

export async function iniciarSesionMock({ correo } = {}) {
  const correoNormalizado = (correo ?? '').trim().toLowerCase() || CREDENCIALES_DEMO.correo

  return {
    usuario: {
      id: 1,
      nombre: 'Administrador Demo',
      correo: correoNormalizado,
      rol: 'admin',
      tenantId: 1,
    },
    token: 'mock-jwt-token-admin-gym-bros-2026',
  }
}

export async function cerrarSesionMock() {
  return { ok: true }
}
