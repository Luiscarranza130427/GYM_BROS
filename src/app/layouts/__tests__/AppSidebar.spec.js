import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import AppSidebar from '@/app/layouts/AppSidebar.vue'
import { useAuthStore } from '@/core/auth/auth.store'
import { useTenantStore } from '@/core/tenant/tenant.store'
import { useUiStore } from '@/shared/stores/ui.store'

const RouterLinkStub = {
  props: ['to'],
  template: '<a :data-route="to.name"><slot /></a>',
}

function montar() {
  return mount(AppSidebar, {
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('AppSidebar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()

    const auth = useAuthStore()
    auth.usuario = { nombre: 'Joy Administradora', rol: 'Administrador' }

    const tenant = useTenantStore()
    tenant.fijarTenant({
      id: 7,
      nombre: 'Titan Gym',
      logo: 'empresas/titan.webp',
      color1: '#101820',
      color2: '#ff6b00',
      activo: true,
    })
  })

  it('aplica la identidad real de la empresa al menú lateral', () => {
    const wrapper = montar()

    expect(wrapper.attributes('style')).toContain('--gb-sidebar-accent: #ff6b00')
    expect(wrapper.attributes('style')).toContain('--gb-sidebar-brand: #101820')
    expect(wrapper.get('.sidebar__marca-logo').attributes('alt')).toBe('Logo de Titan Gym')
    expect(wrapper.find('.sidebar__empresa').exists()).toBe(false)
  })

  it('muestra las descripciones que orientan sobre cada módulo', () => {
    const wrapper = montar()

    expect(wrapper.text()).toContain('Vista general')
    expect(wrapper.text()).toContain('Miembros y accesos')
    expect(wrapper.text()).toContain('Cobros y transacciones')
  })

  it('conserva el modo compacto', () => {
    const ui = useUiStore()
    ui.sidebarCompacto = true
    const wrapper = montar()

    expect(wrapper.classes()).toContain('sidebar--compacto')
    expect(wrapper.get('.sidebar__marca-logo-wrapper').exists()).toBe(true)
  })
})
