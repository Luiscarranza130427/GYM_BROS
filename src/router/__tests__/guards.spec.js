import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { CREDENCIALES_DEMO } from '@/mocks/auth.mock'
import { guardAutenticacion } from '@/router/guards'
import { useAuthStore } from '@/stores/auth.store'

/** Mínimo de una ruta resuelta que el guard necesita leer. */
const ruta = (meta, fullPath = '/dashboard') => ({ meta, fullPath })

describe('guardAutenticacion', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('envía al login y recuerda el destino si la ruta exige sesión', () => {
    const resultado = guardAutenticacion(ruta({ requiresAuth: true }))

    expect(resultado).toEqual({ name: 'login', query: { redirect: '/dashboard' } })
  })

  it('deja pasar una ruta pública sin sesión', () => {
    expect(guardAutenticacion(ruta({}, '/404'))).toBe(true)
  })

  it('deja pasar la ruta protegida cuando hay sesión', async () => {
    await useAuthStore().iniciarSesion(CREDENCIALES_DEMO)

    expect(guardAutenticacion(ruta({ requiresAuth: true }))).toBe(true)
  })

  it('saca del login a quien ya tiene sesión', async () => {
    await useAuthStore().iniciarSesion(CREDENCIALES_DEMO)

    expect(guardAutenticacion(ruta({ guestOnly: true }, '/login'))).toEqual({ name: 'dashboard' })
  })
})
