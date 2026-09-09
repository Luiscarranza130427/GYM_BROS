import { mount } from '@vue/test-utils'
import { LayoutGrid } from 'lucide-vue-next'
import { describe, expect, it } from 'vitest'

import SidebarNavItem from '@/app/layouts/SidebarNavItem.vue'

const RouterLinkStub = {
  props: ['to'],
  template: '<a><slot /></a>',
}

const seccion = {
  name: 'dashboard',
  title: 'Dashboard',
  descripcion: 'Vista general',
  icono: LayoutGrid,
}

describe('SidebarNavItem', () => {
  it('presenta título, descripción e iconos decorativos', () => {
    const wrapper = mount(SidebarNavItem, {
      props: { seccion },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.get('.enlace__texto').text()).toBe('Dashboard')
    expect(wrapper.get('.enlace__descripcion').text()).toBe('Vista general')
    expect(
      wrapper.findAll('svg').every((icono) => icono.attributes('aria-hidden') === 'true'),
    ).toBe(true)
  })

  it('añade una ayuda textual cuando está contraído', () => {
    const wrapper = mount(SidebarNavItem, {
      props: { seccion, compacto: true },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.get('.enlace').classes()).toContain('enlace--compacto')
    expect(wrapper.get('.enlace').attributes('title')).toBe('Dashboard')
  })
})
