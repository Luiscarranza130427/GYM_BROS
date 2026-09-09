import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import AppHeader from '@/app/layouts/AppHeader.vue'
import { useTenantStore } from '@/core/tenant/tenant.store'
import { useUiStore } from '@/shared/stores/ui.store'

const vacia = { template: '<div />' }

function crearRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/empresas',
        name: 'empresas-listado',
        component: vacia,
        meta: { title: 'Empresas' },
      },
      {
        path: '/usuarios',
        name: 'usuarios-listado',
        component: vacia,
        meta: { title: 'Usuarios' },
      },
    ],
  })
}

async function montar(rutaInicial = '/empresas') {
  const router = crearRouter()
  await router.push(rutaInicial)
  await router.isReady()

  return mount(AppHeader, {
    global: {
      plugins: [router],
      stubs: {
        NotificationButton: { template: '<div class="stub-notificaciones" />' },
        UserMenu: { template: '<div class="stub-usuario" />' },
      },
    },
  })
}

describe('AppHeader', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renderiza el título en mayúsculas y el subtítulo correspondiente a la sección', async () => {
    const wrapper = await montar('/empresas')

    expect(wrapper.get('.header__titulo').text()).toBe('Empresas')
    expect(wrapper.get('.header__subtitulo').text()).toBe('Gestión de empresas')
  })

  it('alterna el estado del menú lateral al hacer clic en el botón de hamburguesa', async () => {
    const ui = useUiStore()
    const wrapper = await montar('/empresas')

    expect(ui.sidebarCompacto).toBe(false)
    await wrapper.get('.header__toggle').trigger('click')
    expect(ui.sidebarCompacto).toBe(true)
  })

  it('muestra el campo de búsqueda con el placeholder adaptado al módulo actual', async () => {
    const wrapper = await montar('/empresas')
    const buscador = wrapper.get('.header__buscador-input')

    expect(buscador.attributes('placeholder')).toBe('Buscar empresas...')
  })

  it('adapta el placeholder cuando cambia de ruta', async () => {
    const wrapper = await montar('/usuarios')
    const buscador = wrapper.get('.header__buscador-input')

    expect(buscador.attributes('placeholder')).toBe('Buscar usuarios...')
    expect(wrapper.get('.header__subtitulo').text()).toBe('Gestión de usuarios')
  })

  it('aplica los colores personalizados de la empresa al header', async () => {
    const tenant = useTenantStore()
    tenant.fijarTenant({
      id: 7,
      nombre: 'Titan Gym',
      color1: '#101820',
      color2: '#ff6b00',
      activo: true,
    })

    const wrapper = await montar('/empresas')
    expect(wrapper.attributes('style')).toContain('--gb-header-accent: #ff6b00')
    expect(wrapper.attributes('style')).toContain('--gb-header-brand: #101820')
  })
})
