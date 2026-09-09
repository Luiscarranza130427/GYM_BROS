import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import UsuarioCreateView from '@/modules/usuarios/views/UsuarioCreateView.vue'
import { crearUsuario, obtenerOpcionesEmpresas } from '@/modules/usuarios/services/usuarios.service'

const push = vi.fn(() => Promise.resolve())

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => ({ push }),
}))

vi.mock('@/modules/usuarios/services/usuarios.service', () => ({
  crearUsuario: vi.fn(),
  obtenerOpcionesEmpresas: vi.fn(),
}))

const montar = () =>
  mount(UsuarioCreateView, {
    global: {
      stubs: {
        PageHeader: true,
        RouterLink: { props: ['to'], template: '<a href="#"><slot /></a>' },
        UsuarioForm: {
          name: 'UsuarioForm',
          props: ['empresas', 'enviando', 'erroresServidor'],
          emits: ['submit', 'cancel'],
          template:
            "<div data-form><button data-save @click=\"$emit('submit', { nombre: 'Ana' })\">Guardar</button><button data-cancel @click=\"$emit('cancel')\">Cancelar</button></div>",
        },
      },
    },
  })

describe('UsuarioCreateView', () => {
  beforeEach(() => {
    push.mockReset().mockResolvedValue(undefined)
    crearUsuario.mockReset()
    obtenerOpcionesEmpresas.mockReset()
  })

  it('carga sólo empresas activas y crea el usuario', async () => {
    obtenerOpcionesEmpresas.mockResolvedValue([
      { id: 1, estado: 'active' },
      { id: 2, estado: 'inactive' },
    ])
    crearUsuario.mockResolvedValue({ id: 9 })
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.getComponent({ name: 'UsuarioForm' }).props('empresas')).toEqual([
      { id: 1, estado: 'active' },
    ])
    await wrapper.get('[data-save]').trigger('click')
    await flushPromises()

    expect(crearUsuario).toHaveBeenCalledWith({ nombre: 'Ana' })
    expect(push).toHaveBeenCalledWith({
      name: 'usuario-detalle',
      params: { id: 9 },
      query: { notice: 'created' },
    })
  })

  it('muestra el error de carga y permite reintentar', async () => {
    obtenerOpcionesEmpresas
      .mockRejectedValueOnce(new Error('API no disponible'))
      .mockResolvedValueOnce([])
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('API no disponible')
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-form]').exists()).toBe(true)
  })

  it('mantiene el formulario ante errores de validación y de negocio', async () => {
    obtenerOpcionesEmpresas.mockResolvedValue([])
    crearUsuario
      .mockRejectedValueOnce({ status: 422, errors: { correo: ['Ya existe.'] } })
      .mockRejectedValueOnce({ status: 422, message: 'La empresa alcanzó su límite.' })
    const wrapper = montar()
    await flushPromises()

    await wrapper.get('[data-save]').trigger('click')
    await flushPromises()
    expect(wrapper.getComponent({ name: 'UsuarioForm' }).props('erroresServidor')).toEqual({
      correo: ['Ya existe.'],
    })

    await wrapper.get('[data-save]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('La empresa alcanzó su límite.')
  })
})
