import { describe, expect, it } from 'vitest'

import { can } from '@/core/permissions/can'
import { PERMISOS } from '@/core/permissions/permissions'
import { ROLES } from '@/core/permissions/roles'

describe('RBAC - can() evaluation', () => {
  it('devuelve false si el usuario es nulo o indefinido', () => {
    expect(can(PERMISOS.USERS_READ, null)).toBe(false)
    expect(can(PERMISOS.USERS_READ, undefined)).toBe(false)
  })

  it('permite cualquier acción a un super_admin', () => {
    const superAdmin = { rol: ROLES.SUPER_ADMIN }
    expect(can(PERMISOS.USERS_DELETE, superAdmin)).toBe(true)
    expect(can(PERMISOS.COMPANIES_MANAGE, superAdmin)).toBe(true)
    expect(can(PERMISOS.BILLING_MANAGE, superAdmin)).toBe(true)
  })

  it('evalúa correctamente los permisos para un tenant_admin', () => {
    const tenantAdmin = { rol: ROLES.TENANT_ADMIN }
    expect(can(PERMISOS.USERS_READ, tenantAdmin)).toBe(true)
    expect(can(PERMISOS.EXERCISES_CREATE, tenantAdmin)).toBe(true)
    expect(can(PERMISOS.COMPANIES_MANAGE, tenantAdmin)).toBe(false)
  })

  it('evalúa permisos de un entrenador', () => {
    const entrenador = { rol: ROLES.TRAINER }
    expect(can(PERMISOS.EXERCISES_CREATE, entrenador)).toBe(true)
    expect(can(PERMISOS.USERS_DELETE, entrenador)).toBe(false)
  })

  it('respeta permisos explícitos provistos por el backend', () => {
    const usuarioPersonalizado = {
      rol: ROLES.MEMBER,
      permisos: [PERMISOS.USERS_READ, PERMISOS.EXERCISES_CREATE],
    }
    expect(can(PERMISOS.USERS_READ, usuarioPersonalizado)).toBe(true)
    expect(can(PERMISOS.EXERCISES_CREATE, usuarioPersonalizado)).toBe(true)
    expect(can(PERMISOS.USERS_DELETE, usuarioPersonalizado)).toBe(false)
  })
})
