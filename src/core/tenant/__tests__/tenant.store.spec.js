import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useTenantStore } from '@/core/tenant/tenant.store'

describe('Tenant Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('inicia con estado de tenant vacío', () => {
    const store = useTenantStore()
    expect(store.tenant).toBeNull()
    expect(store.tenantId).toBeNull()
    expect(store.nombreTenant).toBe('Mi Gimnasio')
    expect(store.esActivo).toBe(false)
  })

  it('fija y limpia el tenant correctamente', () => {
    const store = useTenantStore()
    store.fijarTenant({ id: 42, nombre: 'Power Gym', activo: true })

    expect(store.tenantId).toBe(42)
    expect(store.nombreTenant).toBe('Power Gym')
    expect(store.esActivo).toBe(true)

    store.limpiarTenant()
    expect(store.tenant).toBeNull()
    expect(store.tenantId).toBeNull()
  })

  it('carga el tenant mock cuando se solicita', async () => {
    const store = useTenantStore()
    await store.cargarTenant()

    expect(store.tenantId).toBe(1)
    expect(store.nombreTenant).toBe('Gym Bros Central')
    expect(store.esActivo).toBe(true)
  })
})
