import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { CREDENCIALES_DEMO } from '@/mocks/auth.mock'
import { CLAVE_SESION } from '@/services/session.storage'
import { useAuthStore } from '@/stores/auth.store'

describe('auth.store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('arranca sin sesión', () => {
    const auth = useAuthStore()

    expect(auth.estaAutenticado).toBe(false)
    expect(auth.usuario).toBeNull()
  })

  it('guarda usuario y token tras un inicio de sesión correcto', async () => {
    const auth = useAuthStore()

    await auth.iniciarSesion(CREDENCIALES_DEMO)

    expect(auth.estaAutenticado).toBe(true)
    expect(auth.usuario.correo).toBe(CREDENCIALES_DEMO.correo)
    expect(auth.cargando).toBe(false)
    expect(localStorage.getItem(CLAVE_SESION)).not.toBeNull()
  })

  it('propaga el error y no autentica con credenciales incorrectas', async () => {
    const auth = useAuthStore()

    await expect(
      auth.iniciarSesion({ correo: 'otro@gymbros.test', contrasena: 'incorrecta' }),
    ).rejects.toThrow()

    expect(auth.estaAutenticado).toBe(false)
    expect(auth.cargando).toBe(false)
  })

  it('cerrarSesion limpia el estado y el almacenamiento', async () => {
    const auth = useAuthStore()
    await auth.iniciarSesion(CREDENCIALES_DEMO)

    await auth.cerrarSesion()

    expect(auth.estaAutenticado).toBe(false)
    expect(auth.usuario).toBeNull()
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull()
  })

  it('rehidrata la sesión guardada al crear el store', async () => {
    await useAuthStore().iniciarSesion(CREDENCIALES_DEMO)

    // Un Pinia nuevo simula una recarga de la página.
    setActivePinia(createPinia())

    expect(useAuthStore().estaAutenticado).toBe(true)
  })
})
