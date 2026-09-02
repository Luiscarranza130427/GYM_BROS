import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import * as authService from '@/core/auth/auth.service'
import { useAuthStore } from '@/core/auth/auth.store'
import * as storage from '@/core/storage/session.storage'

vi.mock('@/core/auth/auth.service')
vi.mock('@/core/storage/session.storage')

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('inicia vacío cuando no hay sesión previa', () => {
    vi.mocked(storage.leerSesion).mockReturnValue(null)
    const store = useAuthStore()

    expect(store.usuario).toBeNull()
    expect(store.token).toBeNull()
    expect(store.estaAutenticado).toBe(false)
  })

  it('inicia sesión y persiste los datos', async () => {
    const credenciales = { correo: 'admin@gymbros.com', contrasena: 'secret' }
    const respuesta = {
      usuario: { id: 1, nombre: 'Admin', correo: 'admin@gymbros.com', rol: 'admin' },
      token: 'jwt-token-123',
    }

    vi.mocked(authService.iniciarSesion).mockResolvedValue(respuesta)

    const store = useAuthStore()
    await store.iniciarSesion(credenciales)

    expect(store.usuario).toEqual(respuesta.usuario)
    expect(store.token).toBe('jwt-token-123')
    expect(store.estaAutenticado).toBe(true)
    expect(storage.guardarSesion).toHaveBeenCalledWith(respuesta)
  })

  it('cierra sesión y limpia el almacenamiento', async () => {
    const store = useAuthStore()
    store.usuario = { id: 1, nombre: 'Admin' }
    store.token = 'jwt-token-123'

    await store.cerrarSesion()

    expect(store.usuario).toBeNull()
    expect(store.token).toBeNull()
    expect(store.estaAutenticado).toBe(false)
    expect(storage.limpiarSesion).toHaveBeenCalled()
  })

  it('evalúa permisos con can()', () => {
    const store = useAuthStore()
    store.usuario = { id: 1, nombre: 'Super Admin', rol: 'super_admin' }

    expect(store.can('any.permission')).toBe(true)
  })
})
