import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import LoginView from '@/modules/auth/views/LoginView.vue'

const alertas = vi.hoisted(() => {
  const fire = vi.fn(() => Promise.resolve())
  return {
    fire,
    mixin: vi.fn(() => ({ fire })),
  }
})

vi.mock('sweetalert2', () => ({
  default: { mixin: alertas.mixin },
}))

const vacia = { template: '<div />' }

function crearRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: vacia },
      { path: '/dashboard', name: 'dashboard', component: vacia },
    ],
  })
}

async function montarLogin() {
  const router = crearRouter()
  await router.push('/login')
  await router.isReady()

  return mount(LoginView, {
    global: { plugins: [createPinia(), router] },
  })
}

describe('LoginView', () => {
  beforeEach(() => {
    localStorage.clear()
    alertas.fire.mockClear()
  })

  it('muestra el formulario con etiquetas asociadas a sus campos', async () => {
    const wrapper = await montarLogin()

    const correo = wrapper.get('input#correo')
    const contrasena = wrapper.get('input#contrasena')

    expect(wrapper.get('label[for="correo"]').text()).toBe('Correo electrónico')
    expect(wrapper.get('label[for="contrasena"]').text()).toBe('Contraseña')
    expect(correo.attributes('autocomplete')).toBe('username')
    expect(contrasena.attributes('autocomplete')).toBe('current-password')
    expect(wrapper.get('button[type="submit"]').text()).toContain('Entrar')
  })

  it('no muestra ningún mensaje de error antes de enviar', async () => {
    const wrapper = await montarLogin()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('avisa de los campos vacíos en vez de dejar que falle la autenticación', async () => {
    const wrapper = await montarLogin()

    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('[role="alert"]').text()).toBe('Introduce tu correo y tu contraseña.')
    expect(wrapper.get('input#correo').attributes('aria-invalid')).toBe('true')
    expect(alertas.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: 'warning',
        title: 'Completa tu acceso',
        confirmButtonText: 'Entendido',
      }),
    )
  })

  it('configura la alerta con la identidad visual de Gym Bros', () => {
    expect(alertas.mixin).toHaveBeenCalledWith(
      expect.objectContaining({
        background: 'var(--gb-surface)',
        buttonsStyling: false,
        customClass: expect.objectContaining({
          container: 'login-swal',
          popup: 'login-swal__popup',
          confirmButton: 'btn btn-primary login-swal__confirmar',
        }),
      }),
    )
  })
})
